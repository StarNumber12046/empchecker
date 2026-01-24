import { z } from "zod";
import { inArray } from "drizzle-orm";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";
import { images, scans } from "~/server/db/schema";
import { computePHash, hammingDistance } from "~/lib/phash";
import { getEmbedding, getPineconeIndex } from "~/lib/vector";
import { auth } from "~/server/better-auth";
import { env } from "~/env";

export const empRouter = createTRPCRouter({
  checkAndStorePose: protectedProcedure
    .input(
      z.object({
        image: z.string().describe("Base64 encoded image string"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      console.log(
        "[checkAndStorePose] Starting image check and store procedure",
      );

      // Get discord account from user accounts
      const accounts = await auth.api.listUserAccounts({
        headers: ctx.headers,
      });
      console.log(
        "[checkAndStorePose] Retrieved user accounts:",
        accounts.length,
      );

      const discordAccount = accounts.find((a) => a.providerId === "discord");
      const discordId = discordAccount?.accountId;
      console.log(
        "[checkAndStorePose] Discord account found:",
        !!discordAccount,
        "ID:",
        discordId,
      );

      if (!discordId) {
        console.error("[checkAndStorePose] No discord account linked");
        throw new Error("User does not have a discord account linked");
      }

      // 1. Decode Image
      const base64Data = input.image.replace(/^data:image\/\w+;base64,/, "");
      const imageBuffer = Buffer.from(base64Data, "base64");
      console.log(
        "[checkAndStorePose] Image decoded. Buffer size:",
        imageBuffer.length,
        "bytes",
      );

      // 2. Pixel Check (pHash)
      const phash = await computePHash(imageBuffer);
      console.log("[checkAndStorePose] pHash computed:", phash);

      // Collect all matched images to aggregate scans later
      const matchedImageIds = new Set<number>();

      const existingImages = await db
        .select({
          id: images.id,
          phash: images.phash,
        })
        .from(images);
      console.log(
        "[checkAndStorePose] Retrieved existing images from DB:",
        existingImages.length,
      );

      for (const img of existingImages) {
        const distance = hammingDistance(phash, img.phash);
        console.log(
          "[checkAndStorePose] Hamming distance check - Image ID:",
          img.id,
          "Distance:",
          distance,
        );
        if (distance < 4) {
          console.log("[checkAndStorePose] Match found! Image ID:", img.id);
          matchedImageIds.add(img.id);
        }
      }
      console.log(
        "[checkAndStorePose] Total pHash matches:",
        matchedImageIds.size,
      );

      // 3. Pose Check (DINOv2/CLIP Embedding)
      const embedding = await getEmbedding(imageBuffer);
      console.log(
        "[checkAndStorePose] Embedding computed. Dimensions:",
        embedding.length,
      );

      const index = getPineconeIndex();
      console.log("[checkAndStorePose] Pinecone index retrieved");

      const vectorQuery = await index.query({
        vector: embedding,
        topK: 10,
        includeMetadata: true,
      });
      console.log(
        "[checkAndStorePose] Vector query completed. Matches found:",
        vectorQuery.matches?.length ?? 0,
      );

      if (vectorQuery.matches) {
        for (const match of vectorQuery.matches) {
          console.log(
            "[checkAndStorePose] Processing vector match - ID:",
            match.id,
            "Score:",
            match.score,
          );
          if (match.score && match.score > 0.96) {
            console.log(
              "[checkAndStorePose] High-score match detected - Score:",
              match.score,
            );
            matchedImageIds.add(parseInt(match.id));
          }
        }
      }
      console.log(
        "[checkAndStorePose] Total matches after vector query:",
        matchedImageIds.size,
      );

      let primaryImageId: number | undefined;

      if (matchedImageIds.size === 0) {
        console.log("[checkAndStorePose] No matches found. Creating new image");
        // No matches found -> Create New Image
        const result = await db
          .insert(images)
          .values({
            phash: phash,
          })
          .returning({ id: images.id });

        primaryImageId = result[0]!.id;
        console.log(
          "[checkAndStorePose] New image created with ID:",
          primaryImageId,
        );

        // Store in Vector DB
        await index.upsert([
          {
            id: primaryImageId.toString(),
            values: embedding,
            metadata: {
              phash: phash,
              // We don"t store discordId in metadata anymore for ownership logic,
              // but we could store "first scanner" if needed.
              // For now, keeping it minimal or consistent with schema refactor.
              // Leaving discordId out or putting current scanner as reference.
            },
          },
        ]);
        console.log("[checkAndStorePose] New image upserted to Pinecone");
      } else {
        // Matches found -> Use the first one as "Primary" for consistency
        // (or best logic: the one with lowest distance/highest score, but simplified here)
        primaryImageId = Array.from(matchedImageIds)[0];
        console.log(
          "[checkAndStorePose] Using existing image as primary. ID:",
          primaryImageId,
        );
      }

      if (!primaryImageId) throw new Error("Failed to resolve image ID");

      // 4. Record the Scan (Track everyone)
      // Check if this user has already scanned this image to avoid spamming DB?
      // "Track everyone sending the image" -> implies recording the event.
      // I"ll check first to prevent pure duplicates if that"s desired,
      // but usually "track everyone" means "list of unique users".
      console.log(
        "[checkAndStorePose] Checking for existing scan. ImageId:",
        primaryImageId,
        "DiscordId:",
        discordId,
      );
      const existingScan = await db.query.scans.findFirst({
        where: (scans, { and, eq }) =>
          and(
            eq(scans.imageId, primaryImageId),
            eq(scans.discordId, discordId),
          ),
      });
      console.log("[checkAndStorePose] Existing scan found:", !!existingScan);

      if (!existingScan) {
        console.log("[checkAndStorePose] Recording new scan");
        await db.insert(scans).values({
          imageId: primaryImageId,
          discordId: discordId,
        });
        console.log("[checkAndStorePose] Scan recorded successfully");
      }

      // 5. Retrieve ALL scans for this image (or matched images)
      // If we matched multiple images (rare but possible with fuzzy logic),
      // we should technically aggregate all scans for those "same" images.
      // For simplicity, we query scans for all matchedImageIds + the new one if created.
      const imageIdsToQuery = Array.from(matchedImageIds);
      if (matchedImageIds.size === 0) imageIdsToQuery.push(primaryImageId);
      console.log(
        "[checkAndStorePose] Querying scans for image IDs:",
        imageIdsToQuery,
      );

      const allScans = await db
        .select({ discordId: scans.discordId })
        .from(scans)
        .where(inArray(scans.imageId, imageIdsToQuery));
      console.log(
        "[checkAndStorePose] Retrieved scans from DB:",
        allScans.length,
      );

      const uploaders = allScans.map((s) => s.discordId);
      const uniqueUploaders = Array.from(new Set(uploaders));
      const hasCatOwner = uniqueUploaders.includes(env.CAT_OWNER_ID);
      console.log(
        "[checkAndStorePose] Unique uploaders:",
        uniqueUploaders.length,
        "Has cat owner:",
        hasCatOwner,
      );
      console.log("[checkAndStorePose] Uploaders list:", uniqueUploaders);

      // Filter out cat owner and current user from consideration
      const relevantUploaders = uniqueUploaders.filter(
        (u) => u !== env.CAT_OWNER_ID && u !== discordId,
      );
      console.log(
        "[checkAndStorePose] Relevant uploaders (excluding cat owner and current user):",
        relevantUploaders,
      );

      // Determine Status
      // Logic: Ignore cat owner in results. If only cat owner or no one has scanned it, treat as new.

      const isFirstScan = relevantUploaders.length === 0;
      console.log("[checkAndStorePose] Is first scan:", isFirstScan);

      if (!uniqueUploaders.includes(env.CAT_OWNER_ID) && isFirstScan) {
        console.log("[checkAndStorePose] Returning: never seen before, fake");
        return {
          status: "Image most likely fake",
          isReal: false,
          id: primaryImageId.toString(),
        };
      }

      // Has been scanned by non-cat-owner(s)
      const firstUploader = relevantUploaders[0];
      console.log(
        "[checkAndStorePose] Scanned by others. First uploader:",
        firstUploader,
      );

      if (hasCatOwner && !isFirstScan) {
        console.log(
          "[checkAndStorePose] Cat owner also scanned. Returning: already scanned by",
          firstUploader,
          ", real",
        );
        return {
          status: `already scanned by ${firstUploader}, real`,
          isReal: true,
          details: {
            matchId: primaryImageId,
            uploaderDiscordId: firstUploader,
          },
        };
      } else {
        return {
          status: `new image, real`,
          isReal: true,
          details: {
            matchId: primaryImageId,
            uploaderDiscordId: discordId,
          },
        };
      }
    }),
});

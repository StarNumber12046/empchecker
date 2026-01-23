import { z } from "zod";
import { eq } from "drizzle-orm";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";
import { images } from "~/server/db/schema";
import { computePHash, hammingDistance } from "~/lib/phash";
import { getEmbedding, getPineconeIndex } from "~/lib/vector";
import { auth } from "~/server/better-auth";

export const empRouter = createTRPCRouter({
  checkAndStorePose: protectedProcedure
    .input(
      z.object({
        image: z.string().describe("Base64 encoded image string"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Get discord account from user accounts
      const accounts = await auth.api.listUserAccounts({
        headers: ctx.headers,
      });
      const discordAccount = accounts.find((a) => a.providerId === "discord");
      const discordId = discordAccount?.accountId;

      if (!discordId) {
        throw new Error("User does not have a discord account linked");
      }

      // 1. Decode Image
      // Handle data URI scheme if present (e.g. "data:image/png;base64,...")
      const base64Data = input.image.replace(/^data:image\/\w+;base64,/, "");
      const imageBuffer = Buffer.from(base64Data, "base64");

      // 2. Pixel Check (pHash)
      const phash = await computePHash(imageBuffer);

      // Fetch existing hashes to check Hamming Distance
      const existingImages = await db
        .select({
          id: images.id,
          phash: images.phash,
          discordId: images.discordId,
        })
        .from(images);

      for (const img of existingImages) {
        const distance = hammingDistance(phash, img.phash);
        if (distance < 4) {
          return {
            status: "Duplicate Image",
            details: {
              matchId: img.id,
              distance,
              uploaderDiscordId: img.discordId,
            },
          };
        }
      }

      // 3. Pose Check (DINOv2/CLIP Embedding)
      const embedding = await getEmbedding(imageBuffer);
      const index = getPineconeIndex();

      // 4. Vector Search
      const vectorQuery = await index.query({
        vector: embedding,
        topK: 1,
        includeMetadata: true,
      });

      if (vectorQuery.matches.length > 0) {
        const topMatch = vectorQuery.matches[0];
        if (topMatch?.score && topMatch.score > 0.96) {
          // Fetch uploader discordId for the vector match
          const matchedImage = await db
            .select({ discordId: images.discordId })
            .from(images)
            .where(eq(images.id, parseInt(topMatch.id)))
            .then((res) => res[0]);

          return {
            status: "Existing Pose Detected",
            details: {
              matchId: topMatch.id,
              score: topMatch.score,
              uploaderDiscordId: matchedImage?.discordId,
            },
          };
        }
      }

      // 5. Store New Pose
      // Store in Relational DB
      const result = await db
        .insert(images)
        .values({
          phash: phash,
          discordId: discordId,
        })
        .returning({ id: images.id });

      const newId = result[0]!.id.toString();

      // Store in Vector DB
      await index.upsert([
        {
          id: newId,
          values: embedding,
          metadata: {
            phash: phash,
            discordId: discordId,
          },
        },
      ]);

      return {
        status: "new",
        id: newId,
      };
    }),
});

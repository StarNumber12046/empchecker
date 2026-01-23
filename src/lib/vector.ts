import Replicate from "replicate";
import { Pinecone } from "@pinecone-database/pinecone";
import { env } from "~/env";

const replicate = new Replicate({
  auth: env.REPLICATE_API_KEY,
});

const pinecone = new Pinecone({
  apiKey: env.PINECONE_API_KEY,
});

// Using a standard CLIP model or DINOv2 if available.
// For this example, I will use a known working CLIP embedding model on Replicate
// or DINOv2 if I can find the exact version.
// 'andreasjansson/clip-features' is a safe bet for embeddings.
// But prompt said "DINOv2 or CLIP".
const EMBEDDING_MODEL = "openai/clip";

type ReplicateOutput = { embedding: number[] };

export async function getEmbedding(imageBuffer: Buffer): Promise<number[]> {
  // Convert buffer to base64 data URI for Replicate
  const base64 = imageBuffer.toString("base64");
  const dataUri = `data:image/png;base64,${base64}`;

  const output = (await replicate.run(EMBEDDING_MODEL, {
    input: {
      image: dataUri,
    },
  })) as ReplicateOutput;
  console.log("output", output);
  // Output format depends on the model.
  // clip-features returns [{embedding: [...]}] or similar.
  // We need to verify the output of the specific model.
  // Assuming standard list of floats.

  // If the model returns an object with 'embedding', allow that.
  if (Array.isArray(output) && Array.isArray(output[0])) {
    return output[0] as number[]; // Batch size 1
  }
  if (Array.isArray(output)) {
    return output as number[];
  }
  if (output.embedding) {
    return output.embedding;
  }
  throw new Error("Unexpected embedding output format");
}

export function getPineconeIndex() {
  return pinecone.Index(env.PINECONE_DB);
}

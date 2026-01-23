import sharp from "sharp";
import { bmvbhash } from "blockhash-core";

export async function computePHash(imageBuffer: Buffer): Promise<string> {
  try {
    // blockhash-core expects { width, height, data }
    // data should be RGBA, but we have grayscale (1 channel). 
    // Wait, blockhash-core documentation says:
    // "The image data must be a sequence of RGBA pixels."
    // So we should output to valid raw RGBA.
    
    const rgbaData = await sharp(imageBuffer)
        .resize(16, 16, { fit: "fill" })
        .ensureAlpha() // Make sure we have alpha channel
        .raw()
        .toBuffer();

    // bmvbhash expects { width, height, data }
    const imageData = {
      width: 16,
      height: 16,
      data: new Uint8ClampedArray(rgbaData),
    };

    const hash = bmvbhash(imageData, 16);
    return hash;
  } catch (error) {
    console.error("Error computing pHash:", error);
    throw new Error("Failed to compute pHash");
  }
}

export function hammingDistance(hash1: string, hash2: string): number {
  let distance = 0;
  // Convert hex to binary strings or compare nibble by nibble
  // blockhash-core returns hex string.
  
  if (hash1.length !== hash2.length) {
      throw new Error("Hashes must be of equal length");
  }

  for (let i = 0; i < hash1.length; i++) {
      const n1 = parseInt(hash1[i]!, 16);
      const n2 = parseInt(hash2[i]!, 16);
      
      let x = n1 ^ n2;
      while (x > 0) {
          distance += x & 1;
          x >>= 1;
      }
  }
  
  return distance;
}

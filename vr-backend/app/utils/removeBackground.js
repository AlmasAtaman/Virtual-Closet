// vr-backend/app/utils/removeBackground.js
import Replicate from "replicate";
import fs from "fs";
import sharp from "sharp";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export async function removeBackground(localImagePath) {
  try {
    const originalBuffer = fs.readFileSync(localImagePath);
    const originalSizeMB = originalBuffer.length / (1024 * 1024);

    let imageBuffer = originalBuffer;

    // Smart compression: only compress if > 4MB
    if (originalSizeMB > 4) {
      imageBuffer = await sharp(originalBuffer)
        .resize(2000, 2000, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .png({ quality: 90, compressionLevel: 6 })
        .toBuffer();

      const compressedSizeMB = imageBuffer.length / (1024 * 1024);
      if (compressedSizeMB > 15) {
        throw new Error(`Image still too large after compression (${compressedSizeMB.toFixed(2)}MB). Please use a smaller image.`);
      }
    }

    const base64Image = `data:image/png;base64,${imageBuffer.toString('base64')}`;

    const output = await replicate.run(
      "851-labs/background-remover:a029dff38972b5fda4ec5d75d7d1cd25aeff621d2cf4946a41055d7db66b80bc",
      {
        input: {
          image: base64Image,
          format: "png",
          background_type: "rgba",
          threshold: 0
        }
      }
    );

    const outputPath = localImagePath.replace(/(\.\w+)$/, "_nobg.png");

    // Extract URL from output
    let imageUrl = output;
    if (typeof output === 'object' && output !== null) {
      imageUrl = output.toString();
    }

    if (typeof imageUrl === 'string' && (imageUrl.startsWith('http://') || imageUrl.startsWith('https://'))) {
      const fetch = (await import('node-fetch')).default;
      const response = await fetch(imageUrl);

      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      await fs.promises.writeFile(outputPath, buffer);
    } else {
      await fs.promises.writeFile(outputPath, output);
    }

    return outputPath;

  } catch (error) {
    console.error("Background removal error:", error);
    throw new Error(`Background removal failed: ${error.message}`);
  }
}
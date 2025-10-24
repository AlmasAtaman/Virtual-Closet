// vr-backend/app/utils/removeBackground.js
import Replicate from "replicate";
import fs from "fs";
import sharp from "sharp";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export async function removeBackground(localImagePath) {
  try {
    console.log(`\n🎨 ============ BACKGROUND REMOVAL ============`);
    console.log(`📁 Input file: ${localImagePath}`);

    // Read the original image file
    const originalBuffer = fs.readFileSync(localImagePath);
    const originalSizeMB = originalBuffer.length / (1024 * 1024);
    console.log(`📊 Original size: ${originalSizeMB.toFixed(2)}MB`);

    let imageBuffer = originalBuffer;

    // SMART COMPRESSION: Only compress if needed (> 4MB threshold)
    // This prevents PA errors with phone photos while keeping computer images at full quality
    if (originalSizeMB > 4) {
      console.log(`⚠️  Image exceeds 4MB threshold - applying smart compression...`);

      imageBuffer = await sharp(originalBuffer)
        .resize(2000, 2000, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .png({ quality: 90, compressionLevel: 6 })
        .toBuffer();

      const compressedSizeMB = imageBuffer.length / (1024 * 1024);
      console.log(`✅ Compressed: ${originalSizeMB.toFixed(2)}MB → ${compressedSizeMB.toFixed(2)}MB (${((1 - compressedSizeMB/originalSizeMB) * 100).toFixed(1)}% reduction)`);

      if (compressedSizeMB > 15) {
        throw new Error(`Image still too large after compression (${compressedSizeMB.toFixed(2)}MB). Please use a smaller image.`);
      }
    } else {
      console.log(`✅ Image size OK (< 4MB) - no compression needed`);
    }

    // Convert to base64
    const base64Image = `data:image/png;base64,${imageBuffer.toString('base64')}`;
    const base64SizeMB = base64Image.length / (1024 * 1024);
    console.log(`📤 Base64 payload size: ${base64SizeMB.toFixed(2)}MB`);

    // Run the model with correct parameters for TRANSPARENT background
    console.log(`🚀 Calling Replicate API...`);
    const output = await replicate.run(
      "851-labs/background-remover:a029dff38972b5fda4ec5d75d7d1cd25aeff621d2cf4946a41055d7db66b80bc",
      {
        input: {
          image: base64Image,
          format: "png",              // PNG format for transparency support
          background_type: "rgba",    // RGBA for transparent background (not black!)
          threshold: 0                // Soft alpha blending for smooth edges
        }
      }
    );

    console.log(`✅ Replicate API returned result`);
    console.log(`📦 Output type: ${typeof output}`);
    console.log(`🔗 Output value: ${output}`);
    console.log(`🔍 Output constructor: ${output?.constructor?.name}`);

    // The output is a URL - we need to fetch it
    const outputPath = localImagePath.replace(/(\.\w+)$/, "_nobg.png");

    // Extract URL from output (could be string, object, or FileOutput)
    let imageUrl = output;
    if (typeof output === 'object' && output !== null) {
      // Replicate returns FileOutput object with toString() method
      imageUrl = output.toString();
    }

    console.log(`📥 Extracted URL: ${imageUrl}`);

    if (typeof imageUrl === 'string' && (imageUrl.startsWith('http://') || imageUrl.startsWith('https://'))) {
      // Output is a URL - fetch it
      console.log(`⬇️  Downloading result from URL...`);
      const fetch = (await import('node-fetch')).default;
      const response = await fetch(imageUrl);

      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      await fs.promises.writeFile(outputPath, buffer);
      console.log(`✅ Downloaded and saved: ${outputPath} (${(buffer.length / 1024).toFixed(2)}KB)`);
    } else {
      // Output is already binary data (shouldn't happen with this model)
      console.log(`💾 Saving result directly...`);
      await fs.promises.writeFile(outputPath, output);
      console.log(`✅ Saved: ${outputPath}`);
    }

    console.log(`🎉 Background removal complete!`);
    console.log(`============================================\n`);
    return outputPath;

  } catch (error) {
    console.error("❌ Replicate background removal error:", error);
    throw new Error(`Background removal failed: ${error.message}`);
  }
}
import sharp from 'sharp';
import fs from 'fs';

/**
 * Trims transparent pixels from an image to get the tight bounding box
 * of the actual clothing item. This is critical for consistent standardization.
 *
 * Without trimming: A 2000x3000 photo with a small t-shirt in center remains 2000x3000
 * With trimming: The same image becomes ~600x800 (just the t-shirt bounds)
 *
 * This ensures standardization scales based on actual garment size, not photo size.
 *
 * @param {string} inputPath - Path to the background-removed image with transparency
 * @param {string} outputPath - Path where the trimmed image will be saved
 * @returns {Promise<{width: number, height: number}>} - Dimensions of trimmed image
 */
export async function trimTransparentPixels(inputPath, outputPath) {
  console.log(`\n✂️  ============ TRIMMING TRANSPARENT PIXELS ============`);
  console.log(`📥 Input: ${inputPath}`);

  try {
    // Read the image and get metadata
    const image = sharp(inputPath);
    const metadata = await image.metadata();

    console.log(`📐 Original dimensions: ${metadata.width}x${metadata.height}`);

    // Trim transparent/empty pixels around the image
    // This removes all the empty space and gives us just the clothing item
    const trimmedImage = await image
      .trim({
        background: { r: 0, g: 0, b: 0, alpha: 0 }, // Trim transparent pixels
        threshold: 10 // Small threshold to handle edge artifacts
      })
      .toBuffer();

    // Get metadata of trimmed image
    const trimmedMetadata = await sharp(trimmedImage).metadata();

    console.log(`✅ Trimmed dimensions: ${trimmedMetadata.width}x${trimmedMetadata.height}`);
    console.log(`📊 Reduction: ${Math.round((1 - (trimmedMetadata.width * trimmedMetadata.height) / (metadata.width * metadata.height)) * 100)}% smaller`);

    // Save the trimmed image as PNG to preserve transparency
    await sharp(trimmedImage)
      .png() // Force PNG format to maintain alpha channel
      .toFile(outputPath);

    console.log(`💾 Trimmed image saved: ${outputPath}`);
    console.log(`============ TRIM COMPLETE ============\n`);

    return {
      width: trimmedMetadata.width,
      height: trimmedMetadata.height
    };
  } catch (error) {
    console.error(`❌ Trim failed:`, error);
    throw new Error(`Failed to trim transparent pixels: ${error.message}`);
  }
}

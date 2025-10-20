import fs from 'fs';
import { removeBackground } from './removeBackground.js';
import { getClothingInfoFromImage } from './geminiLabeler.js';
import { uploadToS3 } from '../../s3.mjs';
import { standardizeImage } from './standardizeImage.js';
import { trimTransparentPixels } from './trimImage.js';

/**
 * Lightweight function for auto-fill: ONLY analyzes image with Gemini
 * Does NOT remove background, standardize, or upload to S3
 * Used by the "Auto-fill with AI" button
 */
export async function analyzeImageWithGemini(imageBuffer) {
  let tempPath = null;

  try {
    // Write temp file for Gemini (it needs a file path)
    tempPath = `temp_gemini_${Date.now()}.jpg`;
    fs.writeFileSync(tempPath, imageBuffer);

    // Call Gemini API to analyze the image
    const clothingData = await getClothingInfoFromImage(tempPath);

    // Cleanup temp file
    if (tempPath && fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }

    return clothingData;
  } catch (error) {
    // Cleanup on error
    if (tempPath && fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }
    throw error;
  }
}

export async function processImage(imageData, userId, options = {}) {
  const { type, data, originalname } = imageData;
  const { skipGemini = false, category = null } = options;
  let tempImagePath;
  let cleanedImagePath;
  let trimmedImagePath;
  let standardizedPath;

  console.log(`\n🔍 ============ STARTING IMAGE PROCESSING ============`);
  console.log(`📥 Input: type=${type}, userId=${userId}, originalname=${originalname}`);
  console.log(`⚙️  Options: skipGemini=${skipGemini}, category="${category}"`);

  try {
    // Handle direct file uploads
    if (type === 'file') {
      tempImagePath = `temp_${Date.now()}_${originalname}`;
      fs.writeFileSync(tempImagePath, data);
      console.log(`📁 Temp file created: ${tempImagePath}`);
    } else {
      throw new Error('Invalid image data type');
    }

    // 1. Remove background
    console.log(`\n🖼️  STEP 1: Removing background...`);
    cleanedImagePath = await removeBackground(tempImagePath);
    console.log(`✅ Background removed: ${cleanedImagePath}`);

    // 2. CRITICAL: Trim transparent pixels to get tight bounding box
    // This ensures all items are standardized based on actual garment size,
    // not the original photo dimensions with empty space
    console.log(`\n✂️  STEP 2: Trimming transparent pixels...`);
    trimmedImagePath = `trimmed_${Date.now()}_${originalname || 'clothing.png'}`;
    const trimmedDimensions = await trimTransparentPixels(cleanedImagePath, trimmedImagePath);
    console.log(`✅ Image trimmed to tight bounds: ${trimmedDimensions.width}x${trimmedDimensions.height}`);

    // 3. Get clothing info (conditionally)
    let clothingData = null;
    if (!skipGemini) {
      console.log(`\n🤖 STEP 3: Running Gemini analysis...`);
      // BONUS OPTIMIZATION: Use original image (tempImagePath) instead of cleaned image
      // Gemini can analyze the original - no need to wait for background removal!
      clothingData = await getClothingInfoFromImage(tempImagePath);
      console.log(`✅ Gemini result: type="${clothingData?.type}", isClothing=${clothingData?.isClothing}`);
    } else {
      console.log(`\n⏭️  STEP 3: Skipping Gemini (using form data)`);
      // For final submit without auto-fill, just mark as clothing without full analysis
      clothingData = { isClothing: true, type: null };
    }

    // 4. Determine the category to use for standardization
    // Priority: 1) User-selected category (from form), 2) AI-detected type, 3) Fall back to null
    const categoryForStandardization = category || clothingData?.type || null;

    console.log(`\n📏 STEP 4: Determining category for standardization...`);
    console.log(`   - Form category: "${category}"`);
    console.log(`   - Gemini type: "${clothingData?.type}"`);
    console.log(`   - FINAL category for standardization: "${categoryForStandardization}"`);

    // 5. Standardize the TRIMMED image to category-specific canvas
    standardizedPath = `standardized_${Date.now()}_${originalname || 'clothing.png'}`;
    console.log(`\n🎨 STEP 5: Calling standardizeImage() on TRIMMED image...`);
    console.log(`   - Input: ${trimmedImagePath} (trimmed)`);
    console.log(`   - Category: "${categoryForStandardization}"`);
    console.log(`   - Output: ${standardizedPath}`);
    await standardizeImage(trimmedImagePath, categoryForStandardization, standardizedPath);

    // 6. Read standardized image buffer (this is the one to upload and return)
    console.log(`\n📤 STEP 6: Reading standardized image buffer...`);
    let standardizedBuffer = fs.readFileSync(standardizedPath);
    console.log(`✅ Standardized buffer size: ${standardizedBuffer.length} bytes`);

    if (!clothingData?.isClothing) {
      throw new Error('Image is not valid clothing');
    }

    // 7. Upload to S3 if userId is provided
    let s3Key = null;
    if (userId) { // This check now prevents auto-fill uploads
      console.log(`\n☁️  STEP 7: Uploading STANDARDIZED image to S3...`);
      const file = {
        buffer: standardizedBuffer,
        originalname: originalname || 'processed.png',
        mimetype: 'image/png'
      };
      const { error, key } = await uploadToS3({ file, userId });
      if (error) throw new Error(error.message);
      s3Key = key;
      console.log(`✅ Image uploaded to S3 successfully!`);
      console.log(`   - S3 Key: ${key}`);
      console.log(`   - File size: ${standardizedBuffer.length} bytes`);
    } else {
      console.log(`\nℹ️  STEP 7: Skipping S3 upload (auto-fill request, no userId)`);
    }

    // Clean up temporary files
    console.log(`\n🧹 Cleaning up temporary files...`);
    fs.unlinkSync(tempImagePath);
    fs.unlinkSync(cleanedImagePath);
    fs.unlinkSync(trimmedImagePath);
    fs.unlinkSync(standardizedPath);
    console.log(`✅ Cleanup complete (4 temp files deleted)`);
    console.log(`\n============ IMAGE PROCESSING COMPLETE ============\n`);
    

    return {
      success: true,
      clothingData: {
        name: clothingData?.name || "",
        type: clothingData?.type || "",
        brand: clothingData?.brand || "",
        occasion: clothingData?.occasion || "",
        style: clothingData?.style || "",
        fit: clothingData?.fit?.toLowerCase() || "",
        color: clothingData?.color || "",
        material: clothingData?.material?.toLowerCase() || "",
        season: clothingData?.season?.toLowerCase() || "",
        isClothing: true,
      },
      imageBuffer: standardizedBuffer.toString('base64'),
      s3Key
    };
  } catch (error) {
    // Clean up temporary files if they exist
    console.log(`\n❌ Error occurred, cleaning up temporary files...`);
    if (tempImagePath && fs.existsSync(tempImagePath)) {
      fs.unlinkSync(tempImagePath);
    }
    if (cleanedImagePath && fs.existsSync(cleanedImagePath)) {
      fs.unlinkSync(cleanedImagePath);
    }
    if (trimmedImagePath && fs.existsSync(trimmedImagePath)) {
      fs.unlinkSync(trimmedImagePath);
    }
    if (standardizedPath && fs.existsSync(standardizedPath)) {
      fs.unlinkSync(standardizedPath);
    }

    throw error;
  }
} 
import fs from 'fs';
import { removeBackground } from './removeBackground.js';
import { getClothingInfoFromImage } from './geminiLabeler.js';
import { uploadToS3 } from '../../s3.mjs';
import { standardizeImage } from './standardizeImage.js';

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
  const { skipGemini = false } = options;
  let tempImagePath;
  let cleanedImagePath;
  let standardizedPath;

  try {
    // Handle direct file uploads
    if (type === 'file') {
      tempImagePath = `temp_${Date.now()}_${originalname}`;
      fs.writeFileSync(tempImagePath, data);
    } else {
      throw new Error('Invalid image data type');
    }

    // 1. Remove background
    cleanedImagePath = await removeBackground(tempImagePath);

    // 2. Get clothing info (conditionally)
    let clothingData = null;
    if (!skipGemini) {
      // BONUS OPTIMIZATION: Use original image (tempImagePath) instead of cleaned image
      // Gemini can analyze the original - no need to wait for background removal!
      clothingData = await getClothingInfoFromImage(tempImagePath);
    } else {
      // For final submit without auto-fill, just mark as clothing without full analysis
      clothingData = { isClothing: true, type: null };
    }

    // 3.5 Resize to standard canvas based on clothing type
    standardizedPath = `standardized_${Date.now()}_${originalname || 'clothing.png'}`;
    await standardizeImage(cleanedImagePath, clothingData?.type, standardizedPath);

    // 4. Read standardized image buffer (this is the one to upload and return)
    let standardizedBuffer = fs.readFileSync(standardizedPath);

    if (!clothingData?.isClothing) {
      throw new Error('Image is not valid clothing');
    }

    // 5. Upload to S3 if userId is provided
    let s3Key = null;
    if (userId) { // This check now prevents auto-fill uploads
      const file = {
        buffer: standardizedBuffer,
        originalname: originalname || 'processed.png',
        mimetype: 'image/png'
      };
      const { error, key } = await uploadToS3({ file, userId });
      if (error) throw new Error(error.message);
      s3Key = key;
      console.log('✅ Image uploaded to S3 for final submission:', key);
    } else {
      console.log('ℹ️ Skipping S3 upload for auto-fill request');
    }

    // Clean up temporary files
    fs.unlinkSync(tempImagePath);
    fs.unlinkSync(cleanedImagePath);
    fs.unlinkSync(standardizedPath);
    

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
    if (tempImagePath && fs.existsSync(tempImagePath)) {
      fs.unlinkSync(tempImagePath);
    }
    if (cleanedImagePath && fs.existsSync(cleanedImagePath)) {
      fs.unlinkSync(cleanedImagePath);
    }
    if (standardizedPath && fs.existsSync(standardizedPath)) {
      fs.unlinkSync(standardizedPath);
    }
    
    throw error;
  }
} 
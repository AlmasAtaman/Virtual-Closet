import fs from 'fs';
import { removeBackground } from './removeBackground.js';
import { getClothingInfoFromImage, analyzeBufferWithAI } from './openaiLabeler.js';
import { uploadToS3 } from '../../s3.mjs';
import { standardizeImage } from './standardizeImage.js';
import { trimTransparentPixels } from './trimImage.js';

/**
 * Lightweight function for auto-fill: ONLY analyzes image with AI
 * Does NOT remove background, standardize, or upload to S3
 */
export async function analyzeImageWithGemini(imageBuffer) {
  try {
    const clothingData = await analyzeBufferWithAI(imageBuffer);
    return clothingData;
  } catch (error) {
    console.error('AI detection failed:', error.message);
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

  try {
    if (type === 'file') {
      tempImagePath = `temp_${Date.now()}_${originalname}`;
      fs.writeFileSync(tempImagePath, data);
    } else {
      throw new Error('Invalid image data type');
    }

    // Run AI detection and background removal in parallel
    const [clothingData, cleanedPath] = await Promise.all([
      skipGemini
        ? Promise.resolve({ isClothing: true, type: null })
        : getClothingInfoFromImage(tempImagePath),
      removeBackground(tempImagePath)
    ]);

    cleanedImagePath = cleanedPath;

    // Trim transparent pixels
    const baseName = (originalname || 'clothing.png').replace(/\.[^.]+$/, '');
    trimmedImagePath = `trimmed_${Date.now()}_${baseName}.png`;
    await trimTransparentPixels(cleanedImagePath, trimmedImagePath);

    // Determine category for standardization
    const categoryForStandardization = category || clothingData?.type || null;

    // Standardize image
    standardizedPath = `standardized_${Date.now()}_${baseName}.png`;
    await standardizeImage(trimmedImagePath, categoryForStandardization, standardizedPath);

    // Read standardized buffer
    let standardizedBuffer = fs.readFileSync(standardizedPath);

    if (!clothingData?.isClothing) {
      throw new Error('Image is not valid clothing');
    }

    // Upload to S3 if userId provided
    let s3Key = null;
    if (userId) {
      const file = {
        buffer: standardizedBuffer,
        originalname: originalname || 'processed.png',
        mimetype: 'image/png'
      };
      const { error, key } = await uploadToS3({ file, userId });
      if (error) throw new Error(error.message);
      s3Key = key;
    }

    // Clean up temporary files
    fs.unlinkSync(tempImagePath);
    fs.unlinkSync(cleanedImagePath);
    fs.unlinkSync(trimmedImagePath);
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
    if (trimmedImagePath && fs.existsSync(trimmedImagePath)) {
      fs.unlinkSync(trimmedImagePath);
    }
    if (standardizedPath && fs.existsSync(standardizedPath)) {
      fs.unlinkSync(standardizedPath);
    }

    throw error;
  }
} 
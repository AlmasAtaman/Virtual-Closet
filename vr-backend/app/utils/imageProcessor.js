import axios from 'axios';
import fs from 'fs';
import { removeBackground } from './removeBackground.js';
import { getClothingInfoFromImage } from './geminiLabeler.js';
import { uploadToS3 } from '../../s3.mjs';
import { standardizeImage } from './standardizeImage.js';


export async function processImage(imageData, userId) {
  const { type, data, originalname } = imageData;
  let tempImagePath;
  let cleanedImagePath;
  let standardizedPath;

  try {
    // Handle both direct uploads and URL-based uploads
    if (type === 'url') {
      try {
        // Download image from URL
        const response = await axios.get(data, { 
          responseType: 'arraybuffer',
          timeout: 10000, // 10 second timeout
          validateStatus: function (status) {
            return status >= 200 && status < 300; // Only accept 2xx status codes
          }
        });
        
        if (!response.data || response.data.length === 0) {
          throw new Error('Empty response from image URL');
        }

        tempImagePath = `temp_${Date.now()}_${originalname || 'scraped.jpg'}`;
        fs.writeFileSync(tempImagePath, response.data);
      } catch (error) {
        console.error('Failed to download image from URL:', error);
        throw new Error(`Failed to download image: ${error.message}`);
      }
    } else if (type === 'file') {
      // Handle direct file upload
      tempImagePath = `temp_${Date.now()}_${originalname}`;
      fs.writeFileSync(tempImagePath, data);
    } else {
      throw new Error('Invalid image data type');
    }

    // 1. Remove background
    cleanedImagePath = await removeBackground(tempImagePath);

    // 2. Get clothing info
    const clothingData = await getClothingInfoFromImage(cleanedImagePath);

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
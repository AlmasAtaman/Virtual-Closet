import axios from 'axios';
import fs from 'fs';
import { removeBackground } from './removeBackground.js';
import { getClothingInfoFromImage } from './geminiLabeler.js';
import { uploadToS3 } from '../../s3.mjs';

export async function processImage(imageData, userId) {
  const { type, data, originalname } = imageData;
  let tempImagePath;
  let cleanedImagePath;

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

    // 2. Read cleaned image buffer
    const cleanedBuffer = fs.readFileSync(cleanedImagePath);

    // 3. Get clothing info
    const clothingData = await getClothingInfoFromImage(cleanedImagePath);

    if (!clothingData?.isClothing) {
      throw new Error('Image is not valid clothing');
    }

    // 4. Upload to S3 if userId is provided
    let s3Key = null;
    if (userId) {
      const file = {
        buffer: cleanedBuffer,
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

    return {
      success: true,
      clothingData: {
        name: clothingData?.name || "",
        type: clothingData?.type || "",
        brand: clothingData?.brand || "",
        occasion: clothingData?.occasion || "",
        style: clothingData?.style || "",
        fit: clothingData?.fit || "",
        color: clothingData?.color || "",
        material: clothingData?.material || "",
        season: clothingData?.season || "",
        isClothing: true,
      },
      imageBuffer: cleanedBuffer.toString('base64'),
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
    throw error;
  }
} 
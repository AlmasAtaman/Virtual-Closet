/**
 * OpenAI GPT-4o Mini Clothing Detection
 *
 * This module uses GPT-4o Mini Vision for fast clothing detection and metadata extraction.
 * Target: <500ms response time (10x faster than Gemini)
 * Cost: ~$0.00009 per image (negligible)
 */

import OpenAI from 'openai';
import dotenv from 'dotenv';
import fs from 'fs';
import { optimizeForAI, optimizeFileForAI } from './imageOptimizer.js';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Shared prompt for clothing analysis
const CLOTHING_ANALYSIS_PROMPT = `You are a fashion labeling assistant for a wardrobe management app.

Analyze this image and return a JSON object with these fields:

Required fields:
- "isClothing": boolean (true if this is ANY wearable item, clothing, shoes, accessories, jewelry, watches, bags, etc.)
- "name": short descriptive name (e.g., "Black Graphic Hoodie", "Slim Fit Jeans", "Silver Chronograph Watch")
- "brand": brand name if visible in image (like Fossil, Nike, Gucci), otherwise null
- "category": MAIN CATEGORY, one of: "tops", "bottoms", "outerwear", "dresses", "shoes", "accessories", "bags"
- "type": SUBCATEGORY within category, examples:
  * tops: "t-shirt", "shirt", "blouse", "tank top", "crop top", "sweater", "polo"
  * bottoms: "jeans", "pants", "shorts", "skirt", "leggings", "trousers", "chinos"
  * outerwear: "jacket", "coat", "blazer", "cardigan", "hoodie", "vest", "windbreaker", "parka", "bomber"
  * dresses: "mini dress", "midi dress", "maxi dress", "cocktail dress", "sundress"
  * shoes: "sneakers", "boots", "heels", "flats", "sandals", "loafers"
  * accessories: "watch", "hat", "scarf", "belt", "sunglasses", "eyeglasses", "jewelry", "necklace", "bracelet", "ring", "earrings", "cap", "beanie", "headband", "gloves", "tie", "bow tie", "suspenders"
  * bags: "handbag", "backpack", "tote", "clutch", "crossbody", "messenger"
- "tags": array of 1-3 style tags from: "casual", "elegant", "sporty", "vintage", "minimalist", "bohemian", "streetwear", "formal", "edgy", "preppy", "chic", "retro", "athleisure", "grunge", "romantic"
- "color": primary color like "Black", "White", "Red", "Blue", "Green", "Yellow", "Gray", "Brown", "Purple", "Pink", "Navy", "Beige", "Cream", "Orange", "Silver", "Gold"
- "season": one of "Spring", "Summer", "Fall", "Winter", "All Season"
- "size": size if visible in image (e.g., "M", "L", "XL", "28"), otherwise null

CRITICAL RULES:
- Watches, jewelry, accessories, bags, shoes ARE clothing items (isClothing: true)
- ONLY set isClothing to false for non-wearable items (furniture, electronics, food, etc.)
- Sneakers, boots, heels, sandals, loafers, flats = category "shoes" (NOT accessories!)
- Watches, hats, scarves, belts, jewelry = category "accessories" (NOT shoes!)
- Provide a value for ALL fields if isClothing is true (except size can be null)
- Make reasonable guesses based on visual information
- Tags array must have 1-3 items maximum
- Be specific with the type (subcategory)

Examples:

Hoodie:
{
  "isClothing": true,
  "name": "Black Graphic Hoodie",
  "brand": "Nike",
  "category": "outerwear",
  "type": "hoodie",
  "tags": ["casual", "streetwear"],
  "color": "Black",
  "season": "Fall",
  "size": null
}

Watch:
{
  "isClothing": true,
  "name": "Silver Chronograph Watch",
  "brand": "Fossil",
  "category": "accessories",
  "type": "watch",
  "tags": ["formal", "elegant"],
  "color": "Silver",
  "season": "All Season",
  "size": null
}

Jeans:
{
  "isClothing": true,
  "name": "Slim Fit Blue Jeans",
  "brand": "Levi's",
  "category": "bottoms",
  "type": "jeans",
  "tags": ["casual"],
  "color": "Blue",
  "season": "All Season",
  "size": "32"
}

Not clothing:
{
  "isClothing": false
}

Return ONLY the JSON object, no explanations.`;

/**
 * Analyze clothing image using GPT-4o Mini Vision
 *
 * @param {string} imagePath - Path to the image file
 * @returns {Promise<Object>} Clothing metadata
 */
export async function getClothingInfoFromImage(imagePath) {
  const startTime = Date.now();

  try {
    const optimizedBuffer = await optimizeFileForAI(imagePath);
    const base64Image = optimizedBuffer.toString('base64');

    // Call GPT-4o Mini Vision
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: CLOTHING_ANALYSIS_PROMPT
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
                detail: "low" // Use low detail for faster processing
              }
            }
          ]
        }
      ],
      max_tokens: 300,
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    const clothingData = JSON.parse(content);

    return clothingData;

  } catch (error) {
    console.error('[GPT-4o Mini] Detection failed:', error.message);
    return {
      isClothing: false,
      error: error.message
    };
  }
}

/**
 * Analyze clothing from buffer (no temp file needed!)
 * ✅ OPTIMIZATION: Avoids 100-400ms of disk I/O overhead
 *
 * @param {Buffer} imageBuffer - Image buffer
 * @returns {Promise<Object>} Clothing metadata
 */
export async function analyzeBufferWithAI(imageBuffer) {
  try {
    const optimizedBuffer = await optimizeForAI(imageBuffer);
    const base64Image = optimizedBuffer.toString('base64');

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: CLOTHING_ANALYSIS_PROMPT
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
                detail: "low"
              }
            }
          ]
        }
      ],
      max_tokens: 300,
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    const clothingData = JSON.parse(content);

    return clothingData;

  } catch (error) {
    console.error('[GPT-4o Mini] Detection failed:', error.message);
    return {
      isClothing: false,
      error: error.message
    };
  }
}

/**
 * Analyze clothing from image URL (alternative to file path)
 * Useful for web scraping scenarios
 *
 * @param {string} imageUrl - Public URL of the image
 * @returns {Promise<Object>} Clothing metadata
 */
export async function getClothingInfoFromUrl(imageUrl) {
  try {

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `You are a fashion labeling assistant for a wardrobe management app.

Analyze this clothing item image and return a JSON object with these fields:

Required fields:
- "isClothing": boolean (true if this is a clothing item)
- "name": short descriptive name (e.g., "Black Graphic Hoodie", "Slim Fit Jeans")
- "brand": brand name if visible in image, otherwise null
- "category": MAIN CATEGORY, one of: "tops", "bottoms", "outerwear", "dresses", "shoes", "accessories", "bags"
- "type": SUBCATEGORY within category
- "tags": array of 1-3 style tags from: "casual", "elegant", "sporty", "vintage", "minimalist", "bohemian", "streetwear", "formal", "edgy", "preppy", "chic", "retro", "athleisure", "grunge", "romantic"
- "color": primary color
- "season": one of "Spring", "Summer", "Fall", "Winter", "All Season"
- "size": size if visible, otherwise null

Return ONLY the JSON object, no explanations.`
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
                detail: "low"
              }
            }
          ]
        }
      ],
      max_tokens: 300,
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    const clothingData = JSON.parse(content);

    return clothingData;

  } catch (error) {
    console.error('[GPT-4o Mini] URL detection failed:', error.message);
    return {
      isClothing: false,
      error: error.message
    };
  }
}

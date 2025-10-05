import dotenv from 'dotenv';
dotenv.config();

// Use the new SDK for better compatibility
import { GoogleGenAI } from '@google/genai';

const client = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

/**
 * Extract product data from HTML content
 * This is used by the Playwright scraper as a fallback
 * Note: The URL context approach (quick.gemini.v2.js) is preferred
 */
export async function extractProductData(html) {

    const model = "gemini-2.5-flash";

    const prompt = `
    You are a product metadata extractor for fashion e-commerce.

    From the provided HTML, return only a pure JSON object in the following format:

    {
    "isClothing": boolean,
    "name": "...",
    "brand": "...",
    "type": "...",
    "price": "...",
    "occasion": "...",
    "style": "...",
    "fit": "...",
    "color": "...",
    "material": "...",
    "season": "...",
    "sourceUrl": "...",
    "imageGallery": ["url1", "url2", "..."]
    }

    Guidelines:
    - Analyze the HTML to identify a single clothing item if present.
    - Set "isClothing" to true if a single clothing item is clearly identified, otherwise set to false.
    - If "isClothing" is true, fill in the following fields based on the clothing item:
      - "name": a short descriptive name,
      - "brand": guessed brand name (e.g. "Nike", "Adidas"), or null if unknown
      - "type": one of ["T-shirt", "Jacket", "Pants", "Shoes", "Hat", "Sweater", "Shorts", "Dress", "Skirt"], or null.
      - "price": numeric string or number only, e.g. "39.99" or 39.99. Null if not found.
      - "occasion": one of ["Casual", "Formal", "Party", "Athletic"], or null.
      - "style": one of ["Streetwear", "Minimalist", "Old Money", "Y2K", "Preppy"], or null.
      - "fit": one of ["slim", "regular", "oversized", "baggy", "crop", "skinny", "tapered"]
      - "color": one of basic colors like ["Black", "White", "Red", "Blue", "Green", "Yellow", "Gray", "Brown", "Purple", "Pink"]
      - "material": one of ["cotton", "linen", "denim", "leather", "knit", "polyester"]
      - "season": one of ["spring", "summer", "fall", "winter"]
      - "sourceUrl": the URL of the product page.
      - "imageGallery": an array of high-quality image URLs for the product.
    - If "isClothing" is false, all other fields should be null or empty arrays.
    - Only return the specified JSON object. Do not include any other text, explanations, or fields.

    **IMPORTANT**: You MUST provide a value for every field if "isClothing" is true (except 'price' if not found).
    If you are unsure about a field, make an educated guess based on the available information. NEVER use null or empty strings for any field except price.
    
    **CRITICAL FIELD GUIDANCE**:
    - For "style": If unclear, default to "Streetwear" or make a reasonable guess from the 5 options based on brand/aesthetic
    - For "fit": If unclear, default to "regular" or guess based on clothing type (e.g., "oversized" for hoodies)
    - For "material": Make educated guesses based on clothing type (e.g., "cotton" for t-shirts, "denim" for jeans)
    - For "season": Consider the clothing type and weight (e.g., "summer" for t-shirts, "fall" for jackets)
    - For "occasion": Default to "Casual" unless clearly formal/athletic wear
    - For "color": Identify primary color even if pattern exists

    HTML:
    \`\`\`html
    ${html}
    \`\`\`
    `.trim();

  try {
    const result = await client.models.generateContent({
      model: model,
      contents: [prompt]
    });
    const text = result.text.trim();

    const cleaned = text.replace(/```json|```/g, "").trim();
    const match = cleaned.match(/\{[\s\S]*?\}/);
    if (!match) throw new Error("No JSON found in Gemini response");

    return JSON.parse(match[0]);
  } catch (err) {
    return {
      isClothing: false,
      name: null,
      brand: null,
      type: null,
      occasion: null,
      style: null,
      fit: null,
      color: null,
      material: null,
      season: null,
      sourceUrl: null,
      imageGallery: []
    };
  }
}

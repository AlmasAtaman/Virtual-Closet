import dotenv from 'dotenv';
dotenv.config();

import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function extractProductData(html) {
  const model = genAI.getGenerativeModel({
    model: 'models/gemini-1.5-flash-001',
  });

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
      - "name": a short descriptive name.
      - "brand": guessed brand name (e.g. "Nike", "Adidas"), or null if unknown
      - "type": one of ["T-shirt", "Jacket", "Pants", "Shoes", "Hat", "Sweater", "Shorts", "Dress", "Skirt"], or null.
      - "price": numeric string or number only, e.g. "39.99" or 39.99. Null if not found.
      - "occasion": one of ["Casual", "Formal", "Party", "Athletic"], or null.
      - "style": one of ["Streetwear", "Minimalist", "Old Money", "Y2K", "Preppy"], or null.
      - "fit": one of ["Slim Fit", "Regular Fit", "Oversized Fit", "Crop Fit", "Skinny", "Tapered"], or null.
      - "color": one of basic colors like ["Black", "White", "Red", "Blue", "Green", "Yellow", "Gray", "Brown", "Purple", "Pink"], or null.
      - "material": one of ["Cotton", "Linen", "Denim", "Leather", "Knit", "Polyester"], or null.
      - "season": one of ["Spring", "Summer", "Fall", "Winter"], or null.
      - "sourceUrl": the URL of the product page.
      - "imageGallery": an array of high-quality image URLs for the product.
    - If "isClothing" is false, all other fields should be null or empty arrays.
    - Only return the specified JSON object. Do not include any other text, explanations, or fields.

    HTML:
    \`\`\`html
    ${html}
    \`\`\`
    `.trim();


  const result = await model.generateContent(prompt);
  const text = await result.response.text();

  try {
    const match = text.match(/{[\s\S]*}/);
    if (!match) throw new Error("No JSON found in Gemini response");
    return JSON.parse(match[0]);
  } catch (err) {
    console.error("Failed to parse Gemini response:", text);
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

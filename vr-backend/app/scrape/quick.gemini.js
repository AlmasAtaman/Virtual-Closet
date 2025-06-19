import dotenv from 'dotenv';
dotenv.config();

import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function extractProductData(html) {
  console.log("Gemini key is:", process.env.GEMINI_API_KEY);

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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
    "sourceUrl": "..."
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
    - If "isClothing" is false, all other fields should be null or empty arrays.
    - Only return the specified JSON object. Do not include any other text, explanations, or fields.

    **IMPORTANT**: You MUST provide a value for every field if "isClothing" is true (except 'price' if not found).
    If you are unsure about a field, make a reasonable guess based on the HTML content. Do not use null.

    HTML:
    \`\`\`html
    ${html}
    \`\`\`
    `.trim();

  try {
    const result = await model.generateContent(prompt);
    const text = await result.response.text();

    // Robust JSON extraction logic from demo
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}') + 1;
    const jsonText = text.slice(jsonStart, jsonEnd);
    return JSON.parse(jsonText);
  } catch (err) {
    console.error("‼️ Gemini crashed or returned bad JSON:", err);
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
    };
  }
}

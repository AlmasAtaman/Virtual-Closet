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

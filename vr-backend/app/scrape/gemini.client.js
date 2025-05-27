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
    "name": "...",
    "brand": "...",
    "price": "...",
    "currency": "...",
    "description": "...",
    "type": "...",
    "occasion": "...",
    "style": "...",
    "fit": "...",
    "color": "...",
    "material": "...",
    "season": "...",
    "notes": "...",
    "imageGallery": ["url1", "url2", "..."],
    "sourceUrl": "..."
    }

    Guidelines:
    - Fill in as many fields as possible. Use null if not found.
    - For “notes”, include extra info like features, style tips, etc.
    - Prioritize high-quality product images only in imageGallery.

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
      name: null,
      brand: null,
      price: null,
      currency: null,
      description: null,
      type: null,
      occasion: null,
      style: null,
      fit: null,
      color: null,
      material: null,
      season: null,
      notes: null,
      imageGallery: [],
      sourceUrl: null
    };
  }
}

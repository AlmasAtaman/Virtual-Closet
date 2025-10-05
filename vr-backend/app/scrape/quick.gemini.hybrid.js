import dotenv from 'dotenv';
dotenv.config();

console.log('🔍 LOADING quick.gemini.hybrid.js - HYBRID VERSION (URL context + Google Search fallback)');

import { GoogleGenAI } from '@google/genai';

const client = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

/**
 * Hybrid extraction strategy:
 * 1. Try URL context first (fast, 3-5 seconds)
 * 2. If price or color missing, use Google Search fallback (slower but more reliable)
 */
export async function extractProductDataFromUrl(url) {
  try {
    console.log(`[Hybrid Extraction] Starting for: ${url}`);
    const startTime = Date.now();

    const model = "gemini-2.5-flash";

    const prompt = `Extract product info from: ${url}

Return JSON:
{
  "isClothing": true/false,
  "name": "product name",
  "brand": "brand",
  "type": "T-shirt|Jacket|Pants|Shoes|Hat|Sweater|Shorts|Dress|Skirt",
  "price": "number only",
  "occasion": "Casual|Formal|Party|Athletic",
  "style": "Streetwear|Minimalist|Old Money|Y2K|Preppy",
  "fit": "slim|regular|oversized|baggy|crop|skinny|tapered",
  "color": "Black|White|Red|Blue|Green|Yellow|Gray|Brown|Purple|Pink",
  "material": "cotton|linen|denim|leather|knit|polyester",
  "season": "spring|summer|fall|winter"
}

IMPORTANT:
- isClothing=true if it's clothing/shoes
- price: numeric only (e.g. "49.99" or "49.90")
- color: pick ONE dominant color from the list
- Make educated guesses for any missing fields
- Return ONLY JSON, no text before or after`;

    // STEP 1: Try URL context first (FAST)
    console.log('[URL Context] Trying fast URL context extraction...');
    const response1 = await client.models.generateContent({
      model: model,
      contents: [prompt],
      config: {
        tools: [{ urlContext: {} }],
        temperature: 0.1
      }
    });

    const text1 = response1.text || '';
    console.log(`[URL Context] Raw response preview: ${text1.substring(0, 200)}...`);

    const cleaned1 = text1.replace(/```(?:json)?\n?/g, '').trim();
    const jsonMatch1 = cleaned1.match(/\{[\s\S]*?\}/);

    if (jsonMatch1) {
      let parsed1;
      try {
        parsed1 = JSON.parse(jsonMatch1[0]);
      } catch (parseErr) {
        console.error('[URL Context] JSON parse error:', parseErr.message);
        console.error('[URL Context] Attempted to parse:', jsonMatch1[0]);
        throw new Error('Invalid JSON format from Gemini');
      }
      const urlContextTime = Date.now() - startTime;

      console.log(`[URL Context] Completed in ${urlContextTime}ms`);
      console.log(`[URL Context] Result - Price: ${parsed1.price || 'null'}, Color: ${parsed1.color || 'null'}`);

      // STEP 2: Check if we need Google Search fallback
      if (parsed1.isClothing && (!parsed1.price || !parsed1.color)) {
        console.log(`[Google Search] Price or color missing, using Google Search fallback...`);
        const searchStartTime = Date.now();

        const searchPrompt = `Find product at ${url} and extract:
- Price (numeric only, e.g. "49.99")
- Color (one of: Black|White|Red|Blue|Green|Yellow|Gray|Brown|Purple|Pink)

Return JSON:
{
  "price": "number",
  "color": "color name"
}`;

        try {
          const response2 = await Promise.race([
            client.models.generateContent({
              model: model,
              contents: [searchPrompt],
              config: {
                tools: [{ googleSearch: {} }],
                temperature: 0.1
              }
            }),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Google Search timeout')), 8000)
            )
          ]);

          const text2 = response2.text || '';
          const cleaned2 = text2.replace(/```(?:json)?\n?/g, '').trim();
          const jsonMatch2 = cleaned2.match(/\{[\s\S]*?\}/);

          if (jsonMatch2) {
            const parsed2 = JSON.parse(jsonMatch2[0]);
            const searchTime = Date.now() - searchStartTime;
            console.log(`[Google Search] Completed in ${searchTime}ms`);
            console.log(`[Google Search] Found - Price: ${parsed2.price}, Color: ${parsed2.color}`);

            // Merge results
            if (parsed2.price && !parsed1.price) parsed1.price = parsed2.price;
            if (parsed2.color && !parsed1.color) parsed1.color = parsed2.color;
          }
        } catch (searchErr) {
          console.error('[Google Search] Fallback failed:', searchErr.message);
          // Continue with URL context data
        }
      }

      const totalTime = Date.now() - startTime;
      console.log(`[Hybrid] ✅ Total time: ${totalTime}ms`);
      return parsed1;
    }

    throw new Error('No valid JSON in response');

  } catch (err) {
    console.error("❌ Hybrid extraction failed:", err.message);
    console.error("Full error:", err.stack);

    return {
      isClothing: false,
      name: null,
      brand: null,
      type: null,
      price: null,
      occasion: null,
      style: null,
      fit: null,
      color: null,
      material: null,
      season: null,
      _error: err.message
    };
  }
}

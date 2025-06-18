import axios from 'axios';
import { extractProductData } from './quick.gemini.js';
import * as cheerio from 'cheerio';
import { scrapeProduct as playwrightScrapeProduct } from './scrape.controller.js';

export async function scrapeProduct(req, res) {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL required' });

  // Try quick scrape first
  try {
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
      }
    });
    const html = response.data;
    const $ = cheerio.load(html);
    const mainContent = $('main').html() || $('body').html();
    const structured = await extractProductData(mainContent);

    // If quick scrape found clothing, return it
    if (structured && structured.isClothing) {
      return res.json({
        ...structured,
        sourceUrl: url,
        _method: 'quick',
      });
    } else {
      // Otherwise, fall through to Playwright
      console.log('Quick scrape did not find clothing, falling back to Playwright...');
    }
  } catch (err) {
    console.warn('Quick scrape error, falling back to Playwright:', err.message, err.response?.status);
    // Fall through to Playwright
  }

  // Fallback: Playwright scrape
  try {
    // Call the Playwright-based scrapeProduct, passing req and res
    await playwrightScrapeProduct(req, res);
  } catch (err) {
    console.error('Playwright scrape also failed:', err.message);
    res.status(500).json({ error: 'Both quick and full scrape failed', details: err.message });
  }
} 
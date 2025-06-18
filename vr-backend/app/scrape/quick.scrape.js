import axios from 'axios';
import { extractProductData } from './quick.gemini.js';
import * as cheerio from 'cheerio';

export async function scrapeProduct(req, res) {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL required' });

  try {
    const response = await axios.get(url, { timeout: 10000 });
    const html = response.data;
    const $ = cheerio.load(html);
    const mainContent = $('main').html() || $('body').html();
    const structured = await extractProductData(mainContent);

    res.json({
      ...structured,
      sourceUrl: url,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Scraping failed', details: err.message });
  }
} 
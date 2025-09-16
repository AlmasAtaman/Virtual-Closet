import axios from 'axios';
import { extractProductData } from './quick.gemini.js';
import * as cheerio from 'cheerio';

export async function scrapeProduct(req, res) {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL required' });

  // Quick axios + Gemini extraction only
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

    // Return metadata if Gemini identifies this as clothing
    if (structured && structured.isClothing) {
      return res.json({
        ...structured,
        sourceUrl: url,
        _method: 'quick',
        _extractionSuccess: true,
        _hasMetadata: !!(structured.name || structured.brand || structured.price || structured.type)
      });
    } else {
      // Return error if Gemini says this is not clothing
      console.log('Quick scrape determined this is not a clothing item');
      return res.status(400).json({
        error: 'This URL does not appear to contain a clothing item according to AI analysis.',
        _method: 'quick',
        _extractionSuccess: false,
        _reason: 'not_clothing'
      });
    }
  } catch (err) {
    console.warn('Quick scrape error:', err.message, err.response?.status);
    // Return appropriate error status
    const status = err.response?.status || 500;
    return res.status(status).json({
      error: err.message,
      _method: 'quick',
      _extractionSuccess: false,
      _errorStatus: status,
      sourceUrl: url
    });
  }
} 
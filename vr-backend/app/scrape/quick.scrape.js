import { extractProductDataFromUrl } from './quick.gemini.hybrid.js';

/**
 * HYBRID URL scraping - Fast and Accurate
 * 1. Tries URL context first (3-5 seconds, fast)
 * 2. Falls back to Google Search only if price/color missing
 * Best of both worlds: speed + accuracy
 */
export async function scrapeProduct(req, res) {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL required' });

  console.log(`[Quick Scrape FINAL] Processing URL: ${url}`);

  try {
    const structured = await extractProductDataFromUrl(url);

    if (structured._error) {
      console.warn('[Quick Scrape] Gemini extraction error:', structured._error);
      return res.status(500).json({
        error: 'Failed to extract product data. Please try again or enter details manually.',
        _method: 'hybrid-v1',
        _extractionSuccess: false,
        _errorType: 'gemini_error',
        _technicalError: structured._error,
        sourceUrl: url
      });
    }

    if (structured && structured.isClothing) {
      console.log('[Quick Scrape] ✅ Clothing detected | Price:', structured.price, '| Color:', structured.color);
      return res.json({
        ...structured,
        sourceUrl: url,
        _method: 'hybrid-v1',
        _extractionSuccess: true,
        _hasMetadata: !!(structured.name || structured.brand || structured.price || structured.type)
      });
    } else {
      console.log('[Quick Scrape] ❌ Not a clothing item');
      return res.status(400).json({
        error: 'This URL does not appear to contain a clothing item according to AI analysis.',
        _method: 'hybrid-v1',
        _extractionSuccess: false,
        _reason: 'not_clothing',
        sourceUrl: url
      });
    }
  } catch (err) {
    console.error('[Quick Scrape] Unexpected error:', err);

    return res.status(500).json({
      error: 'An unexpected error occurred while processing the URL. Please try again.',
      _method: 'grounding-v3',
      _extractionSuccess: false,
      _errorType: 'unexpected',
      _technicalError: err.message,
      sourceUrl: url
    });
  }
}

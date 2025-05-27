import playwright from 'playwright';
import * as cheerio from 'cheerio';
import { extractProductData } from './gemini.client.js';
import { processImage } from '../utils/imageProcessor.js';

function normalizeUrl(raw, baseUrl) {
  if (!raw) return null;
  if (raw.startsWith("//")) return "https:" + raw;
  if (raw.startsWith("/")) return new URL(raw, baseUrl).href;
  return raw;
}

export async function scrapeProduct(req, res) {
  const { url, process } = req.body;
  if (!url) return res.status(400).json({ error: 'URL required' });

  let browser;

  try {
    if (process) {
      const processedImage = await processImage({
        type: 'url',
        data: url,
        originalname: 'product.jpg'
      }, req.user?.id);

      return res.json({
        success: true,
        processedImage: processedImage
      });
    }

    browser = await playwright.webkit.launch({ headless: true });
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
    });
    const page = await context.newPage();

    await page.goto(url, { timeout: 60000, waitUntil: 'domcontentloaded' });

    await page.evaluate(async () => {
      await new Promise((resolve) => {
        let totalHeight = 0;
        const distance = 100;
        const timer = setInterval(() => {
          window.scrollBy(0, distance);
          totalHeight += distance;
          if (totalHeight >= document.body.scrollHeight) {
            clearInterval(timer);
            resolve();
          }
        }, 100);
      });
    });

    await page.waitForTimeout(3000);

    const html = await page.content();
    const $ = cheerio.load(html);
    const imageUrl =
      $('meta[property="og:image"]').attr('content') ||
      $('meta[name="twitter:image"]').attr('content') ||
      $('img').first().attr('src');

    const mainContent = $('main').html() || $('body').html();
    const structured = await extractProductData(mainContent);
    const normalizedGallery = (structured.imageGallery || []).map(img =>
      normalizeUrl(img, url)
    );

    // Process the main product image
    const normalizedImageUrl = normalizeUrl(imageUrl, url);
    if (normalizedImageUrl) {
      try {
        const processedImage = await processImage({
          type: 'url',
          data: normalizedImageUrl,
          originalname: 'product.jpg'
        }, req.user?.id);

        res.json({
          ...structured,
          imageGallery: normalizedGallery,
          imageUrl: normalizedImageUrl,
          sourceUrl: url,
          processedImage: processedImage
        });
      } catch (error) {
        console.error('Image processing failed:', error);
        res.status(500).json({ 
          error: 'Image processing failed', 
          details: error.message,
          structured,
          imageGallery: normalizedGallery,
          imageUrl: normalizedImageUrl,
          sourceUrl: url
        });
      }
    } else {
      res.json({
        ...structured,
        imageGallery: normalizedGallery,
        imageUrl: normalizedImageUrl,
        sourceUrl: url
      });
    }

    await browser.close();
  } catch (err) {
    if (browser) await browser.close();
    res.status(500).json({ error: 'Scraping failed', details: err.message });
  }
}

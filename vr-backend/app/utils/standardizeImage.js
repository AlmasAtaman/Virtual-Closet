import { createCanvas, loadImage } from 'canvas';
import fs from 'fs';

/**
 * Get standardized canvas settings for each clothing category
 * This ensures all items in the same category appear consistent in size
 *
 * Category-based sizing (7 main categories):
 * - Tops: 640×800px (t-shirts, shirts, blouses, tanks, crop tops)
 * - Bottoms: 700×900px (pants, jeans, shorts, skirts, leggings)
 * - Outerwear: 640×850px (jackets, coats, blazers, hoodies, vests)
 * - Dresses: 640×950px (all dresses - mini, midi, maxi, gowns)
 * - Shoes: 600×400px (sneakers, boots, heels, sandals, flats)
 * - Accessories: 500×500px (hats, belts, scarves, jewelry, sunglasses)
 * - Bags: 550×650px (backpacks, purses, handbags, totes, clutches)
 */
function getCanvasSettings(category) {
  const cat = category?.toLowerCase()?.trim() || "";

  // Normalize category name variations
  let normalizedCategory = cat;

  // Handle plural/singular variations
  if (cat === "top") normalizedCategory = "tops";
  if (cat === "bottom") normalizedCategory = "bottoms";
  if (cat === "shoe") normalizedCategory = "shoes";
  if (cat === "accessory") normalizedCategory = "accessories";
  if (cat === "bag") normalizedCategory = "bags";
  if (cat === "dress") normalizedCategory = "dresses";

  switch (normalizedCategory) {
    case "tops":
      return { width: 640, height: 800, align: "center", known: true, fillPercent: 0.80 };

    case "bottoms":
      return { width: 700, height: 900, align: "center", known: true, fillPercent: 0.80 };

    case "outerwear":
      return { width: 640, height: 850, align: "center", known: true, fillPercent: 0.80 };

    case "dresses":
      return { width: 640, height: 950, align: "center", known: true, fillPercent: 0.80 };

    case "shoes":
      return { width: 600, height: 400, align: "center", known: true, fillPercent: 0.80 };

    case "accessories":
      return { width: 500, height: 500, align: "center", known: true, fillPercent: 0.80 };

    case "bags":
      return { width: 550, height: 650, align: "center", known: true, fillPercent: 0.80 };

    default:
      // Unknown category - use neutral default
      console.warn(`[standardizeImage] Unknown clothing category: '${category}'. Using default 600×700 canvas.`);
      return { width: 600, height: 700, align: "center", known: false, fillPercent: 0.80 };
  }
}

export async function standardizeImage(inputPath, category, outputPath) {
  console.log(`\n🎯 ============ STANDARDIZE IMAGE FUNCTION ============`);
  console.log(`📥 Input parameters:`);
  console.log(`   - inputPath: ${inputPath}`);
  console.log(`   - category: "${category}" (type: ${typeof category})`);
  console.log(`   - outputPath: ${outputPath}`);

  const { width, height, align, known, fillPercent } = getCanvasSettings(category);

  if (!known) {
    console.warn(`⚠️  [standardizeImage] Unknown or missing clothing category ('${category}'). Defaulting to 600×700, centered.`);
  } else {
    console.log(`✅ Category recognized: "${category}"`);
  }

  console.log(`📐 Canvas settings determined:`);
  console.log(`   - Canvas size: ${width}x${height}`);
  console.log(`   - Fill percentage: ${fillPercent * 100}%`);
  console.log(`   - Alignment: ${align}`);
  console.log(`   - Known category: ${known}`);

  const img = await loadImage(inputPath);
  console.log(`📷 Original image loaded: ${img.width}x${img.height}`);

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, width, height);

  // PROPORTIONAL SCALING: Scale to fill specified percentage of canvas
  // Maintains aspect ratio - NO distortion
  const maxWidth = width * fillPercent;
  const maxHeight = height * fillPercent;

  // Calculate scale - use the smaller scale to ensure image fits
  const scale = Math.min(maxWidth / img.width, maxHeight / img.height);

  const finalWidth = img.width * scale;
  const finalHeight = img.height * scale;

  console.log(`🔢 Scaling calculations:`);
  console.log(`   - Max dimensions: ${maxWidth.toFixed(0)}x${maxHeight.toFixed(0)} (${fillPercent * 100}% of canvas)`);
  console.log(`   - Scale factor: ${scale.toFixed(3)}`);
  console.log(`   - Scaled dimensions: ${Math.round(finalWidth)}x${Math.round(finalHeight)}`);
  console.log(`   - Aspect ratio preserved: ${(img.width/img.height).toFixed(2)} → ${(finalWidth/finalHeight).toFixed(2)}`);

  // Center horizontally always
  const x = (width - finalWidth) / 2;

  // Vertical alignment based on clothing type
  let y;
  if (align === "top") {
    y = height * 0.025; // Small top padding (2.5% of canvas height)
  } else if (align === "center") {
    y = (height - finalHeight) / 2;
  } else { // bottom
    y = height - finalHeight - (height * 0.025); // Small bottom padding
  }

  console.log(`📍 Final positioning:`);
  console.log(`   - X position (centered): ${Math.round(x)}`);
  console.log(`   - Y position (${align}): ${Math.round(y)}`);
  console.log(`   - Final dimensions on canvas: ${Math.round(finalWidth)}x${Math.round(finalHeight)}`);

  ctx.drawImage(img, x, y, finalWidth, finalHeight);
  const buffer = canvas.toBuffer("image/png");
  fs.writeFileSync(outputPath, buffer);

  console.log(`✅ Standardized image written to: ${outputPath}`);
  console.log(`   - Output file size: ${buffer.length} bytes`);
  console.log(`============ STANDARDIZE IMAGE COMPLETE ============\n`);
}

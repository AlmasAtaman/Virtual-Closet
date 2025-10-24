import { createCanvas, loadImage } from 'canvas';
import fs from 'fs';

/**
 * Get standardized canvas settings for each clothing category
 * This ensures all items of the same type appear consistent in size
 *
 * Category mappings:
 * - T-shirt: 640x800 (portrait, top-aligned)
 * - Jacket: 640x850 (portrait, top-aligned)
 * - Pants: 750x962 (portrait, bottom-aligned)
 * - Shoes: 600x400 (landscape, bottom-aligned)
 * - Hat: 400x400 (square, center-aligned)
 * - Sweater: 640x850 (portrait, top-aligned)
 * - Shorts: 600x600 (square, bottom-aligned)
 * - Skirt: 600x750 (portrait, bottom-aligned)
 * - Dress: 640x900 (portrait, center-aligned)
 * - Bag: 500x600 (portrait, center-aligned)
 */
function getCanvasSettings(clothingType) {
  const type = clothingType?.toLowerCase()?.trim() || "";

  // T-shirt category (640x800, center-aligned)
  if (["t-shirt", "tshirt", "shirt", "top", "blouse", "tank top", "tank"].includes(type)) {
    return { width: 640, height: 800, align: "center", known: true };
  }

  // Jacket category (640x850, center-aligned)
  if (["jacket", "coat", "blazer", "windbreaker", "parka", "bomber"].includes(type)) {
    return { width: 640, height: 850, align: "center", known: true };
  }

  // Sweater category (640x850, center-aligned)
  if (["sweater", "hoodie", "sweatshirt", "cardigan", "pullover", "jumper"].includes(type)) {
    return { width: 640, height: 850, align: "center", known: true };
  }

  // Pants category (750x962, center-aligned)
  if (["pants", "trousers", "jeans", "slacks", "chinos", "leggings"].includes(type)) {
    return { width: 750, height: 962, align: "center", known: true };
  }

  // Shorts category (600x600, center-aligned)
  if (["shorts", "short", "bermuda"].includes(type)) {
    return { width: 600, height: 600, align: "center", known: true };
  }

  // Shoes category (600x400, center-aligned)
  if (["shoes", "sneakers", "boots", "sandals", "heels", "loafers", "flats"].includes(type)) {
    return { width: 600, height: 400, align: "center", known: true };
  }

  // Hat category (400x400, center-aligned)
  if (["hat", "cap", "beanie", "fedora", "beret", "headwear"].includes(type)) {
    return { width: 400, height: 400, align: "center", known: true };
  }

  // Skirt category (600x750, center-aligned)
  if (["skirt", "mini skirt", "midi skirt", "maxi skirt"].includes(type)) {
    return { width: 600, height: 750, align: "center", known: true };
  }

  // Dress category (640x900, center-aligned)
  if (["dress", "gown", "sundress", "maxi dress", "midi dress"].includes(type)) {
    return { width: 640, height: 900, align: "center", known: true };
  }

  // Bag category (500x600, center-aligned)
  if (["bag", "backpack", "purse", "handbag", "tote", "clutch", "satchel"].includes(type)) {
    return { width: 500, height: 600, align: "center", known: true };
  }

  // Unknown or missing type - use neutral default
  console.warn(`[standardizeImage] Unknown clothing type: '${clothingType}'. Using default 600x700 canvas.`);
  return { width: 600, height: 700, align: "center", known: false };
}

export async function standardizeImage(inputPath, clothingType, outputPath) {
  console.log(`\n🎯 ============ STANDARDIZE IMAGE FUNCTION ============`);
  console.log(`📥 Input parameters:`);
  console.log(`   - inputPath: ${inputPath}`);
  console.log(`   - clothingType: "${clothingType}" (type: ${typeof clothingType})`);
  console.log(`   - outputPath: ${outputPath}`);

  const { width, height, align, known } = getCanvasSettings(clothingType);

  if (!known) {
    console.warn(`⚠️  [standardizeImage] Unknown or missing clothing type ('${clothingType}'). Defaulting to 600x700, centered.`);
  } else {
    console.log(`✅ Category recognized: "${clothingType}"`);
  }

  console.log(`📐 Canvas settings determined:`);
  console.log(`   - Canvas size: ${width}x${height}`);
  console.log(`   - Alignment: ${align}`);
  console.log(`   - Known category: ${known}`);

  const img = await loadImage(inputPath);
  console.log(`📷 Original image loaded: ${img.width}x${img.height}`);

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, width, height);

  // Scale proportionally to fit inside the canvas
  // Use 95% of canvas dimensions to add small padding
  const maxWidth = width * 0.95;
  const maxHeight = height * 0.95;
  const scale = Math.min(maxWidth / img.width, maxHeight / img.height);
  const newWidth = img.width * scale;
  const newHeight = img.height * scale;

  console.log(`🔢 Scaling calculations:`);
  console.log(`   - Max canvas area: ${maxWidth.toFixed(0)}x${maxHeight.toFixed(0)} (95% of canvas)`);
  console.log(`   - Scale factor: ${scale.toFixed(3)}`);
  console.log(`   - Scaled image size: ${Math.round(newWidth)}x${Math.round(newHeight)}`);

  // Center horizontally always
  const x = (width - newWidth) / 2;

  // Vertical alignment based on clothing type
  let y;
  if (align === "top") {
    y = height * 0.025; // Small top padding (2.5% of canvas height)
  } else if (align === "center") {
    y = (height - newHeight) / 2;
  } else { // bottom
    y = height - newHeight - (height * 0.025); // Small bottom padding
  }

  console.log(`📍 Final positioning:`);
  console.log(`   - X position (centered): ${Math.round(x)}`);
  console.log(`   - Y position (${align}): ${Math.round(y)}`);
  console.log(`   - Final dimensions on canvas: ${Math.round(newWidth)}x${Math.round(newHeight)}`);

  ctx.drawImage(img, x, y, newWidth, newHeight);
  const buffer = canvas.toBuffer("image/png");
  fs.writeFileSync(outputPath, buffer);

  console.log(`✅ Standardized image written to: ${outputPath}`);
  console.log(`   - Output file size: ${buffer.length} bytes`);
  console.log(`============ STANDARDIZE IMAGE COMPLETE ============\n`);
}

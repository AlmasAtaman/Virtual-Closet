import { createCanvas, loadImage } from 'canvas';
import fs from 'fs';

function getCanvasSettings(clothingType) {
  const type = clothingType?.toLowerCase() || "";
  if (["pants", "trousers", "jeans"].includes(type)) return { width: 750, height: 962, align: "bottom", known: true };
  if (["t-shirt", "shirt", "top"].includes(type)) return { width: 640, height: 800, align: "top", known: true };
  if (["jacket", "hoodie", "coat", "sweater"].includes(type)) return { width: 563, height: 845, align: "top", known: true };
  if (["shorts"].includes(type)) return { width: 512, height: 512, align: "bottom", known: true };
  if (["shoes"].includes(type)) return { width: 512, height: 256, align: "bottom", known: true };
  if (["hat"].includes(type)) return { width: 256, height: 256, align: "center", known: true };
  // Unknown or missing type
  return { width: 512, height: 512, align: "center", known: false };
}

export async function standardizeImage(inputPath, clothingType, outputPath) {
  const { width, height, align, known } = getCanvasSettings(clothingType);
  if (!known) {
    console.warn(`[standardizeImage] Unknown or missing clothing type ('${clothingType}'). Defaulting to 512x512, centered.`);
  }
  const img = await loadImage(inputPath);
  
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, width, height);

  // scale proportionally, always fit inside the canvas
  const scale = Math.min(width / img.width, height / img.height);
  const newWidth = img.width * scale;
  const newHeight = img.height * scale;
  const x = (width - newWidth) / 2;
  const y = align === "top" ? 0 :
            align === "center" ? (height - newHeight) / 2 :
            height - newHeight;

  ctx.drawImage(img, x, y, newWidth, newHeight);
  const buffer = canvas.toBuffer("image/png");
  fs.writeFileSync(outputPath, buffer);
}

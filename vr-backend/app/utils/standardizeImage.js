import { createCanvas, loadImage } from 'canvas';
import fs from 'fs';

function getCanvasSettings(clothingType) {
  const type = clothingType?.toLowerCase() || "";
  if (["t-shirt", "shirt", "top"].includes(type)) return { width: 512, height: 512, align: "top" };
  if (["jacket", "hoodie", "coat"].includes(type)) return { width: 512, height: 640, align: "top" };
  if (["pants", "trousers", "jeans"].includes(type)) return { width: 512, height: 768, align: "bottom" };
  if (["shorts"].includes(type)) return { width: 512, height: 512, align: "bottom" };
  if (["shoes"].includes(type)) return { width: 512, height: 256, align: "bottom" };
  if (["hat"].includes(type)) return { width: 256, height: 256, align: "center" };
  return { width: 512, height: 512, align: "center" };
}

export async function standardizeImage(inputPath, clothingType, outputPath) {
  const { width, height, align } = getCanvasSettings(clothingType);
  const img = await loadImage(inputPath);
  
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, width, height);

  // scale proportionally
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

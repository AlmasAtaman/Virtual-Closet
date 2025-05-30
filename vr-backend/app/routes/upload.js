import express from 'express';
import multer, { memoryStorage } from 'multer';
import { getUserPresignedUrls, uploadToS3, getPresignedUrl } from '../../s3.mjs';
import authMiddleware from '../middlewares/auth.middleware.js';
import { processImage } from '../utils/imageProcessor.js';
import { PrismaClient } from '@prisma/client';
import { deleteImage } from "../controllers/image.controller.js";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();
const router = express.Router();
const storage = memoryStorage();
const upload = multer({storage});

router.post("/", authMiddleware, upload.single("image"), async (req, res) => {
  const { file } = req;
  const userId = req.user.id;
  if (!file || !userId) return res.status(400).json({ message: "Bad Request" });

  try {
    const result = await processImage({
      type: 'file',
      data: file.buffer,
      originalname: file.originalname
    }, userId);

    return res.status(200).json({
      clothingData: result.clothingData,
      imageBuffer: result.imageBuffer,
      originalname: file.originalname,
      s3Key: result.s3Key
    });
  } catch (err) {
    console.error("Upload failed:", err);
    return res.status(500).json({ message: err.message || "Upload failed" });
  }
});

router.get("/", authMiddleware, async (req, res) => {
  const userId = req.user.id;

  if (!userId) return res.status(400).json({ message: "Bad Request" });

  try {
    const mode = req.query.mode || "closet";

    const clothingFromDb = await prisma.clothing.findMany({
      where: {
        userId,
        mode, 
      },
    });

    const { error, presignedUrls } = await getUserPresignedUrls(userId);
    if (error) return res.status(400).json({ message: error.message });

    const enrichedItems = clothingFromDb.map((item) => {
      const fullUrl = presignedUrls.find((url) => url.includes(item.key));

      return {
        id: item.id,
        key: item.key,
        url: fullUrl || "",
        name: item.name || "Unnamed",
        type: item.type || "Unknown",
        brand: item.brand || "No brand",
        occasion: item.occasion || "",
        style: item.style || "",
        fit: item.fit || "",
        color: item.color || "",
        material: item.material || "",
        season: item.season || "",
        notes: item.notes || "",
        mode: item.mode || "closet",
        sourceUrl: item.sourceUrl || "",
        price: item.price || ""
      };
    });


    return res.json({ clothingItems: enrichedItems });
  } catch (err) {
    console.error("Error fetching clothing items:", err);
    return res.status(500).json({ message: "Failed to load items" });
  }
});

router.post("/submit-clothing", authMiddleware, async (req, res) => {
  const { name, type, brand, key, price, mode = "closet", sourceUrl = null } = req.body;
  const userId = req.user.id;

  if (!key) return res.status(400).json({ message: "Missing image key" });

  try {
    await prisma.clothing.create({
      data: {
        userId,
        key,
        url: key,
        name: name || null,
        type: type || null,
        brand: brand || null,
        price: price ? parseFloat(price) : null,
        mode,
        sourceUrl
      },
    });
    return res.status(201).json({ message: "Clothing saved" });
  } catch (err) {
    console.error("Failed to save clothing:", err);
    return res.status(500).json({ message: "Failed to save clothing" });
  }
});

router.post("/final-submit", authMiddleware, upload.single("image"), async (req, res) => {
  const {
    name, type, brand,
    occasion, style, fit,
    color, material, season, notes,
    mode = "closet",
    sourceUrl = null,
    price = null
  } = req.body;
  const userId = req.user.id;
  const file = req.file;

  if (!file || !userId) return res.status(400).json({ message: "Bad Request" });

  try {
    const { error, key } = await uploadToS3({ file, userId });
    if (error) return res.status(500).json({ message: error.message });


    const clothing = await prisma.clothing.create({
      data: {
        userId: userId,
        key,     
        url: key,  
        name,
        type,
        brand: brand || null,
        occasion: occasion || null,
        style: style || null,
        fit: fit || null,
        color: color || null,
        material: material || null,
        season: season || null,
        notes: notes || null,
        mode,
        sourceUrl,
        price: price ? parseFloat(price) : null
      }
    });

    // Fetch the newly created item to get its full data
    const newClothingItem = await prisma.clothing.findUnique({
      where: { id: clothing.id },
    });

    // Generate a presigned URL specifically for the new item's key
    const { url: presignedUrl, error: presignError } = await getPresignedUrl(key);
    if (presignError) {
      console.error("Error generating presigned URL for new item:", presignError);

    }

    const newClothingItemWithUrl = {
      ...newClothingItem,
      url: presignedUrl || "", 
      mode: newClothingItem?.mode || "closet"
    };

    return res.status(201).json({ message: "Clothing saved", item: newClothingItemWithUrl });
  } catch (err) {
    console.error("Final submit failed:", err);
    return res.status(500).json({ message: "Final submit failed" });
  }
});

router.delete("/:key", authMiddleware, deleteImage);

router.patch("/update", authMiddleware, async (req, res) => {
  const { id, name, type, brand, occasion, style, fit, color, material, season, notes, sourceUrl, price  } = req.body;

  if (!id) return res.status(400).json({ error: "Missing clothing ID" });

  try {
    const updated = await prisma.clothing.update({
      where: { id },
      data: {
        name, type, brand, occasion, style, fit,
        color, material, season, notes, sourceUrl,
        price: price ? parseFloat(price) : null
      },
    });

    res.json({ message: "Item updated", item: updated });
  } catch (error) {
    console.error("Failed to update item:", error);
    res.status(500).json({ error: "Failed to update item" });
  }
});

// Add new endpoint to move item from wishlist to closet
router.patch("/move-to-closet/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  if (!id) return res.status(400).json({ error: "Missing clothing ID" });

  try {
    // First verify the item exists and belongs to the user
    const item = await prisma.clothing.findFirst({
      where: {
        id,
        userId,
        mode: "wishlist"
      }
    });

    if (!item) {
      return res.status(404).json({ error: "Item not found in wishlist" });
    }

    // Update the item's mode to closet
    const updated = await prisma.clothing.update({
      where: { id },
      data: {
        mode: "closet"
      },
    });

    res.json({ message: "Item moved to closet", item: updated });
  } catch (error) {
    console.error("Failed to move item:", error);
    res.status(500).json({ error: "Failed to move item" });
  }
});

export default router;

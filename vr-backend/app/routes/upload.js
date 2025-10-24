import express from 'express';
import multer, { memoryStorage } from 'multer';
import { getUserPresignedUrls, uploadToS3, getPresignedUrl } from '../../s3.mjs';
import authMiddleware from '../middlewares/auth.middleware.js';
import { processImage, analyzeImageWithGemini } from '../utils/imageProcessor.js';
import { PrismaClient } from '@prisma/client';
import { deleteImage } from "../controllers/image.controller.js";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();
const router = express.Router();
const storage = memoryStorage();
const upload = multer({storage});

// Middleware removed - no longer needed since unified auth ensures users exist

router.post("/", authMiddleware, upload.single("image"), async (req, res) => {
  const { file } = req;
  const userId = req.user.id;
  if (!file || !userId) return res.status(400).json({ message: "Bad Request" });

  try {
    // OPTIMIZED: Auto-fill only needs Gemini analysis, NOT background removal!
    // This saves ~2.5 seconds by skipping unnecessary image processing
    const clothingData = await analyzeImageWithGemini(file.buffer);

    // Validate that the image is actually clothing
    if (!clothingData?.isClothing) {
      return res.status(400).json({
        message: "This image doesn't appear to be clothing."
      });
    }

    // Return only the metadata - frontend already has the original image!
    return res.status(200).json({
      clothingData: clothingData,
      // imageBuffer removed - frontend doesn't need it, already has original
    });
  } catch (err) {
    console.error("Auto-fill failed:", err);
    return res.status(500).json({ message: err.message || "Auto-fill failed" });
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
        url: fullUrl || item.originalImageUrl || "",
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
        price: item.price || "",
        isFavorite: item.isFavorite || false,
        processingStatus: item.processingStatus || "completed",
        processingError: item.processingError || null,
        originalImageUrl: item.originalImageUrl || null
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
  const imageUrl = req.body.imageUrl; // Get imageUrl from body for URL uploads

  console.log(`\n🚀 ============ FINAL-SUBMIT ENDPOINT ============`);
  console.log(`👤 User ID: ${userId}`);
  console.log(`📋 Form data received:`);
  console.log(`   - name: "${name}"`);
  console.log(`   - type/category: "${type}"`);
  console.log(`   - brand: "${brand}"`);
  console.log(`   - mode: "${mode}"`);
  console.log(`   - hasFile: ${!!file}`);
  console.log(`   - hasImageUrl: ${!!imageUrl}`);

  if (!userId || (!file && !imageUrl)) return res.status(400).json({ message: "Bad Request: Missing userId or image data" });

  // Validate that category/type is provided
  if (!type || type.trim() === '') {
    console.log(`❌ Validation failed: Category is required but missing or empty`);
    return res.status(400).json({ message: "Category is required. Please select a clothing category." });
  }

  console.log(`✅ Category validation passed: "${type}"`);

  let processedResult;
  try {
    if (file) {
      // Skip Gemini for final submit - form already has data! Saves 1.5 seconds
      // Pass the category from the form to ensure consistent sizing
      console.log(`\n📸 Processing file upload with category: "${type}"`);
      processedResult = await processImage({
        type: 'file',
        data: file.buffer,
        originalname: file.originalname
      }, userId, { skipGemini: true, category: type });
    } else if (imageUrl) {
      // Skip Gemini for final submit - form already has data! Saves 1.5 seconds
      // Pass the category from the form to ensure consistent sizing
      processedResult = await processImage({
        type: 'url',
        data: imageUrl,
        originalname: 'scraped_image.jpg' // Provide a default originalname for URL images
      }, userId, { skipGemini: true, category: type });
    } else {
      return res.status(400).json({ message: "No image data provided for processing." });
    }

    if (!processedResult.success) {
      throw new Error(processedResult.message || "Image processing failed");
    }

    const key = processedResult.s3Key; // Use the S3 key returned from processImage

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
      mode: newClothingItem?.mode || "closet",
      tags: newClothingItem?.tags || [], // Ensure tags are included
    };

    return res.status(201).json({ message: "Clothing saved", item: newClothingItemWithUrl });
  } catch (err) {
    console.error("Final submit failed:", err);
    return res.status(500).json({ message: err.message || "Final submission failed" });
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

// Add favorite toggle endpoint
router.patch("/:id/favorite", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { isFavorite } = req.body;
  const userId = req.user.id;

  if (typeof isFavorite !== "boolean") {
    return res.status(400).json({ error: "isFavorite must be a boolean" });
  }

  try {
    const item = await prisma.clothing.findFirst({
      where: { id, userId }
    });
    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }

    const updated = await prisma.clothing.update({
      where: { id },
      data: { isFavorite }
    });

    res.json({ message: "Favorite status updated", item: updated });
  } catch (error) {
    console.error("Failed to update favorite:", error);
    res.status(500).json({ error: "Failed to update favorite" });
  }
});

// OPTIMISTIC LOADING ENDPOINTS

// Create optimistic item immediately with original image
router.post("/create-optimistic", authMiddleware, upload.single("image"), async (req, res) => {
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
  const imageUrl = req.body.imageUrl;

  console.log(`\n⚡ ============ OPTIMISTIC CREATE ENDPOINT ============`);
  console.log(`👤 User ID: ${userId}`);
  console.log(`📋 Creating optimistic item with pending status`);
  console.log(`📎 File received:`, file ? `Yes (${file.originalname}, ${file.size} bytes)` : 'No');
  console.log(`🔗 Image URL received:`, imageUrl || 'No');

  if (!userId || (!file && !imageUrl)) {
    return res.status(400).json({ message: "Bad Request: Missing userId or image data" });
  }

  if (!type || type.trim() === '') {
    return res.status(400).json({ message: "Category is required. Please select a clothing category." });
  }

  try {
    // Generate a unique key for the item
    const tempKey = `temp/${userId}/${uuidv4()}`;

    // Upload original image to S3 temporarily
    let originalImageKey;
    if (file) {
      // Create a properly formatted file object for uploadToS3
      const fileToUpload = {
        buffer: file.buffer,
        originalname: file.originalname,
        mimetype: file.mimetype
      };
      const uploadResult = await uploadToS3({ file: fileToUpload, userId });
      if (uploadResult.error) {
        throw new Error(uploadResult.error.message);
      }
      originalImageKey = uploadResult.key;
    } else if (imageUrl) {
      // For URL uploads, store the URL directly (no S3 upload needed for original)
      originalImageKey = imageUrl;
    }

    // Get presigned URL for original image
    let originalPresignedUrl;
    if (file) {
      const { url, error } = await getPresignedUrl(originalImageKey);
      if (error) throw new Error(error.message);
      originalPresignedUrl = url;
    } else {
      originalPresignedUrl = imageUrl;
    }

    // Create database record with pending status
    const clothing = await prisma.clothing.create({
      data: {
        userId: userId,
        key: tempKey,
        url: tempKey,
        originalImageUrl: originalPresignedUrl,
        name: name || "Untitled",
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
        price: price ? parseFloat(price) : null,
        processingStatus: "pending"
      }
    });

    console.log(`✅ Optimistic item created with ID: ${clothing.id}`);

    // Store file data for background processing
    const processingData = {
      itemId: clothing.id,
      userId,
      imageData: file ? {
        type: 'file',
        data: file.buffer,
        originalname: file.originalname
      } : {
        type: 'url',
        data: imageUrl,
        originalname: 'scraped_image.jpg'
      },
      category: type
    };

    // Start background processing asynchronously (don't wait for it)
    processImageInBackground(processingData).catch(err => {
      console.error(`Background processing failed for item ${clothing.id}:`, err);
    });

    // Return immediately with optimistic item
    const optimisticItem = {
      ...clothing,
      url: originalPresignedUrl,
    };

    return res.status(201).json({
      message: "Item created, processing in background",
      item: optimisticItem
    });

  } catch (err) {
    console.error("Optimistic create failed:", err);
    return res.status(500).json({ message: err.message || "Failed to create item" });
  }
});

// Background processing function
async function processImageInBackground(processingData) {
  const { itemId, userId, imageData, category } = processingData;

  try {
    console.log(`\n🔄 Starting background processing for item ${itemId}`);

    // Update status to processing
    await prisma.clothing.update({
      where: { id: itemId },
      data: { processingStatus: "processing" }
    });

    // Process the image (background removal, trimming, standardization, S3 upload)
    const processedResult = await processImage(imageData, userId, {
      skipGemini: true,
      category
    });

    if (!processedResult.success) {
      throw new Error(processedResult.message || "Image processing failed");
    }

    const key = processedResult.s3Key;

    // Update the item with the processed image
    await prisma.clothing.update({
      where: { id: itemId },
      data: {
        key,
        url: key,
        processingStatus: "completed",
        processingError: null
      }
    });

    console.log(`✅ Background processing completed for item ${itemId}`);

  } catch (err) {
    console.error(`❌ Background processing failed for item ${itemId}:`, err);

    // Update status to failed
    await prisma.clothing.update({
      where: { id: itemId },
      data: {
        processingStatus: "failed",
        processingError: err.message || "Processing failed"
      }
    });
  }
}

// Get processing status for multiple items
router.get("/processing-status", authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const { ids } = req.query;

  if (!ids) {
    return res.status(400).json({ message: "Missing item IDs" });
  }

  const itemIds = ids.split(',').filter(id => id.trim());

  try {
    const items = await prisma.clothing.findMany({
      where: {
        id: { in: itemIds },
        userId
      },
      select: {
        id: true,
        key: true,
        url: true,
        originalImageUrl: true,
        processingStatus: true,
        processingError: true
      }
    });

    // Get presigned URLs for items
    const itemsWithUrls = await Promise.all(items.map(async (item) => {
      let presignedUrl = item.url;

      if (item.processingStatus === 'completed' && item.key) {
        const { url, error } = await getPresignedUrl(item.key);
        if (!error) presignedUrl = url;
      } else if (item.originalImageUrl) {
        presignedUrl = item.originalImageUrl;
      }

      return {
        ...item,
        url: presignedUrl
      };
    }));

    return res.json({ items: itemsWithUrls });
  } catch (err) {
    console.error("Failed to fetch processing status:", err);
    return res.status(500).json({ message: "Failed to fetch status" });
  }
});

// Retry failed processing
router.post("/retry-processing/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const item = await prisma.clothing.findFirst({
      where: { id, userId, processingStatus: "failed" }
    });

    if (!item) {
      return res.status(404).json({ message: "Failed item not found" });
    }

    // Reset status to pending
    await prisma.clothing.update({
      where: { id },
      data: {
        processingStatus: "pending",
        processingError: null
      }
    });

    // Get the original image data (this would need to be stored or reconstructed)
    // For now, return error indicating retry from upload is needed
    return res.status(400).json({
      message: "Please re-upload the item. Retry from stored data not yet implemented."
    });

  } catch (err) {
    console.error("Failed to retry processing:", err);
    return res.status(500).json({ message: "Failed to retry" });
  }
});

export default router;

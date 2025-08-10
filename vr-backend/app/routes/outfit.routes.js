import express from "express"
import { PrismaClient } from "@prisma/client"
import authMiddleware from "../middlewares/auth.middleware.js"
import { getPresignedUrl } from "../../s3.mjs"

const prisma = new PrismaClient()
const router = express.Router()

// Helper function to transform outfit data with presigned URLs and layout
async function transformOutfitData(outfit) {
  return {
    id: outfit.id,
    name: outfit.name,
    occasion: outfit.occasion,
    season: outfit.season,
    notes: outfit.notes,
    price: outfit.totalPrice,
    totalPrice: outfit.totalPrice,
    clothingItems: await Promise.all(
      outfit.outfitClothing.map(async (oc) => {
        const { url: presignedUrl, error: presignError } = await getPresignedUrl(oc.clothing.key)
        if (presignError) {
          console.error(`Error generating presigned URL for key ${oc.clothing.key}:`, presignError)
        }

        return {
          id: oc.clothing.id,
          name: oc.clothing.name,
          url: presignedUrl || "",
          type: oc.clothing.type,
          brand: oc.clothing.brand,
          price: oc.clothing.price,
          key: oc.clothing.key,
          mode: oc.clothing.mode,
          // Include layout data
          x: oc.x,
          y: oc.y,
          scale: oc.scale,
          left: oc.left,
          bottom: oc.bottom,
          width: oc.width,
        }
      }),
    ),
  }
}

// Get all outfits for the current user
router.get("/", authMiddleware, async (req, res) => {
  const userId = req.user.id
  try {
    const outfits = await prisma.outfit.findMany({
      where: {
        userId: userId,
      },
      include: {
        outfitClothing: {
          include: {
            clothing: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    const transformedOutfits = await Promise.all(outfits.map((outfit) => transformOutfitData(outfit)))

    res.json({ outfits: transformedOutfits })
  } catch (error) {
    console.error("Error fetching outfits:", error)
    res.status(500).json({ message: "Failed to fetch outfits" })
  }
})

// Create a new outfit
router.post("/", authMiddleware, async (req, res) => {
  const userId = req.user.id
  const { clothingItems, name } = req.body

  console.log("Received request to create outfit for user:", userId)
  console.log("Clothing items received:", clothingItems)

  if (!clothingItems || !Array.isArray(clothingItems)) {
    console.error("Invalid request: clothingItems is not an array or is missing")
    return res.status(400).json({ message: "Invalid request: clothingItems must be an array" })
  }

  try {
    // Create the outfit with layout data
    const outfit = await prisma.outfit.create({
      data: {
        userId: userId,
        name: name || null,
        outfitClothing: {
          create: clothingItems.map((item) => ({
            clothing: {
              connect: { id: item.clothingId },
            },
            x: item.x || 0,
            y: item.y || 0,
            scale: item.scale || 1,
            left: item.left || 50,
            bottom: item.bottom || 0,
            width: item.width || 10,
          })),
        },
      },
      include: {
        outfitClothing: {
          include: {
            clothing: true,
          },
        },
      },
    })

    const transformedOutfit = await transformOutfitData(outfit)
    console.log("Outfit created successfully:", transformedOutfit.id)
    res.status(201).json(transformedOutfit)
  } catch (error) {
    console.error("Error creating outfit in backend:", error)
    if (error.code === "P2025") {
      return res.status(404).json({ message: "One or more clothing items not found" })
    }
    res.status(500).json({ message: "Failed to create outfit" })
  }
})

// Get a single outfit by ID for the current user
router.get("/:outfitId", authMiddleware, async (req, res) => {
  const userId = req.user.id
  const { outfitId } = req.params

  try {
    const outfit = await prisma.outfit.findFirst({
      where: {
        id: outfitId,
        userId: userId,
      },
      include: {
        outfitClothing: {
          include: {
            clothing: true,
          },
        },
      },
    })

    if (!outfit) {
      return res.status(404).json({ message: "Outfit not found or does not belong to user" })
    }

    const transformedOutfit = await transformOutfitData(outfit)
    res.json({ outfit: transformedOutfit })
  } catch (error) {
    console.error("Error fetching single outfit:", error)
    res.status(500).json({ message: "Failed to fetch outfit" })
  }
})

// Update an outfit
router.put("/:outfitId", authMiddleware, async (req, res) => {
  const userId = req.user.id
  const { outfitId } = req.params
  const { name, occasion, season, notes, price, clothingItems } = req.body

  try {
    // Verify the outfit belongs to the user
    const existingOutfit = await prisma.outfit.findFirst({
      where: {
        id: outfitId,
        userId: userId,
      },
    })

    if (!existingOutfit) {
      return res.status(404).json({ message: "Outfit not found or does not belong to user" })
    }

    // Start a transaction to update the outfit and its clothing items
    const updatedOutfit = await prisma.$transaction(async (prisma) => {
      // Update the outfit details
      const outfit = await prisma.outfit.update({
        where: { id: outfitId },
        data: {
          name,
          occasion,
          season,
          notes,
          totalPrice: price ? Number.parseFloat(price) : null,
        },
      })

      // If clothingItems is provided, update the outfit's clothing items with layout
      if (clothingItems && Array.isArray(clothingItems)) {
        // Delete existing outfit-clothing relationships
        await prisma.outfitClothing.deleteMany({
          where: { outfitId },
        })

        // Create new outfit-clothing relationships with layout data
        if (clothingItems.length > 0) {
          await prisma.outfitClothing.createMany({
            data: clothingItems.map((item) => ({
              outfitId,
              clothingId: typeof item === "string" ? item : item.clothingId || item.id,
              x: item.x || 0,
              y: item.y || 0,
              scale: item.scale || 1,
              left: item.left || 50,
              bottom: item.bottom || 0,
              width: item.width || 10,
            })),
          })
        }
      }

      // Fetch the updated outfit with its clothing items
      return await prisma.outfit.findFirst({
        where: { id: outfitId },
        include: {
          outfitClothing: {
            include: {
              clothing: true,
            },
          },
        },
      })
    })

    const transformedOutfit = await transformOutfitData(updatedOutfit)
    res.json({ outfit: transformedOutfit })
  } catch (error) {
    console.error("Error updating outfit:", error)
    res.status(500).json({ message: "Failed to update outfit" })
  }
})

// Delete an entire outfit by ID for the current user
router.delete("/:outfitId", authMiddleware, async (req, res) => {
  const userId = req.user.id
  const { outfitId } = req.params

  try {
    // Verify the outfit belongs to the user
    const outfit = await prisma.outfit.findFirst({
      where: {
        id: outfitId,
        userId: userId,
      },
    })

    if (!outfit) {
      return res.status(404).json({ message: "Outfit not found or does not belong to user" })
    }

    // Delete the outfit (cascade will handle OutfitClothing records)
    await prisma.outfit.delete({
      where: {
        id: outfitId,
      },
    })

    res.json({ message: "Outfit deleted successfully" })
  } catch (error) {
    console.error("Error deleting outfit:", error)
    res.status(500).json({ message: "Failed to delete outfit" })
  }
})

// Remove a clothing item from an outfit
router.delete("/:outfitId/items/:clothingItemId", authMiddleware, async (req, res) => {
  const userId = req.user.id
  const { outfitId, clothingItemId } = req.params

  try {
    // Verify the outfit belongs to the user
    const outfit = await prisma.outfit.findFirst({
      where: {
        id: outfitId,
        userId: userId,
      },
    })

    if (!outfit) {
      return res.status(404).json({ message: "Outfit not found or does not belong to user" })
    }

    // Delete the specific OutfitClothing record
    const deleteResult = await prisma.outfitClothing.deleteMany({
      where: {
        outfitId: outfitId,
        clothingId: clothingItemId,
      },
    })

    if (deleteResult.count === 0) {
      return res.status(404).json({ message: "Clothing item not found in this outfit" })
    }

    res.json({ message: "Clothing item removed from outfit successfully" })
  } catch (error) {
    console.error("Error removing clothing item from outfit:", error)
    res.status(500).json({ message: "Failed to remove clothing item from outfit" })
  }
})

export default router

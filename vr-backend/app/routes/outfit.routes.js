import express from 'express';
import { PrismaClient } from '@prisma/client';
import authMiddleware from '../middlewares/auth.middleware.js';
import { getPresignedUrl } from '../../s3.mjs';

const prisma = new PrismaClient();
const router = express.Router();

// Get all outfits for the current user
router.get('/', authMiddleware, async (req, res) => {
    const userId = req.user.id;

    try {
        const outfits = await prisma.outfit.findMany({
            where: {
                userId: userId
            },
            include: {
                outfitClothing: {
                    include: {
                        clothing: true
                    }
                }
            }
        });

        // Transform the data to match the frontend's expected format
        const transformedOutfits = await Promise.all(outfits.map(async outfit => ({
            id: outfit.id,
            clothingItems: await Promise.all(outfit.outfitClothing.map(async oc => {
                // Generate a presigned URL for each clothing item's key
                const { url: presignedUrl, error: presignError } = await getPresignedUrl(oc.clothing.key);
                if (presignError) {
                    console.error(`Error generating presigned URL for key ${oc.clothing.key}:`, presignError);
                    // Decide how to handle errors - maybe return a placeholder URL or an empty string
                    return {
                        id: oc.clothing.id,
                        name: oc.clothing.name,
                        url: "", // Return empty URL on error
                        type: oc.clothing.type,
                        key: oc.clothing.key
                    };
                }
                return {
                    id: oc.clothing.id,
                    name: oc.clothing.name,
                    url: presignedUrl || "", // Use the generated presigned URL
                    type: oc.clothing.type,
                    key: oc.clothing.key
                };
            }))
        })));

        res.json({ outfits: transformedOutfits });
    } catch (error) {
        console.error('Error fetching outfits:', error);
        res.status(500).json({ message: 'Failed to fetch outfits' });
    }
});

// Create a new outfit
router.post('/', authMiddleware, async (req, res) => {
    const userId = req.user.id;
    const { clothingItems } = req.body;

    console.log('Received request to create outfit for user:', userId);
    console.log('Clothing items received:', clothingItems);

    if (!clothingItems || !Array.isArray(clothingItems)) {
        console.error('Invalid request: clothingItems is not an array or is missing');
        return res.status(400).json({ message: 'Invalid request: clothingItems must be an array' });
    }

    try {
        // Create the outfit
        const outfit = await prisma.outfit.create({
            data: {
                userId: userId,
                outfitClothing: {
                    create: clothingItems.map(clothingId => ({
                        clothing: {
                            connect: { id: clothingId }
                        }
                    }))
                }
            },
            include: {
                outfitClothing: {
                    include: {
                        clothing: true
                    }
                }
            }
        });

        // Transform the response to match the frontend's expected format
        const transformedOutfit = {
            id: outfit.id,
            clothingItems: outfit.outfitClothing.map(oc => ({
                id: oc.clothing.id,
                name: oc.clothing.name,
                url: oc.clothing.url,
                type: oc.clothing.type
            }))
        };

        console.log('Outfit created successfully:', transformedOutfit.id);
        res.status(201).json(transformedOutfit);
    } catch (error) {
        console.error('Error creating outfit in backend:', error);
        // Check if the error is due to invalid clothing item ID
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'One or more clothing items not found' });
        }
        res.status(500).json({ message: 'Failed to create outfit' });
    }
});

// Get a single outfit by ID for the current user
router.get('/:outfitId', authMiddleware, async (req, res) => {
    const userId = req.user.id;
    const { outfitId } = req.params;

    try {
        const outfit = await prisma.outfit.findFirst({
            where: {
                id: outfitId,
                userId: userId
            },
            include: {
                outfitClothing: {
                    include: {
                        clothing: true
                    }
                }
            }
        });

        if (!outfit) {
            return res.status(404).json({ message: 'Outfit not found or does not belong to user' });
        }

        // Transform the data to include presigned URLs
        const transformedOutfit = {
            id: outfit.id,
            name: outfit.name, // Include outfit name if it exists
            occasion: outfit.occasion, // Include outfit occasion if it exists
            season: outfit.season, // Include outfit season if it exists
            notes: outfit.notes, // Include outfit notes if it exists
            price: outfit.price, // Include outfit price if it exists
            clothingItems: await Promise.all(outfit.outfitClothing.map(async oc => {
                const { url: presignedUrl, error: presignError } = await getPresignedUrl(oc.clothing.key);
                if (presignError) {
                    console.error(`Error generating presigned URL for key ${oc.clothing.key}:`, presignError);
                    return {
                        id: oc.clothing.id,
                        name: oc.clothing.name,
                        url: "",
                        type: oc.clothing.type,
                        key: oc.clothing.key
                    };
                }
                return {
                    id: oc.clothing.id,
                    name: oc.clothing.name,
                    url: presignedUrl || "",
                    type: oc.clothing.type,
                    key: oc.clothing.key
                };
            }))
        };

        res.json({ outfit: transformedOutfit });

    } catch (error) {
        console.error('Error fetching single outfit:', error);
        res.status(500).json({ message: 'Failed to fetch outfit' });
    }
});

// Delete an entire outfit by ID for the current user
router.delete('/:outfitId', authMiddleware, async (req, res) => {
    const userId = req.user.id;
    const { outfitId } = req.params;

    try {
        // Verify the outfit belongs to the user
        const outfit = await prisma.outfit.findFirst({
            where: {
                id: outfitId,
                userId: userId
            }
        });

        if (!outfit) {
            return res.status(404).json({ message: 'Outfit not found or does not belong to user' });
        }

        // Delete associated OutfitClothing records first
        await prisma.outfitClothing.deleteMany({
            where: {
                outfitId: outfitId
            }
        });

        // Then delete the Outfit record
        await prisma.outfit.delete({
            where: {
                id: outfitId
            }
        });

        res.json({ message: 'Outfit deleted successfully' });

    } catch (error) {
        console.error('Error deleting outfit:', error);
        res.status(500).json({ message: 'Failed to delete outfit' });
    }
});

// Add an endpoint to remove a clothing item from an outfit
router.delete('/:outfitId/items/:clothingItemId', authMiddleware, async (req, res) => {
    const userId = req.user.id;
    const { outfitId, clothingItemId } = req.params;

    try {
        // Verify the outfit belongs to the user
        const outfit = await prisma.outfit.findFirst({
            where: {
                id: outfitId,
                userId: userId
            }
        });

        if (!outfit) {
            return res.status(404).json({ message: 'Outfit not found or does not belong to user' });
        }

        // Delete the specific OutfitClothing record
        const deleteResult = await prisma.outfitClothing.deleteMany({
            where: {
                outfitId: outfitId,
                clothingId: clothingItemId
            }
        });

        if (deleteResult.count === 0) {
             return res.status(404).json({ message: 'Clothing item not found in this outfit' });
        }

        res.json({ message: 'Clothing item removed from outfit successfully' });

    } catch (error) {
        console.error('Error removing clothing item from outfit:', error);
        res.status(500).json({ message: 'Failed to remove clothing item from outfit' });
    }
});

export default router; 
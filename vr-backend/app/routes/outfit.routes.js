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
                        type: oc.clothing.type
                    };
                }
                return {
                    id: oc.clothing.id,
                    name: oc.clothing.name,
                    url: presignedUrl || "", // Use the generated presigned URL
                    type: oc.clothing.type
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

export default router; 
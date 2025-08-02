import prisma from '../utils/prismaClient.js';
import { getPresignedUrl } from '../../s3.mjs';

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
        const { url: presignedUrl, error: presignError } = await getPresignedUrl(oc.clothing.key);
        if (presignError) {
          console.error(`Error generating presigned URL for key ${oc.clothing.key}:`, presignError);
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
        };
      }),
    ),
  };
}

// Get all occasions for the current user, including their outfits
export const getOccasions = async (req, res) => {
  try {
    const userId = req.user.id;
    const occasions = await prisma.occasion.findMany({
      where: { userId },
      include: {
        outfits: {
          include: {
            outfitClothing: {
              include: { clothing: true }
            }
          }
        }
      }
    });
    // Transform occasions to match frontend expectations
    const transformedOccasions = await Promise.all(occasions.map(async occasion => ({
      ...occasion,
      outfits: await Promise.all(occasion.outfits.map(outfit => transformOutfitData(outfit)))
    })));

    res.json({ occasions: transformedOccasions });
  } catch (error) {
    console.error('Error fetching occasions:', error);
    res.status(500).json({ message: 'Failed to fetch occasions' });
  }
};

// Create a new occasion for the user
export const createOccasion = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, outfitIds = [] } = req.body;
    if (!name) return res.status(400).json({ message: 'Name is required' });
    
    // Create occasion with optional outfit connections
    const occasion = await prisma.occasion.create({
      data: { 
        name, 
        userId,
        ...(outfitIds.length > 0 && {
          outfits: {
            connect: outfitIds.map(id => ({ id }))
          }
        })
      },
      include: {
        outfits: {
          include: {
            outfitClothing: {
              include: { clothing: true }
            }
          }
        }
      }
    });
    res.status(201).json(occasion);
  } catch (error) {
    console.error('Error creating occasion:', error);
    res.status(500).json({ message: 'Failed to create occasion' });
  }
};

// Delete an occasion by ID (only if it belongs to the user)
export const deleteOccasion = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    // Check ownership
    const occasion = await prisma.occasion.findUnique({ where: { id } });
    if (!occasion || occasion.userId !== userId) {
      return res.status(404).json({ message: 'Occasion not found' });
    }
    await prisma.occasion.delete({ where: { id } });
    res.json({ message: 'Occasion deleted' });
  } catch (error) {
    console.error('Error deleting occasion:', error);
    res.status(500).json({ message: 'Failed to delete occasion' });
  }
};

// Get outfits for a specific occasion
export const getOccasionOutfits = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    
    const occasion = await prisma.occasion.findUnique({
      where: { id },
      include: {
        outfits: {
          include: {
            outfitClothing: {
              include: { clothing: true }
            }
          }
        }
      }
    });
    
    if (!occasion || occasion.userId !== userId) {
      return res.status(404).json({ message: 'Occasion not found' });
    }
    
    // Transform outfits to match frontend expectations
    const transformedOutfits = await Promise.all(occasion.outfits.map(outfit => transformOutfitData(outfit)));

    res.json({ occasion: { ...occasion, outfits: transformedOutfits }, outfits: transformedOutfits });
  } catch (error) {
    console.error('Error fetching occasion outfits:', error);
    res.status(500).json({ message: 'Failed to fetch occasion outfits' });
  }
};

// Assign outfits to an occasion (many-to-many)
export const assignOutfitsToOccasion = async (req, res) => {
  try {
    const userId = req.user.id;
    const { occasionId, outfitIds } = req.body;
    if (!occasionId || !Array.isArray(outfitIds)) {
      return res.status(400).json({ message: 'occasionId and outfitIds[] required' });
    }
    // Check ownership
    const occasion = await prisma.occasion.findUnique({ where: { id: occasionId } });
    if (!occasion || occasion.userId !== userId) {
      return res.status(404).json({ message: 'Occasion not found' });
    }
    // Connect outfits
    await prisma.occasion.update({
      where: { id: occasionId },
      data: {
        outfits: {
          set: [], // Remove all first (optional, for replace behavior)
          connect: outfitIds.map(id => ({ id }))
        }
      }
    });
    res.json({ message: 'Outfits assigned to occasion' });
  } catch (error) {
    console.error('Error assigning outfits:', error);
    res.status(500).json({ message: 'Failed to assign outfits' });
  }
}; 
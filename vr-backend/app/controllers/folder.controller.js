import prisma from '../utils/prismaClient.js';
import { getPresignedUrl } from '../../s3.mjs';

// Helper function to get folder with item count and preview images
async function transformFolderData(folder) {
  // Get up to 4 items for preview
  const previewItems = await Promise.all(
    folder.items.slice(0, 4).map(async (item) => {
      const { url: presignedUrl, error: presignError } = await getPresignedUrl(item.clothing.key);
      if (presignError) {
        console.error(`Error generating presigned URL for key ${item.clothing.key}:`, presignError);
      }
      return {
        id: item.clothing.id,
        url: presignedUrl || "",
        name: item.clothing.name,
      };
    })
  );

  return {
    id: folder.id,
    name: folder.name,
    description: folder.description,
    isPublic: folder.isPublic,
    createdAt: folder.createdAt,
    updatedAt: folder.updatedAt,
    itemCount: folder.items.length,
    previewItems,
  };
}

// Get all folders for the current user
export const getFolders = async (req, res) => {
  try {
    const userId = req.user.id;
    const folders = await prisma.folder.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            clothing: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    const transformedFolders = await Promise.all(
      folders.map(folder => transformFolderData(folder))
    );

    // Get recently added-to folders (last 3 unique folders that had items added)
    const recentFolderItems = await prisma.folderItem.findMany({
      where: {
        folder: {
          userId: userId
        }
      },
      include: {
        folder: {
          include: {
            items: {
              include: {
                clothing: true
              }
            }
          }
        }
      },
      orderBy: {
        addedAt: 'desc'
      },
      take: 50 // Take more than we need to ensure we get 3 unique folders
    });

    // Get unique folders (max 3)
    const seenFolderIds = new Set();
    const recentFolders = [];

    for (const item of recentFolderItems) {
      if (!seenFolderIds.has(item.folder.id) && recentFolders.length < 3) {
        seenFolderIds.add(item.folder.id);
        recentFolders.push(item.folder);
      }
      if (recentFolders.length === 3) break;
    }

    const transformedRecentFolders = await Promise.all(
      recentFolders.map(folder => transformFolderData(folder))
    );

    res.json({
      folders: transformedFolders,
      recentlyAddedTo: transformedRecentFolders
    });
  } catch (error) {
    console.error('Error fetching folders:', error);
    res.status(500).json({ message: 'Failed to fetch folders' });
  }
};

// Create a new folder
export const createFolder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, description, isPublic = false } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'Folder name is required' });
    }

    const folder = await prisma.folder.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        isPublic,
        userId,
      },
      include: {
        items: {
          include: {
            clothing: true
          }
        }
      }
    });

    const transformedFolder = await transformFolderData(folder);
    res.status(201).json({ folder: transformedFolder });
  } catch (error) {
    console.error('Error creating folder:', error);
    res.status(500).json({ message: 'Failed to create folder' });
  }
};

// Update folder details
export const updateFolder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { name, description, isPublic } = req.body;

    // Check if folder exists and belongs to user
    const existingFolder = await prisma.folder.findFirst({
      where: { id, userId }
    });

    if (!existingFolder) {
      return res.status(404).json({ message: 'Folder not found' });
    }

    if (name !== undefined && name.trim() === '') {
      return res.status(400).json({ message: 'Folder name cannot be empty' });
    }

    const folder = await prisma.folder.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(isPublic !== undefined && { isPublic }),
      },
      include: {
        items: {
          include: {
            clothing: true
          }
        }
      }
    });

    const transformedFolder = await transformFolderData(folder);
    res.json({ folder: transformedFolder });
  } catch (error) {
    console.error('Error updating folder:', error);
    res.status(500).json({ message: 'Failed to update folder' });
  }
};

// Delete a folder
export const deleteFolder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // Check if folder exists and belongs to user
    const folder = await prisma.folder.findFirst({
      where: { id, userId }
    });

    if (!folder) {
      return res.status(404).json({ message: 'Folder not found' });
    }

    await prisma.folder.delete({
      where: { id }
    });

    res.json({ message: 'Folder deleted successfully' });
  } catch (error) {
    console.error('Error deleting folder:', error);
    res.status(500).json({ message: 'Failed to delete folder' });
  }
};

// Get all items in a folder
export const getFolderItems = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // Check if folder exists and belongs to user
    const folder = await prisma.folder.findFirst({
      where: { id, userId },
      include: {
        items: {
          include: {
            clothing: true
          },
          orderBy: {
            addedAt: 'desc'
          }
        }
      }
    });

    if (!folder) {
      return res.status(404).json({ message: 'Folder not found' });
    }

    const items = await Promise.all(
      folder.items.map(async (item) => {
        const { url: presignedUrl, error: presignError } = await getPresignedUrl(item.clothing.key);
        if (presignError) {
          console.error(`Error generating presigned URL for key ${item.clothing.key}:`, presignError);
        }

        return {
          id: item.clothing.id,
          key: item.clothing.key,
          url: presignedUrl || "",
          name: item.clothing.name,
          type: item.clothing.type,
          category: item.clothing.category,
          brand: item.clothing.brand,
          price: item.clothing.price,
          color: item.clothing.color,
          season: item.clothing.season,
          notes: item.clothing.notes,
          tags: item.clothing.tags,
          size: item.clothing.size,
          mode: item.clothing.mode,
          isFavorite: item.clothing.isFavorite,
          addedAt: item.addedAt,
        };
      })
    );

    res.json({ items });
  } catch (error) {
    console.error('Error fetching folder items:', error);
    res.status(500).json({ message: 'Failed to fetch folder items' });
  }
};

// Add item to folder
export const addItemToFolder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { clothingId } = req.body;

    if (!clothingId) {
      return res.status(400).json({ message: 'clothingId is required' });
    }

    // Check if folder exists and belongs to user
    const folder = await prisma.folder.findFirst({
      where: { id, userId }
    });

    if (!folder) {
      return res.status(404).json({ message: 'Folder not found' });
    }

    // Check if clothing item exists and belongs to user
    const clothing = await prisma.clothing.findFirst({
      where: { id: clothingId, userId }
    });

    if (!clothing) {
      return res.status(404).json({ message: 'Clothing item not found' });
    }

    // Check if item is already in folder
    const existingItem = await prisma.folderItem.findFirst({
      where: {
        folderId: id,
        clothingId
      }
    });

    if (existingItem) {
      return res.status(400).json({ message: 'Item is already in this folder' });
    }

    // Add item to folder
    await prisma.folderItem.create({
      data: {
        folderId: id,
        clothingId
      }
    });

    // Return updated folder
    const updatedFolder = await prisma.folder.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            clothing: true
          }
        }
      }
    });

    const transformedFolder = await transformFolderData(updatedFolder);
    res.json({ folder: transformedFolder });
  } catch (error) {
    console.error('Error adding item to folder:', error);
    res.status(500).json({ message: 'Failed to add item to folder' });
  }
};

// Remove item from folder
export const removeItemFromFolder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id, itemId } = req.params;

    // Check if folder exists and belongs to user
    const folder = await prisma.folder.findFirst({
      where: { id, userId }
    });

    if (!folder) {
      return res.status(404).json({ message: 'Folder not found' });
    }

    // Find and delete the folder item
    const folderItem = await prisma.folderItem.findFirst({
      where: {
        folderId: id,
        clothingId: itemId
      }
    });

    if (!folderItem) {
      return res.status(404).json({ message: 'Item not found in folder' });
    }

    await prisma.folderItem.delete({
      where: {
        id: folderItem.id
      }
    });

    // Return updated folder
    const updatedFolder = await prisma.folder.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            clothing: true
          }
        }
      }
    });

    const transformedFolder = await transformFolderData(updatedFolder);
    res.json({ folder: transformedFolder });
  } catch (error) {
    console.error('Error removing item from folder:', error);
    res.status(500).json({ message: 'Failed to remove item from folder' });
  }
};

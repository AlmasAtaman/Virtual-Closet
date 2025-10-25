import { PrismaClient } from "@prisma/client";
import { deleteFromS3 } from '../../s3.mjs';


const prisma = new PrismaClient();


export const deleteImage = async (req, res) => {
  const userId = req.user.id;
  const key = req.params.key;


  try {
    // Delete from S3
    await deleteFromS3({ key });

    // First, find the clothing item to get its ID
    const clothingItem = await prisma.clothing.findFirst({
      where: {
        userId: req.user.id,
        key: key
      }
    });

    if (clothingItem) {
      // Find all outfits that contain this clothing item
      const outfitsToDelete = await prisma.outfitClothing.findMany({
        where: {
          clothingId: clothingItem.id
        },
        select: {
          outfitId: true
        }
      });

      const outfitIds = outfitsToDelete.map(oc => oc.outfitId);

      // Delete all outfits that contained this clothing item
      if (outfitIds.length > 0) {
        await prisma.outfit.deleteMany({
          where: {
            id: { in: outfitIds },
            userId: req.user.id // Safety: only delete user's own outfits
          }
        });
        console.log(`Deleted ${outfitIds.length} outfits that contained the clothing item`);
      }

      // Delete the Clothing item from DB (OutfitClothing will cascade delete)
      await prisma.clothing.delete({
        where: {
          id: clothingItem.id
        }
      });
    }

    return res.status(200).json({ message: "Image deleted successfully" });
  } catch (err) {
    console.error("Delete failed:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
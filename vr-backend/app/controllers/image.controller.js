import { PrismaClient } from "@prisma/client";
import { deleteFromS3 } from '../../s3.mjs';


const prisma = new PrismaClient();


export const deleteImage = async (req, res) => {
  const userId = req.user.id;
  const key = req.params.key;


  try {
    // Delete from S3
    await deleteFromS3({ key });

    // Delete associated OutfitClothing records first
    await prisma.outfitClothing.deleteMany({
      where: {
        clothing: {
          key: key // Find OutfitClothing records where the related Clothing item has this key
        }
      }
    });

    // Then delete the Clothing item from DB
    await prisma.clothing.deleteMany({
      where: {
        userId: req.user.id,
        key: key
      },
    });

    return res.status(200).json({ message: "Image deleted successfully" });
  } catch (err) {
    console.error("Delete failed:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
-- CreateTable
CREATE TABLE "Outfit" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "totalPrice" DOUBLE PRECISION,
    "season" TEXT,
    "occasion" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "Outfit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutfitClothing" (
    "outfitId" TEXT NOT NULL,
    "clothingId" TEXT NOT NULL,

    CONSTRAINT "OutfitClothing_pkey" PRIMARY KEY ("outfitId","clothingId")
);

-- AddForeignKey
ALTER TABLE "Outfit" ADD CONSTRAINT "Outfit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutfitClothing" ADD CONSTRAINT "OutfitClothing_outfitId_fkey" FOREIGN KEY ("outfitId") REFERENCES "Outfit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutfitClothing" ADD CONSTRAINT "OutfitClothing_clothingId_fkey" FOREIGN KEY ("clothingId") REFERENCES "Clothing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

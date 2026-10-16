-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "googleData" JSONB,
ADD COLUMN     "openingHours" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "photosUri" TEXT,
ADD COLUMN     "priceLevel" TEXT,
ADD COLUMN     "pureServiceArea" BOOLEAN,
ADD COLUMN     "reviewsUri" TEXT,
ADD COLUMN     "types" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Cada usuário passa a ter as próprias buscas, requisições e leads. Os dados que já existem vão para o
-- primeiro usuário cadastrado, que vira ADMIN. Sem nenhum usuário, não há a quem entregar os dados.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "User")
     AND (EXISTS (SELECT 1 FROM "Lead") OR EXISTS (SELECT 1 FROM "Search") OR EXISTS (SELECT 1 FROM "ApiRequest")) THEN
    RAISE EXCEPTION 'Há leads, buscas ou requisições sem dono. Crie o seu usuário (bun run user:create) antes desta migration.';
  END IF;
END $$;

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'USER');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "googleApiKey" TEXT,
ADD COLUMN     "googleApiKeyHash" TEXT,
ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'USER';

UPDATE "User" SET "role" = 'ADMIN' WHERE "id" = (SELECT min("id") FROM "User");

-- AlterTable: as requisições já feitas ficam com o admin e continuam contando no mês dele.
ALTER TABLE "ApiRequest" ADD COLUMN     "keyHash" TEXT,
ADD COLUMN     "userId" INTEGER;

UPDATE "ApiRequest" SET "userId" = (SELECT min("id") FROM "User");

ALTER TABLE "ApiRequest" ALTER COLUMN "userId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Search" ADD COLUMN     "userId" INTEGER;

UPDATE "Search" SET "userId" = (SELECT min("id") FROM "User");

ALTER TABLE "Search" ALTER COLUMN "userId" SET NOT NULL;

-- CreateTable
CREATE TABLE "UserLead" (
    "userId" INTEGER NOT NULL,
    "leadId" TEXT NOT NULL,
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "notes" TEXT,
    "city" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "searchNeighborhood" TEXT,
    "firstSearchId" INTEGER,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserLead_pkey" PRIMARY KEY ("userId","leadId")
);

-- Status, anotações e busca de origem de cada lead passam para a lista do admin.
INSERT INTO "UserLead" ("userId", "leadId", "status", "notes", "city", "category", "searchNeighborhood", "firstSearchId", "firstSeenAt", "updatedAt")
SELECT (SELECT min("id") FROM "User"), "id", "status", "notes", "city", "category", "searchNeighborhood", "firstSearchId", "firstSeenAt", "updatedAt"
FROM "Lead";

-- DropForeignKey
ALTER TABLE "Lead" DROP CONSTRAINT "Lead_firstSearchId_fkey";

-- DropIndex
DROP INDEX "Lead_status_idx";

-- DropIndex
DROP INDEX "Lead_city_category_idx";

-- AlterTable
ALTER TABLE "Lead" DROP COLUMN "category",
DROP COLUMN "city",
DROP COLUMN "firstSearchId",
DROP COLUMN "notes",
DROP COLUMN "searchNeighborhood",
DROP COLUMN "status";

-- CreateTable
CREATE TABLE "UserAccess" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserAccess_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserLead_leadId_idx" ON "UserLead"("leadId");

-- CreateIndex
CREATE INDEX "UserLead_userId_status_idx" ON "UserLead"("userId", "status");

-- CreateIndex
CREATE INDEX "UserLead_userId_city_category_idx" ON "UserLead"("userId", "city", "category");

-- CreateIndex
CREATE INDEX "UserAccess_userId_startedAt_idx" ON "UserAccess"("userId", "startedAt");

-- CreateIndex
CREATE INDEX "ApiRequest_period_userId_idx" ON "ApiRequest"("period", "userId");

-- CreateIndex
CREATE INDEX "ApiRequest_period_keyHash_idx" ON "ApiRequest"("period", "keyHash");

-- CreateIndex
CREATE INDEX "Search_userId_createdAt_idx" ON "Search"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "User_googleApiKeyHash_key" ON "User"("googleApiKeyHash");

-- AddForeignKey
ALTER TABLE "ApiRequest" ADD CONSTRAINT "ApiRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Search" ADD CONSTRAINT "Search_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserLead" ADD CONSTRAINT "UserLead_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserLead" ADD CONSTRAINT "UserLead_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserLead" ADD CONSTRAINT "UserLead_firstSearchId_fkey" FOREIGN KEY ("firstSearchId") REFERENCES "Search"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAccess" ADD CONSTRAINT "UserAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

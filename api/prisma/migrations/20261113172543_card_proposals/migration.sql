-- CreateTable
CREATE TABLE "CardProposal" (
    "id" SERIAL NOT NULL,
    "cardId" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "position" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CardProposal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CardProposal_cardId_position_idx" ON "CardProposal"("cardId", "position");

-- AddForeignKey
ALTER TABLE "CardProposal" ADD CONSTRAINT "CardProposal_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "ProjectCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

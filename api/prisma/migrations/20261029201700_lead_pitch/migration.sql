-- AlterTable
ALTER TABLE "User" ADD COLUMN     "displayName" TEXT;

-- CreateTable
CREATE TABLE "LeadPitch" (
    "userId" INTEGER NOT NULL,
    "leadId" TEXT NOT NULL,
    "demoUrl" TEXT,
    "decisionMaker" TEXT,
    "contactWhatsapp" TEXT,
    "contactNotes" TEXT,
    "blocks" JSONB NOT NULL DEFAULT '[]',
    "nextFollowUpAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeadPitch_pkey" PRIMARY KEY ("userId","leadId")
);

-- CreateIndex
CREATE INDEX "LeadPitch_userId_nextFollowUpAt_idx" ON "LeadPitch"("userId", "nextFollowUpAt");

-- AddForeignKey
ALTER TABLE "LeadPitch" ADD CONSTRAINT "LeadPitch_userId_leadId_fkey" FOREIGN KEY ("userId", "leadId") REFERENCES "UserLead"("userId", "leadId") ON DELETE CASCADE ON UPDATE CASCADE;

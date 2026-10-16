-- CreateTable
CREATE TABLE "SearchLead" (
    "searchId" INTEGER NOT NULL,
    "leadId" TEXT NOT NULL,
    "page" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SearchLead_pkey" PRIMARY KEY ("searchId","leadId")
);

-- CreateIndex
CREATE INDEX "SearchLead_leadId_idx" ON "SearchLead"("leadId");

-- CreateIndex
CREATE INDEX "SearchLead_createdAt_idx" ON "SearchLead"("createdAt");

-- AddForeignKey
ALTER TABLE "SearchLead" ADD CONSTRAINT "SearchLead_searchId_fkey" FOREIGN KEY ("searchId") REFERENCES "Search"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SearchLead" ADD CONSTRAINT "SearchLead_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

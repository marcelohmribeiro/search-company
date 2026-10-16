-- CreateEnum
CREATE TYPE "SiteStatus" AS ENUM ('NO_WEBSITE', 'INSTAGRAM_ONLY', 'WHATSAPP_ONLY', 'FACEBOOK_ONLY', 'LINK_AGGREGATOR', 'HAS_WEBSITE');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'REPLIED', 'CLOSED', 'DISCARDED');

-- CreateEnum
CREATE TYPE "SearchStatus" AS ENUM ('RUNNING', 'DONE', 'LIMIT_REACHED', 'FAILED');

-- CreateEnum
CREATE TYPE "ApiRequestStatus" AS ENUM ('PENDING', 'SUCCESS', 'ERROR');

-- CreateTable
CREATE TABLE "ApiRequest" (
    "id" SERIAL NOT NULL,
    "period" TEXT NOT NULL,
    "page" INTEGER NOT NULL,
    "status" "ApiRequestStatus" NOT NULL DEFAULT 'PENDING',
    "httpStatus" INTEGER,
    "resultsCount" INTEGER,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "searchId" INTEGER,

    CONSTRAINT "ApiRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Search" (
    "id" SERIAL NOT NULL,
    "city" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "neighborhood" TEXT,
    "textQuery" TEXT NOT NULL,
    "maxPages" INTEGER NOT NULL,
    "pagesFetched" INTEGER NOT NULL DEFAULT 0,
    "resultsCount" INTEGER NOT NULL DEFAULT 0,
    "newLeadsCount" INTEGER NOT NULL DEFAULT 0,
    "exhausted" BOOLEAN NOT NULL DEFAULT false,
    "status" "SearchStatus" NOT NULL DEFAULT 'RUNNING',
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "Search_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "neighborhood" TEXT,
    "city" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "searchNeighborhood" TEXT,
    "primaryType" TEXT,
    "primaryTypeName" TEXT,
    "nationalPhone" TEXT,
    "internationalPhone" TEXT,
    "websiteUri" TEXT,
    "siteStatus" "SiteStatus" NOT NULL,
    "rating" DOUBLE PRECISION,
    "userRatingCount" INTEGER,
    "googleMapsUri" TEXT,
    "businessStatus" TEXT,
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "notes" TEXT,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "firstSearchId" INTEGER,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ApiRequest_period_idx" ON "ApiRequest"("period");

-- CreateIndex
CREATE INDEX "Search_textQuery_idx" ON "Search"("textQuery");

-- CreateIndex
CREATE INDEX "Lead_siteStatus_idx" ON "Lead"("siteStatus");

-- CreateIndex
CREATE INDEX "Lead_status_idx" ON "Lead"("status");

-- CreateIndex
CREATE INDEX "Lead_city_category_idx" ON "Lead"("city", "category");

-- AddForeignKey
ALTER TABLE "ApiRequest" ADD CONSTRAINT "ApiRequest_searchId_fkey" FOREIGN KEY ("searchId") REFERENCES "Search"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_firstSearchId_fkey" FOREIGN KEY ("firstSearchId") REFERENCES "Search"("id") ON DELETE SET NULL ON UPDATE CASCADE;

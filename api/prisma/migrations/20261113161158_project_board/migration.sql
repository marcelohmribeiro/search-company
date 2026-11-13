-- CreateEnum
CREATE TYPE "BoardColumn" AS ENUM ('BACKLOG', 'TODO', 'REVIEW', 'DONE');

-- CreateTable
CREATE TABLE "ProjectCard" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "leadId" TEXT NOT NULL,
    "column" "BoardColumn" NOT NULL DEFAULT 'BACKLOG',
    "position" DOUBLE PRECISION NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectCard_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProjectCard_userId_column_position_idx" ON "ProjectCard"("userId", "column", "position");

-- AddForeignKey
ALTER TABLE "ProjectCard" ADD CONSTRAINT "ProjectCard_userId_leadId_fkey" FOREIGN KEY ("userId", "leadId") REFERENCES "UserLead"("userId", "leadId") ON DELETE CASCADE ON UPDATE CASCADE;

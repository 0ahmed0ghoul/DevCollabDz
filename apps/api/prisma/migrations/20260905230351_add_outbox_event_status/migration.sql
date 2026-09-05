-- CreateEnum
CREATE TYPE "ApplicationEventStatus" AS ENUM ('PENDING', 'PROCESSING', 'PROCESSED', 'FAILED');

-- AlterTable
ALTER TABLE "ApplicationEvent" ADD COLUMN     "attempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastError" TEXT,
ADD COLUMN     "nextAttemptAt" TIMESTAMP(3),
ADD COLUMN     "processedAt" TIMESTAMP(3),
ADD COLUMN     "status" "ApplicationEventStatus" NOT NULL DEFAULT 'PENDING';

-- CreateIndex
CREATE INDEX "ApplicationEvent_status_idx" ON "ApplicationEvent"("status");

-- CreateIndex
CREATE INDEX "ApplicationEvent_status_nextAttemptAt_idx" ON "ApplicationEvent"("status", "nextAttemptAt");

-- CreateIndex
CREATE INDEX "ApplicationEvent_createdAt_idx" ON "ApplicationEvent"("createdAt");

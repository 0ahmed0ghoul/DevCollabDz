-- CreateTable
CREATE TABLE "ApplicationEvent" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "projectId" TEXT,
    "actorId" TEXT,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApplicationEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ApplicationEvent_eventId_key" ON "ApplicationEvent"("eventId");

-- CreateIndex
CREATE INDEX "ApplicationEvent_type_idx" ON "ApplicationEvent"("type");

-- CreateIndex
CREATE INDEX "ApplicationEvent_projectId_idx" ON "ApplicationEvent"("projectId");

-- CreateIndex
CREATE INDEX "ApplicationEvent_actorId_idx" ON "ApplicationEvent"("actorId");

-- CreateIndex
CREATE INDEX "ApplicationEvent_timestamp_idx" ON "ApplicationEvent"("timestamp");

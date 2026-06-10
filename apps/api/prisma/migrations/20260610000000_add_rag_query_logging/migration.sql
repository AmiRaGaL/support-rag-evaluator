-- CreateTable
CREATE TABLE "RagQuery" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "refusal" BOOLEAN NOT NULL DEFAULT false,
    "confidence" DOUBLE PRECISION,
    "provider" TEXT NOT NULL,
    "retrievedChunkCount" INTEGER NOT NULL,
    "latencyMs" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RagQuery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RagRetrievedChunk" (
    "id" TEXT NOT NULL,
    "ragQueryId" TEXT NOT NULL,
    "chunkId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "documentTitle" TEXT NOT NULL,
    "sourceKey" TEXT NOT NULL,
    "chunkIndex" INTEGER NOT NULL,
    "similarity" DOUBLE PRECISION NOT NULL,
    "citationUsed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RagRetrievedChunk_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RagQuery_createdAt_idx" ON "RagQuery"("createdAt");

-- CreateIndex
CREATE INDEX "RagQuery_refusal_idx" ON "RagQuery"("refusal");

-- CreateIndex
CREATE INDEX "RagRetrievedChunk_ragQueryId_idx" ON "RagRetrievedChunk"("ragQueryId");

-- CreateIndex
CREATE INDEX "RagRetrievedChunk_sourceKey_idx" ON "RagRetrievedChunk"("sourceKey");

-- CreateIndex
CREATE INDEX "RagRetrievedChunk_citationUsed_idx" ON "RagRetrievedChunk"("citationUsed");

-- AddForeignKey
ALTER TABLE "RagRetrievedChunk" ADD CONSTRAINT "RagRetrievedChunk_ragQueryId_fkey" FOREIGN KEY ("ragQueryId") REFERENCES "RagQuery"("id") ON DELETE CASCADE ON UPDATE CASCADE;

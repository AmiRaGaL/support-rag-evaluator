-- CreateTable
CREATE TABLE "EvalRun" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "datasetPath" TEXT NOT NULL,
    "totalCases" INTEGER NOT NULL,
    "passedCases" INTEGER NOT NULL,
    "failedCases" INTEGER NOT NULL,
    "refusalAccuracy" DOUBLE PRECISION NOT NULL,
    "citationAccuracy" DOUBLE PRECISION NOT NULL,
    "answerMatchAccuracy" DOUBLE PRECISION NOT NULL,
    "provider" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EvalRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvalCaseResult" (
    "id" TEXT NOT NULL,
    "evalRunId" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "passed" BOOLEAN NOT NULL,
    "expectedAnswer" TEXT NOT NULL,
    "expectedSources" JSONB NOT NULL,
    "actualAnswer" TEXT NOT NULL,
    "actualRefusal" BOOLEAN NOT NULL,
    "actualConfidence" DOUBLE PRECISION,
    "actualCitations" JSONB NOT NULL,
    "refusalCorrect" BOOLEAN NOT NULL,
    "citationCorrect" BOOLEAN NOT NULL,
    "answerMatch" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EvalCaseResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EvalRun_createdAt_idx" ON "EvalRun"("createdAt");

-- CreateIndex
CREATE INDEX "EvalRun_provider_idx" ON "EvalRun"("provider");

-- CreateIndex
CREATE INDEX "EvalCaseResult_evalRunId_idx" ON "EvalCaseResult"("evalRunId");

-- CreateIndex
CREATE INDEX "EvalCaseResult_caseId_idx" ON "EvalCaseResult"("caseId");

-- CreateIndex
CREATE INDEX "EvalCaseResult_passed_idx" ON "EvalCaseResult"("passed");

-- CreateIndex
CREATE INDEX "EvalCaseResult_type_idx" ON "EvalCaseResult"("type");

-- AddForeignKey
ALTER TABLE "EvalCaseResult" ADD CONSTRAINT "EvalCaseResult_evalRunId_fkey" FOREIGN KEY ("evalRunId") REFERENCES "EvalRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EvalRun" ADD COLUMN "judgeProvider" TEXT NOT NULL DEFAULT 'deterministic';

ALTER TABLE "EvalCaseResult" ADD COLUMN "judgeProvider" TEXT;
ALTER TABLE "EvalCaseResult" ADD COLUMN "judgeScore" DOUBLE PRECISION;
ALTER TABLE "EvalCaseResult" ADD COLUMN "judgePassed" BOOLEAN;
ALTER TABLE "EvalCaseResult" ADD COLUMN "judgeReasoning" TEXT;
ALTER TABLE "EvalCaseResult" ADD COLUMN "judgeResult" JSONB;

CREATE INDEX "EvalRun_judgeProvider_idx" ON "EvalRun"("judgeProvider");
CREATE INDEX "EvalCaseResult_judgePassed_idx" ON "EvalCaseResult"("judgePassed");

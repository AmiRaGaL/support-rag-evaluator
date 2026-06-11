import type { EvalRun } from "@/lib/api-client";

export interface EvalAnalyticsSummary {
  runCount: number;
  totalCases: number;
  passedCases: number;
  failedCases: number;
  refusalAccuracy: number;
  citationAccuracy: number;
  answerMatchAccuracy: number;
  trend: EvalTrendPoint[];
}

export interface EvalTrendPoint {
  id: string;
  label: string;
  createdAt: string;
  totalCases: number;
  passedCases: number;
  failedCases: number;
  passRate: number;
  refusalAccuracy: number;
  citationAccuracy: number;
  answerMatchAccuracy: number;
}

export function shapeEvalAnalytics(runs: EvalRun[]): EvalAnalyticsSummary {
  const chronologicalRuns = [...runs].sort(
    (left, right) =>
      new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
  );
  const totals = chronologicalRuns.reduce(
    (accumulator, run) => ({
      totalCases: accumulator.totalCases + run.totalCases,
      passedCases: accumulator.passedCases + run.passedCases,
      failedCases: accumulator.failedCases + run.failedCases,
    }),
    {
      totalCases: 0,
      passedCases: 0,
      failedCases: 0,
    },
  );

  return {
    runCount: chronologicalRuns.length,
    totalCases: totals.totalCases,
    passedCases: totals.passedCases,
    failedCases: totals.failedCases,
    refusalAccuracy: weightedAverage(
      chronologicalRuns,
      (run) => run.refusalAccuracy,
      (run) => run.totalCases,
    ),
    citationAccuracy: weightedAverage(
      chronologicalRuns,
      (run) => run.citationAccuracy,
      (run) => run.totalCases,
    ),
    answerMatchAccuracy: weightedAverage(
      chronologicalRuns,
      (run) => run.answerMatchAccuracy,
      (run) => run.totalCases,
    ),
    trend: chronologicalRuns.map((run, index) => ({
      id: run.id,
      label: `Run ${index + 1}`,
      createdAt: run.createdAt,
      totalCases: run.totalCases,
      passedCases: run.passedCases,
      failedCases: run.failedCases,
      passRate: run.passedCases / Math.max(run.totalCases, 1),
      refusalAccuracy: run.refusalAccuracy,
      citationAccuracy: run.citationAccuracy,
      answerMatchAccuracy: run.answerMatchAccuracy,
    })),
  };
}

function weightedAverage(
  runs: EvalRun[],
  valueForRun: (run: EvalRun) => number,
  weightForRun: (run: EvalRun) => number,
) {
  const totalWeight = runs.reduce((sum, run) => sum + weightForRun(run), 0);

  if (totalWeight === 0) {
    return 0;
  }

  return (
    runs.reduce(
      (sum, run) => sum + valueForRun(run) * weightForRun(run),
      0,
    ) / totalWeight
  );
}


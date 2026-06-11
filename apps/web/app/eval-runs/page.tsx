"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  listEvalRuns,
  runBaselineEval,
  type BaselineEvalRun,
  type EvalRun,
} from "@/lib/api-client";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  MetricCard,
  PageHeader,
} from "@/components/ui";
import { formatDate, formatPercent } from "@/lib/formatters";

export default function EvalRunsPage() {
  const [runs, setRuns] = useState<EvalRun[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);

  async function loadRuns() {
    const result = await listEvalRuns({ limit: 20 });
    setRuns(result);
  }

  useEffect(() => {
    let isCurrent = true;

    async function loadInitialRuns() {
      try {
        const result = await listEvalRuns({ limit: 20 });

        if (isCurrent) {
          setRuns(result);
          setError(null);
        }
      } catch (caughtError) {
        if (isCurrent) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "Unable to load eval runs.",
          );
        }
      } finally {
        if (isCurrent) {
          setIsLoading(false);
        }
      }
    }

    void loadInitialRuns();

    return () => {
      isCurrent = false;
    };
  }, []);

  async function handleRunBaseline() {
    setIsRunning(true);
    setError(null);
    setSuccess(null);

    try {
      const result: BaselineEvalRun = await runBaselineEval();
      setSuccess(`Baseline eval completed and saved as ${result.evalRunId}.`);
      await loadRuns();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to run baseline eval.",
      );
    } finally {
      setIsRunning(false);
      setIsLoading(false);
    }
  }

  return (
    <div className="dashboard-page">
      <PageHeader
        description="Review baseline evaluation runs across refusal, citation, and answer matching behavior."
        eyebrow="Evaluation"
        title="Eval Runs"
      />

      <Card className="toolbar-panel">
        <div>
          <h2>Baseline eval</h2>
          <p>Run the local baseline dataset and refresh the recent run list.</p>
        </div>
        <Button disabled={isRunning} onClick={handleRunBaseline} type="button">
          {isRunning ? "Running..." : "Run baseline"}
        </Button>
      </Card>

      {success ? <p className="success-message">{success}</p> : null}
      {error ? <ErrorState>{error}</ErrorState> : null}

      <Card className="data-panel" aria-label="Recent eval runs">
        {isLoading ? <LoadingState>Loading eval runs...</LoadingState> : null}
        {!isLoading && !error && runs.length === 0 ? (
          <EmptyState>No eval runs yet. Run the baseline eval.</EmptyState>
        ) : null}

        {runs.length > 0 ? (
          <div className="record-list">
            {runs.map((run) => (
              <Card as="article" className="record-card" key={run.id}>
                <div className="record-card-header">
                  <div>
                    <h2>{run.name}</h2>
                    <p>{formatDate(run.createdAt)}</p>
                  </div>
                  <Badge tone="success">
                    {run.passedCases}/{run.totalCases} passed
                  </Badge>
                </div>

                <dl className="metric-grid record-metrics">
                  <MetricCard label="Total" value={run.totalCases} />
                  <MetricCard label="Passed" value={run.passedCases} />
                  <MetricCard label="Failed" value={run.failedCases} />
                  <MetricCard
                    label="Refusal"
                    value={formatPercent(run.refusalAccuracy)}
                  />
                  <MetricCard
                    label="Citation"
                    value={formatPercent(run.citationAccuracy)}
                  />
                  <MetricCard
                    label="Answer"
                    value={formatPercent(run.answerMatchAccuracy)}
                  />
                  <MetricCard label="Provider" value={run.provider} />
                </dl>

                <Link className="text-link" href={`/eval-runs/${run.id}`}>
                  View details
                </Link>
              </Card>
            ))}
          </div>
        ) : null}
      </Card>
    </div>
  );
}

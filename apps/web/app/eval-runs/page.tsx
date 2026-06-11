"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  apiBaseUrl,
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
      } catch {
        if (isCurrent) {
          setError("eval-runs-request-failed");
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
    } catch {
      setError("baseline-run-failed");
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
          <p>
            Runs the local baseline dataset, ingests sample docs, embeds missing
            chunks, and refreshes the recent run list.
          </p>
        </div>
        <Button disabled={isRunning} onClick={handleRunBaseline} type="button">
          {isRunning ? "Running baseline..." : "Run baseline"}
        </Button>
      </Card>

      {isRunning ? (
        <LoadingState title="Running baseline eval">
          Preparing sample docs, embedding missing chunks, running eval cases,
          and saving the result. This can take a moment on a fresh database.
        </LoadingState>
      ) : null}
      {success ? <p className="success-message">{success}</p> : null}
      {error ? (
        <ErrorState
          title={
            error === "baseline-run-failed"
              ? "Baseline eval did not finish"
              : "Eval runs are unavailable"
          }
        >
          {error === "baseline-run-failed" ? (
            <>
              Check that the API is running at <code>{apiBaseUrl}</code>. The
              baseline runner handles sample docs and missing embeddings, so no
              Groq key is required for the default deterministic setup.
            </>
          ) : (
            <>
              The dashboard could not load eval runs from{" "}
              <code>{apiBaseUrl}</code>. Check the API base URL and make sure
              the backend is running locally.
            </>
          )}
        </ErrorState>
      ) : null}

      <Card className="data-panel" aria-label="Recent eval runs">
        {isLoading ? (
          <LoadingState title="Loading eval runs">
            Fetching recent baseline runs and persisted eval metrics from the
            API.
          </LoadingState>
        ) : null}
        {!isLoading && !error && runs.length === 0 ? (
          <EmptyState
            action={
              <Button
                disabled={isRunning}
                onClick={handleRunBaseline}
                type="button"
              >
                Run baseline
              </Button>
            }
            title="No eval runs yet"
          >
            Run the baseline eval to create the first saved run. It will ingest
            sample docs and embed missing chunks before evaluating retrieval,
            citations, answers, and refusals.
          </EmptyState>
        ) : null}

        {runs.length > 0 ? (
          <div className="record-list">
            {runs.map((run) => (
              <Card
                as="article"
                className="record-card eval-run-card"
                key={run.id}
              >
                <div className="record-card-header">
                  <div>
                    <h2>{run.name}</h2>
                    <p>
                      {formatDate(run.createdAt)} · {run.provider} ·{" "}
                      {formatPassRate(run)} pass rate
                    </p>
                  </div>
                  <Badge tone={run.failedCases === 0 ? "success" : "danger"}>
                    {run.failedCases === 0
                      ? "all passed"
                      : `${run.failedCases} failed`}
                  </Badge>
                </div>

                <div className="eval-status-strip" aria-hidden="true">
                  <span
                    style={{
                      width: getPassRateWidth(run),
                    }}
                  />
                </div>

                <dl className="metric-grid eval-metrics">
                  <MetricCard label="Total cases" value={run.totalCases} />
                  <MetricCard label="Passed cases" value={run.passedCases} />
                  <MetricCard label="Failed cases" value={run.failedCases} />
                  <MetricCard
                    label="Refusal accuracy"
                    value={formatPercent(run.refusalAccuracy)}
                  />
                  <MetricCard
                    label="Citation accuracy"
                    value={formatPercent(run.citationAccuracy)}
                  />
                  <MetricCard
                    label="Answer match"
                    value={formatPercent(run.answerMatchAccuracy)}
                  />
                </dl>

                <Link
                  className="button button-secondary"
                  href={`/eval-runs/${run.id}`}
                >
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

function formatPassRate(run: EvalRun) {
  return formatPercent(run.passedCases / Math.max(run.totalCases, 1));
}

function getPassRateWidth(run: EvalRun) {
  return `${Math.round(
    (run.passedCases / Math.max(run.totalCases, 1)) * 100,
  )}%`;
}

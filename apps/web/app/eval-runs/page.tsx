"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  listEvalRuns,
  runBaselineEval,
  type BaselineEvalRun,
  type EvalRun,
} from "@/lib/api-client";
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
      <section className="intro">
        <p className="eyebrow">Evaluation</p>
        <h1>Eval Runs</h1>
        <p className="lede">
          Review baseline evaluation runs across refusal, citation, and answer
          matching behavior.
        </p>
      </section>

      <section className="toolbar-panel">
        <div>
          <h2>Baseline eval</h2>
          <p>Run the local baseline dataset and refresh the recent run list.</p>
        </div>
        <button disabled={isRunning} onClick={handleRunBaseline} type="button">
          {isRunning ? "Running..." : "Run baseline"}
        </button>
      </section>

      {success ? <p className="success-message">{success}</p> : null}
      {error ? <p className="error-message">{error}</p> : null}

      <section className="data-panel" aria-label="Recent eval runs">
        {isLoading ? <p className="empty-state">Loading eval runs...</p> : null}
        {!isLoading && !error && runs.length === 0 ? (
          <p className="empty-state">No eval runs yet. Run the baseline eval.</p>
        ) : null}

        {runs.length > 0 ? (
          <div className="record-list">
            {runs.map((run) => (
              <article className="record-card" key={run.id}>
                <div className="record-card-header">
                  <div>
                    <h2>{run.name}</h2>
                    <p>{formatDate(run.createdAt)}</p>
                  </div>
                  <span className="status-pill status-pill-ok">
                    {run.passedCases}/{run.totalCases} passed
                  </span>
                </div>

                <dl className="record-metadata">
                  <div>
                    <dt>Total</dt>
                    <dd>{run.totalCases}</dd>
                  </div>
                  <div>
                    <dt>Passed</dt>
                    <dd>{run.passedCases}</dd>
                  </div>
                  <div>
                    <dt>Failed</dt>
                    <dd>{run.failedCases}</dd>
                  </div>
                  <div>
                    <dt>Refusal</dt>
                    <dd>{formatPercent(run.refusalAccuracy)}</dd>
                  </div>
                  <div>
                    <dt>Citation</dt>
                    <dd>{formatPercent(run.citationAccuracy)}</dd>
                  </div>
                  <div>
                    <dt>Answer</dt>
                    <dd>{formatPercent(run.answerMatchAccuracy)}</dd>
                  </div>
                  <div>
                    <dt>Provider</dt>
                    <dd>{run.provider}</dd>
                  </div>
                </dl>

                <Link className="text-link" href={`/eval-runs/${run.id}`}>
                  View details
                </Link>
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}

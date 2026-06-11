"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  MetricCard,
  PageHeader,
} from "@/components/ui";
import { getEvalRun, type EvalRun } from "@/lib/api-client";
import { formatDate, formatPercent } from "@/lib/formatters";

export default function EvalRunDetailPage() {
  const params = useParams<{ id: string }>();
  const [run, setRun] = useState<EvalRun | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isCurrent = true;

    async function loadRun() {
      try {
        const result = await getEvalRun(params.id);

        if (isCurrent) {
          setRun(result);
          setError(null);
        }
      } catch (caughtError) {
        if (isCurrent) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "Unable to load eval run detail.",
          );
        }
      } finally {
        if (isCurrent) {
          setIsLoading(false);
        }
      }
    }

    void loadRun();

    return () => {
      isCurrent = false;
    };
  }, [params.id]);

  return (
    <div className="dashboard-page">
      <Link className="text-link" href="/eval-runs">
        Back to eval runs
      </Link>

      {isLoading ? <LoadingState>Loading eval run...</LoadingState> : null}
      {error ? <ErrorState>{error}</ErrorState> : null}

      {run ? (
        <>
          <PageHeader
            description={
              <>
                {run.provider} · {formatDate(run.createdAt)}
              </>
            }
            eyebrow="Eval detail"
            title={run.name}
          />

          <Card className="data-panel">
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
            </dl>

            <section className="result-list">
              <h2>Cases</h2>
              {run.results.length > 0 ? (
                <div className="result-items">
                  {run.results.map((result) => (
                    <Card
                      as="article"
                      className="result-item"
                      key={result.caseId}
                    >
                      <div className="item-title">
                        <strong>{result.question}</strong>
                        <span>{result.passed ? "passed" : "failed"}</span>
                      </div>
                      <p>
                        {result.type} · refusal{" "}
                        {result.refusalCorrect ? "ok" : "failed"} · citation{" "}
                        {result.citationCorrect ? "ok" : "failed"} · answer{" "}
                        {result.answerMatch ? "ok" : "failed"}
                      </p>
                      <blockquote>{result.actualAnswer}</blockquote>
                    </Card>
                  ))}
                </div>
              ) : (
                <EmptyState>No case results recorded.</EmptyState>
              )}
            </section>
          </Card>
        </>
      ) : null}
    </div>
  );
}

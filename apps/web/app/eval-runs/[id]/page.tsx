"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
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

      {isLoading ? <p className="empty-state">Loading eval run...</p> : null}
      {error ? <p className="error-message">{error}</p> : null}

      {run ? (
        <>
          <section className="intro">
            <p className="eyebrow">Eval detail</p>
            <h1>{run.name}</h1>
            <p className="lede">
              {run.provider} · {formatDate(run.createdAt)}
            </p>
          </section>

          <section className="data-panel">
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
            </dl>

            <section className="result-list">
              <h2>Cases</h2>
              {run.results.length > 0 ? (
                <div className="result-items">
                  {run.results.map((result) => (
                    <article className="result-item" key={result.caseId}>
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
                    </article>
                  ))}
                </div>
              ) : (
                <p className="empty-state">No case results recorded.</p>
              )}
            </section>
          </section>
        </>
      ) : null}
    </div>
  );
}

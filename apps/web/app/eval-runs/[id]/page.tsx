"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  MetricCard,
  PageHeader,
} from "@/components/ui";
import {
  apiBaseUrl,
  getApiErrorMessage,
  getEvalRun,
  type EvalRun,
} from "@/lib/api-client";
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
      } catch (error) {
        if (isCurrent) {
          setError(getApiErrorMessage(error));
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

      {isLoading ? (
        <LoadingState title="Loading eval run">
          Fetching saved metrics and per-case results for this baseline run.
        </LoadingState>
      ) : null}
      {error ? (
        <ErrorState title="Eval run detail is unavailable">
          {error} API base URL: <code>{apiBaseUrl}</code>.
        </ErrorState>
      ) : null}

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
            <div className="eval-detail-summary">
              <div>
                <h2>Aggregate results</h2>
                <p>
                  {run.passedCases} of {run.totalCases} cases passed.{" "}
                  {run.failedCases === 0
                    ? "All checks passed for this run."
                    : `${run.failedCases} cases need review.`}
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

            <section className="result-list eval-case-list">
              <h2>Cases</h2>
              {run.results.length > 0 ? (
                <div className="result-items">
                  {run.results.map((result) => (
                    <EvalCaseCard key={result.caseId} result={result} />
                  ))}
                </div>
              ) : (
                <EmptyState title="No case results recorded">
                  This saved eval run has no per-case results. Run the baseline
                  eval again to create a complete demo record.
                </EmptyState>
              )}
            </section>
          </Card>
        </>
      ) : null}
    </div>
  );
}

function EvalCaseCard({
  result,
}: {
  result: EvalRun["results"][number];
}) {
  return (
    <Card
      as="article"
      className={
        result.passed
          ? "result-item eval-case-card"
          : "result-item eval-case-card eval-case-card-failed"
      }
    >
      <div className="eval-case-header">
        <div>
          <h3>{result.question}</h3>
          <p>{result.type}</p>
        </div>
        <Badge tone={result.passed ? "success" : "danger"}>
          {result.passed ? "passed" : "failed"}
        </Badge>
      </div>

      <dl className="eval-checks">
        <CheckItem label="Refusal" passed={result.refusalCorrect} />
        <CheckItem label="Citation" passed={result.citationCorrect} />
        <CheckItem label="Answer" passed={result.answerMatch} />
      </dl>

      <div className="eval-case-grid">
        <section>
          <h4>Expected</h4>
          <p>{summarizeText(result.expectedAnswer)}</p>
          <small>
            Sources:{" "}
            {result.expectedSources.length > 0
              ? result.expectedSources.join(", ")
              : "none expected"}
          </small>
        </section>
        <section>
          <h4>Actual</h4>
          <p>{summarizeText(result.actualAnswer)}</p>
          <small>
            Refusal: {result.actualRefusal ? "yes" : "no"} · Confidence:{" "}
            {result.actualConfidence === null
              ? "not recorded"
              : formatPercent(result.actualConfidence)}
          </small>
        </section>
      </div>
    </Card>
  );
}

function CheckItem({ label, passed }: { label: string; passed: boolean }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>
        <Badge tone={passed ? "success" : "danger"}>
          {passed ? "correct" : "needs review"}
        </Badge>
      </dd>
    </div>
  );
}

function summarizeText(value: string) {
  const normalized = value.trim();

  if (normalized.length <= 220) {
    return normalized;
  }

  return `${normalized.slice(0, 217)}...`;
}

function getPassRateWidth(run: EvalRun) {
  return `${Math.round(
    (run.passedCases / Math.max(run.totalCases, 1)) * 100,
  )}%`;
}

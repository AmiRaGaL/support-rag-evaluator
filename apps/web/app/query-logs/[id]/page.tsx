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
import { apiBaseUrl, getQueryLog, type QueryLog } from "@/lib/api-client";
import { formatConfidence, formatDate } from "@/lib/formatters";

export default function QueryLogDetailPage() {
  const params = useParams<{ id: string }>();
  const [log, setLog] = useState<QueryLog | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isCurrent = true;

    async function loadLog() {
      try {
        const result = await getQueryLog(params.id);

        if (isCurrent) {
          setLog(result);
          setError(null);
        }
      } catch {
        if (isCurrent) {
          setError("query-log-detail-request-failed");
        }
      } finally {
        if (isCurrent) {
          setIsLoading(false);
        }
      }
    }

    void loadLog();

    return () => {
      isCurrent = false;
    };
  }, [params.id]);

  return (
    <div className="dashboard-page">
      <Link className="text-link" href="/query-logs">
        Back to query logs
      </Link>

      {isLoading ? (
        <LoadingState title="Loading query log">
          Fetching the answer, retrieval metadata, and saved chunks for this
          request.
        </LoadingState>
      ) : null}
      {error ? (
        <ErrorState title="Query log detail is unavailable">
          The dashboard could not load this saved query from{" "}
          <code>{apiBaseUrl}</code>. Check the API base URL, then return to the
          query log list and try again.
        </ErrorState>
      ) : null}

      {log ? (
        <>
          <PageHeader
            description={log.question}
            eyebrow="Query detail"
            title="Query Log"
          />

          <Card className="data-panel">
            <dl className="metric-grid record-metrics">
              <MetricCard label="Refusal" value={log.refusal ? "Yes" : "No"} />
              <MetricCard
                label="Confidence"
                value={formatConfidence(log.confidence)}
              />
              <MetricCard label="Provider" value={log.provider} />
              <MetricCard label="Latency" value={`${log.latencyMs}ms`} />
              <MetricCard label="Created" value={formatDate(log.createdAt)} />
            </dl>

            <div className="answer-panel">
              <p>{log.answer}</p>
            </div>

            <section className="result-list">
              <h2>Retrieved Chunks</h2>
              {log.retrievedChunks.length > 0 ? (
                <div className="result-items">
                  {log.retrievedChunks.map((chunk) => (
                    <Card
                      as="article"
                      className="result-item"
                      key={chunk.chunkId}
                    >
                      <div className="item-title">
                        <strong>{chunk.documentTitle}</strong>
                        <span>{chunk.sourceKey}</span>
                      </div>
                      <p>
                        Chunk {chunk.chunkIndex} · Similarity{" "}
                        {chunk.similarity.toFixed(3)} ·{" "}
                        {chunk.citationUsed ? "Cited" : "Not cited"}
                      </p>
                    </Card>
                  ))}
                </div>
              ) : (
                <EmptyState title="No retrieved chunks recorded">
                  This log has no chunk details. Ingest sample docs and embed
                  missing chunks before sending another supported question.
                </EmptyState>
              )}
            </section>
          </Card>
        </>
      ) : null}
    </div>
  );
}

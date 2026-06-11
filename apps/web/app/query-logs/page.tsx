"use client";

import Link from "next/link";
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
  listQueryLogs,
  type QueryLog,
} from "@/lib/api-client";
import { formatConfidence, formatDate } from "@/lib/formatters";

export default function QueryLogsPage() {
  const [logs, setLogs] = useState<QueryLog[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isCurrent = true;

    async function loadLogs() {
      try {
        const result = await listQueryLogs({ limit: 20 });

        if (isCurrent) {
          setLogs(result);
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

    void loadLogs();

    return () => {
      isCurrent = false;
    };
  }, []);

  return (
    <div className="dashboard-page">
      <PageHeader
        description="Inspect recent support questions, refusal behavior, provider metadata, and response latency."
        eyebrow="Recent activity"
        title="Query Logs"
      />

      <Card className="data-panel" aria-label="Recent query logs">
        {isLoading ? (
          <LoadingState title="Loading query logs">
            Fetching the latest support questions, answers, retrieval metadata,
            and latency from the API.
          </LoadingState>
        ) : null}
        {error ? (
          <ErrorState title="Query logs are unavailable">
            {error} API base URL: <code>{apiBaseUrl}</code>.
          </ErrorState>
        ) : null}
        {!isLoading && !error && logs.length === 0 ? (
          <EmptyState
            action={
              <Link className="button button-secondary" href="/chat">
                Ask a question
              </Link>
            }
            title="No query logs yet"
          >
            Send a chat question to create the first query log. If supported
            questions keep refusing, ingest sample docs and embed missing chunks
            before trying again.
          </EmptyState>
        ) : null}

        {logs.length > 0 ? (
          <div className="record-list">
            {logs.map((log) => (
              <Card as="article" className="record-card" key={log.id}>
                <div className="record-card-header">
                  <div>
                    <h2>{log.question}</h2>
                    <p>{formatDate(log.createdAt)}</p>
                  </div>
                  <Badge tone={log.refusal ? "warning" : "success"}>
                    {log.refusal ? "refused" : "answered"}
                  </Badge>
                </div>

                <dl className="metric-grid record-metrics">
                  <MetricCard
                    label="Confidence"
                    value={formatConfidence(log.confidence)}
                  />
                  <MetricCard label="Provider" value={log.provider} />
                  <MetricCard label="Latency" value={`${log.latencyMs}ms`} />
                  <MetricCard
                    label="Retrieved"
                    value={log.retrievedChunkCount}
                  />
                </dl>

                <Link className="text-link" href={`/query-logs/${log.id}`}>
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

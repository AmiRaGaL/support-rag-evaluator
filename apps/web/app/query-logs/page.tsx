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
import { listQueryLogs, type QueryLog } from "@/lib/api-client";
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
      } catch (caughtError) {
        if (isCurrent) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "Unable to load query logs.",
          );
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
        {isLoading ? <LoadingState>Loading query logs...</LoadingState> : null}
        {error ? <ErrorState>{error}</ErrorState> : null}
        {!isLoading && !error && logs.length === 0 ? (
          <EmptyState>No query logs yet. Send a chat question first.</EmptyState>
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

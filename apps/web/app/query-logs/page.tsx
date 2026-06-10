"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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
      <section className="intro">
        <p className="eyebrow">Recent activity</p>
        <h1>Query Logs</h1>
        <p className="lede">
          Inspect recent support questions, refusal behavior, provider metadata,
          and response latency.
        </p>
      </section>

      <section className="data-panel" aria-label="Recent query logs">
        {isLoading ? <p className="empty-state">Loading query logs...</p> : null}
        {error ? <p className="error-message">{error}</p> : null}
        {!isLoading && !error && logs.length === 0 ? (
          <p className="empty-state">No query logs yet. Send a chat question first.</p>
        ) : null}

        {logs.length > 0 ? (
          <div className="record-list">
            {logs.map((log) => (
              <article className="record-card" key={log.id}>
                <div className="record-card-header">
                  <div>
                    <h2>{log.question}</h2>
                    <p>{formatDate(log.createdAt)}</p>
                  </div>
                  <span
                    className={
                      log.refusal
                        ? "status-pill status-pill-warning"
                        : "status-pill status-pill-ok"
                    }
                  >
                    {log.refusal ? "refused" : "answered"}
                  </span>
                </div>

                <dl className="record-metadata">
                  <div>
                    <dt>Confidence</dt>
                    <dd>{formatConfidence(log.confidence)}</dd>
                  </div>
                  <div>
                    <dt>Provider</dt>
                    <dd>{log.provider}</dd>
                  </div>
                  <div>
                    <dt>Latency</dt>
                    <dd>{log.latencyMs}ms</dd>
                  </div>
                  <div>
                    <dt>Retrieved</dt>
                    <dd>{log.retrievedChunkCount}</dd>
                  </div>
                </dl>

                <Link className="text-link" href={`/query-logs/${log.id}`}>
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

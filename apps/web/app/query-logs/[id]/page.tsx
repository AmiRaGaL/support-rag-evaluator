"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getQueryLog, type QueryLog } from "@/lib/api-client";
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
      } catch (caughtError) {
        if (isCurrent) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "Unable to load query log detail.",
          );
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

      {isLoading ? <p className="empty-state">Loading query log...</p> : null}
      {error ? <p className="error-message">{error}</p> : null}

      {log ? (
        <>
          <section className="intro">
            <p className="eyebrow">Query detail</p>
            <h1>Query Log</h1>
            <p className="lede">{log.question}</p>
          </section>

          <section className="data-panel">
            <dl className="record-metadata">
              <div>
                <dt>Refusal</dt>
                <dd>{log.refusal ? "Yes" : "No"}</dd>
              </div>
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
                <dt>Created</dt>
                <dd>{formatDate(log.createdAt)}</dd>
              </div>
            </dl>

            <div className="answer-panel">
              <p>{log.answer}</p>
            </div>

            <section className="result-list">
              <h2>Retrieved Chunks</h2>
              {log.retrievedChunks.length > 0 ? (
                <div className="result-items">
                  {log.retrievedChunks.map((chunk) => (
                    <article className="result-item" key={chunk.chunkId}>
                      <div className="item-title">
                        <strong>{chunk.documentTitle}</strong>
                        <span>{chunk.sourceKey}</span>
                      </div>
                      <p>
                        Chunk {chunk.chunkIndex} · Similarity{" "}
                        {chunk.similarity.toFixed(3)} ·{" "}
                        {chunk.citationUsed ? "Cited" : "Not cited"}
                      </p>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="empty-state">No retrieved chunks recorded.</p>
              )}
            </section>
          </section>
        </>
      ) : null}
    </div>
  );
}

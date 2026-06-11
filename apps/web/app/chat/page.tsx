"use client";

import { FormEvent, ReactNode, useState } from "react";
import {
  apiBaseUrl,
  listQueryLogs,
  sendChatMessage,
  type ChatResponse,
  type QueryLog,
  type QueryLogRetrievedChunk,
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
import { formatConfidence } from "@/lib/formatters";

const DEFAULT_LIMIT = 5;

export default function ChatPage() {
  const [question, setQuestion] = useState("");
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [response, setResponse] = useState<ChatResponse | null>(null);
  const [queryLog, setQueryLog] = useState<QueryLog | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedQuestion = question.trim();

    if (!trimmedQuestion) {
      setError("empty-question");
      setResponse(null);
      setQueryLog(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await sendChatMessage({
        question: trimmedQuestion,
        limit,
      });

      setResponse(result);
      setQueryLog(await findMatchingQueryLog(result));
    } catch {
      setResponse(null);
      setQueryLog(null);
      setError("chat-request-failed");
    } finally {
      setIsLoading(false);
    }
  }

  const isRefusal = response?.status === "refused";
  const retrievedChunks = queryLog?.retrievedChunks ?? [];

  return (
    <div className="chat-page">
      <PageHeader
        description="Ask a support question and inspect the answer, citations, and retrieval details returned by the API."
        eyebrow="Grounded chat"
        title="Chat"
      />

      <Card as="div" className="chat-form-card">
        <form className="chat-form" onSubmit={handleSubmit}>
          <label htmlFor="question">Question</label>
          <textarea
            id="question"
            name="question"
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Can I export billing history?"
            rows={5}
            value={question}
          />

          <div className="form-row">
            <label htmlFor="limit">Retrieval limit</label>
            <input
              id="limit"
              max={20}
              min={1}
              name="limit"
              onChange={(event) => setLimit(Number(event.target.value))}
              type="number"
              value={limit}
            />
            <Button disabled={isLoading} type="submit">
              {isLoading ? "Sending..." : "Send"}
            </Button>
          </div>
        </form>
      </Card>

      {isLoading ? (
        <LoadingState title="Retrieving support context">
          Searching embedded docs, drafting a grounded answer, and checking for
          citations before returning a response.
        </LoadingState>
      ) : null}

      {error ? (
        <ErrorState
          title={
            error === "empty-question"
              ? "Add a support question"
              : "Chat request did not complete"
          }
        >
          {error === "empty-question" ? (
            "Enter a question about the support docs, then send it again."
          ) : (
            <>
              Check that the API is running at <code>{apiBaseUrl}</code>. If
              the API is up but answers are unsupported, ingest sample docs and
              embed missing chunks before trying again.
            </>
          )}
        </ErrorState>
      ) : null}

      {response ? (
        <Card className="chat-result" aria-label="Chat response">
          <div className="result-header">
            <div>
              <p className="eyebrow">Response</p>
              <h2>{isRefusal ? "Refused" : "Answered"}</h2>
            </div>
            <Badge tone={isRefusal ? "warning" : "success"}>
              {isRefusal ? "refusal" : "grounded"}
            </Badge>
          </div>

          <div className="answer-panel">
            <p>{response.answer}</p>
          </div>

          <dl className="metric-grid compact-metrics">
            <MetricCard
              label="Confidence"
              value={formatConfidence(queryLog?.confidence)}
            />
            <MetricCard
              label="Retrieved chunks"
              value={response.retrievedChunkCount}
            />
          </dl>

          <ResultList
            emptyText="This response was saved before matching query-log details were available, or retrieval returned no chunks. Ingest sample docs and run the embed-missing step if this keeps happening."
            emptyTitle="No retrieved chunks to inspect"
            items={retrievedChunks}
            renderItem={(chunk, index) => (
              <RetrievedChunkItem chunk={chunk} index={index} />
            )}
            title="Retrieved Chunks"
          />

          <ResultList
            emptyText="Refusals and unsupported answers do not include citations. For supported questions, ingest sample docs and embed missing chunks so the assistant has source material to cite."
            emptyTitle="No citations returned"
            items={response.citations}
            renderItem={(citation) => (
              <>
                <div className="item-title">
                  <strong>{citation.documentTitle}</strong>
                  <span>{citation.sourceKey}</span>
                </div>
                <p>Chunk {citation.chunkIndex}</p>
                <blockquote>{citation.snippet}</blockquote>
              </>
            )}
            title="Citations"
          />
        </Card>
      ) : null}
    </div>
  );
}

function ResultList<T>({
  emptyText,
  emptyTitle,
  items,
  renderItem,
  title,
}: {
  emptyText: string;
  emptyTitle: string;
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  title: string;
}) {
  return (
    <section className="result-list">
      <h3>{title}</h3>
      {items.length > 0 ? (
        <div className="result-items">
          {items.map((item, index) => (
            <Card
              as="article"
              className="result-item"
              key={getItemKey(item, index)}
            >
              {renderItem(item, index)}
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState title={emptyTitle}>{emptyText}</EmptyState>
      )}
    </section>
  );
}

function RetrievedChunkItem({
  chunk,
  index,
}: {
  chunk: QueryLogRetrievedChunk;
  index: number;
}) {
  return (
    <>
      <div className="item-title">
        <strong>{chunk.documentTitle}</strong>
        <span>{chunk.sourceKey}</span>
      </div>
      <p>
        Chunk {chunk.chunkIndex} · Similarity {chunk.similarity.toFixed(3)} ·{" "}
        {chunk.citationUsed ? "Cited" : "Not cited"}
      </p>
      <blockquote>{`Retrieved chunk ${index + 1}`}</blockquote>
    </>
  );
}

function getItemKey(item: unknown, index: number) {
  if (typeof item === "object" && item !== null) {
    const maybeId =
      "chunkId" in item
        ? item.chunkId
        : "id" in item
          ? item.id
          : undefined;

    if (typeof maybeId === "string") {
      return maybeId;
    }
  }

  return String(index);
}

async function findMatchingQueryLog(response: ChatResponse) {
  try {
    const logs = await listQueryLogs({ limit: 10 });

    return (
      logs.find(
        (log) =>
          log.question === response.question && log.answer === response.answer,
      ) ?? null
    );
  } catch {
    return null;
  }
}

"use client";

import { FormEvent, ReactNode, useState } from "react";
import {
  sendChatMessage,
  type ChatResponse,
  type ChatRetrievedChunk,
} from "@/lib/api-client";

const DEFAULT_LIMIT = 5;

export default function ChatPage() {
  const [question, setQuestion] = useState("");
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [response, setResponse] = useState<ChatResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedQuestion = question.trim();

    if (!trimmedQuestion) {
      setError("Enter a support question before sending.");
      setResponse(null);
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
    } catch (caughtError) {
      setResponse(null);
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "The chat request failed. Check that the API is running locally.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  const isRefusal =
    response?.status === "refused" || response?.refusal === true;
  const retrievedChunks = response?.retrievedChunks ?? [];

  return (
    <div className="chat-page">
      <section className="intro">
        <p className="eyebrow">Grounded chat</p>
        <h1>Chat</h1>
        <p className="lede">
          Ask a support question and inspect the answer, citations, and
          retrieval details returned by the API.
        </p>
      </section>

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
          <button disabled={isLoading} type="submit">
            {isLoading ? "Sending..." : "Send"}
          </button>
        </div>
      </form>

      {error ? <p className="error-message">{error}</p> : null}

      {response ? (
        <section className="chat-result" aria-label="Chat response">
          <div className="result-header">
            <div>
              <p className="eyebrow">Response</p>
              <h2>{isRefusal ? "Refused" : "Answered"}</h2>
            </div>
            <span
              className={
                isRefusal
                  ? "status-pill status-pill-warning"
                  : "status-pill status-pill-ok"
              }
            >
              {isRefusal ? "refusal" : "grounded"}
            </span>
          </div>

          <div className="answer-panel">
            <p>{response.answer}</p>
          </div>

          <dl className="response-metadata">
            <div>
              <dt>Confidence</dt>
              <dd>{formatConfidence(response.confidence)}</dd>
            </div>
            <div>
              <dt>Retrieved chunks</dt>
              <dd>{response.retrievedChunkCount}</dd>
            </div>
          </dl>

          <ResultList
            emptyText="No retrieved chunk details were returned with this response."
            items={retrievedChunks}
            renderItem={(chunk, index) => (
              <RetrievedChunkItem chunk={chunk} index={index} />
            )}
            title="Retrieved Chunks"
          />

          <ResultList
            emptyText="No citations were returned."
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
        </section>
      ) : null}
    </div>
  );
}

function ResultList<T>({
  emptyText,
  items,
  renderItem,
  title,
}: {
  emptyText: string;
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
            <article className="result-item" key={getItemKey(item, index)}>
              {renderItem(item, index)}
            </article>
          ))}
        </div>
      ) : (
        <p className="empty-state">{emptyText}</p>
      )}
    </section>
  );
}

function RetrievedChunkItem({
  chunk,
  index,
}: {
  chunk: ChatRetrievedChunk;
  index: number;
}) {
  const score = chunk.similarity ?? chunk.score;
  const excerpt = chunk.snippet ?? chunk.content;

  return (
    <>
      <div className="item-title">
        <strong>{chunk.documentTitle}</strong>
        <span>{chunk.sourceKey}</span>
      </div>
      <p>
        Chunk {chunk.chunkIndex}
        {score === undefined ? "" : ` · Score ${score.toFixed(3)}`}
      </p>
      <blockquote>{excerpt ?? `Retrieved chunk ${index + 1}`}</blockquote>
    </>
  );
}

function formatConfidence(confidence: number | null | undefined) {
  if (confidence === null || confidence === undefined) {
    return "Not returned";
  }

  return `${Math.round(confidence * 100)}%`;
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

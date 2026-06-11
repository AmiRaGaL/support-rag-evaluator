"use client";

import { FormEvent, useState } from "react";
import {
  apiBaseUrl,
  getApiErrorMessage,
  listQueryLogs,
  sendChatMessage,
  streamChatMessage,
  type ChatStreamCompleteEvent,
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
const suggestedQuestions = [
  "Can I export billing history?",
  "How do I reset my password?",
  "Can workspace owners change billing contacts?",
  "What is your refund policy for annual plans?",
];

export default function ChatPage() {
  const [question, setQuestion] = useState("");
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [response, setResponse] = useState<ChatResponse | null>(null);
  const [streamedAnswer, setStreamedAnswer] = useState("");
  const [streamComplete, setStreamComplete] =
    useState<ChatStreamCompleteEvent | null>(null);
  const [queryLog, setQueryLog] = useState<QueryLog | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedQuestion = question.trim();

    if (!trimmedQuestion) {
      setError("empty-question");
      setResponse(null);
      setStreamedAnswer("");
      setStreamComplete(null);
      setQueryLog(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    setResponse(null);
    setStreamedAnswer("");
    setStreamComplete(null);
    setQueryLog(null);

    try {
      await sendStreamingChatMessage({
        question: trimmedQuestion,
        limit,
      });
    } catch (error) {
      await sendFallbackChatMessage(trimmedQuestion, error);
    } finally {
      setIsLoading(false);
    }
  }

  const isRefusal = response?.status === "refused";
  const retrievedChunks =
    streamComplete?.retrievedChunks ?? queryLog?.retrievedChunks ?? [];
  const confidence = streamComplete?.confidence ?? queryLog?.confidence ?? null;

  async function sendStreamingChatMessage(input: {
    question: string;
    limit: number;
  }) {
    for await (const event of streamChatMessage(input)) {
      if (event.type === "answer_delta") {
        setStreamedAnswer((current) => `${current}${event.text}`);
      }

      if (event.type === "complete") {
        setResponse(event.response);
        setStreamComplete(event);
      }

      if (event.type === "error") {
        throw new Error(event.message);
      }
    }
  }

  async function sendFallbackChatMessage(
    trimmedQuestion: string,
    streamingError?: unknown,
  ) {
    try {
      setStreamedAnswer("");
      setStreamComplete(null);
      const result = await sendChatMessage({
        question: trimmedQuestion,
        limit,
      });

      setResponse(result);
      setQueryLog(await findMatchingQueryLog(result));
    } catch (error) {
      setResponse(null);
      setQueryLog(null);
      setError(getApiErrorMessage(error ?? streamingError));
    }
  }

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

        <section className="suggested-questions" aria-label="Suggested questions">
          <p className="eyebrow">Try a demo question</p>
          <div>
            {suggestedQuestions.map((suggestion) => (
              <button
                className="suggested-question"
                key={suggestion}
                onClick={() => setQuestion(suggestion)}
                type="button"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </section>
      </Card>

      {isLoading ? (
        <LoadingState title="Retrieving support context">
          Searching embedded docs, drafting a grounded answer, and streaming
          response text as soon as it is available.
        </LoadingState>
      ) : null}

      {error ? (
        <ErrorState
          title={
            error === "empty-question" ? "Add a support question" : "Chat request did not complete"
          }
        >
          {error === "empty-question" ? (
            "Enter a question about the support docs, then send it again."
          ) : (
            <>
              {error} API base URL: <code>{apiBaseUrl}</code>.
            </>
          )}
        </ErrorState>
      ) : null}

      {isLoading && streamedAnswer ? (
        <Card className="chat-result" aria-label="Streaming chat response">
          <div className="result-header">
            <div>
              <p className="eyebrow">Streaming response</p>
              <h2>Drafting answer</h2>
            </div>
            <Badge>streaming</Badge>
          </div>
          <div className="answer-panel streaming-panel">
            <p className="answer-label">Answer</p>
            <p className="streaming-cursor">{streamedAnswer}</p>
          </div>
        </Card>
      ) : null}

      {response ? (
        <Card
          className={isRefusal ? "chat-result chat-result-refusal" : "chat-result"}
          aria-label="Chat response"
        >
          <div className="result-header">
            <div>
              <p className="eyebrow">Response</p>
              <h2>{isRefusal ? "Intentional refusal" : "Grounded answer"}</h2>
              <p>{response.question}</p>
            </div>
            <Badge tone={isRefusal ? "warning" : "success"}>
              {isRefusal ? "refusal" : "grounded"}
            </Badge>
          </div>

          <div className={isRefusal ? "answer-panel refusal-panel" : "answer-panel"}>
            <p className="answer-label">{isRefusal ? "Refusal" : "Answer"}</p>
            <p>{response.answer}</p>
          </div>

          <dl className="metric-grid chat-metrics">
            <MetricCard
              label="Confidence"
              value={formatConfidence(confidence)}
            />
            <MetricCard
              label="Status"
              value={isRefusal ? "Refused" : "Answered"}
            />
            <MetricCard label="Citations" value={response.citations.length} />
            <MetricCard
              label="Retrieved chunks"
              value={response.retrievedChunkCount}
            />
          </dl>

          {isRefusal ? (
            <EmptyState title="Unsupported request refused">
              The assistant did not find enough support-document evidence to
              answer. This is expected for out-of-scope demo questions.
            </EmptyState>
          ) : null}

          <CitationList
            citations={response.citations}
            isRefusal={isRefusal}
          />

          <RetrievedChunkList
            citedChunkIds={new Set(
              response.citations.map((citation) => citation.chunkId),
            )}
            chunks={retrievedChunks}
          />
        </Card>
      ) : null}
    </div>
  );
}

function CitationList({
  citations,
  isRefusal,
}: {
  citations: ChatResponse["citations"];
  isRefusal: boolean;
}) {
  return (
    <section className="result-list citation-list">
      <div className="section-heading">
        <h3>Citations</h3>
        <Badge>{citations.length}</Badge>
      </div>
      {citations.length > 0 ? (
        <div className="result-items">
          {citations.map((citation, index) => (
            <Card
              as="article"
              className="result-item citation-item"
              key={`${citation.chunkId}-${index}`}
            >
              <div className="item-title">
                <strong>
                  Citation {index + 1}: {citation.documentTitle}
                </strong>
                <span>{citation.sourceKey}</span>
              </div>
              <dl className="metadata-row">
                <div>
                  <dt>Source</dt>
                  <dd>{citation.sourceKey}</dd>
                </div>
                <div>
                  <dt>Chunk</dt>
                  <dd>{citation.chunkIndex}</dd>
                </div>
                <div>
                  <dt>Chunk ID</dt>
                  <dd>{citation.chunkId}</dd>
                </div>
              </dl>
              <blockquote>{citation.snippet}</blockquote>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState title="No citations returned">
          {isRefusal
            ? "Refusals intentionally do not include citations because the assistant did not have enough retrieved evidence to answer."
            : "No citations came back with this answer. Ingest sample docs and embed missing chunks if this was expected to be supported."}
        </EmptyState>
      )}
    </section>
  );
}

function RetrievedChunkList({
  chunks,
  citedChunkIds,
}: {
  chunks: QueryLogRetrievedChunk[];
  citedChunkIds: Set<string>;
}) {
  return (
    <section className="result-list retrieved-list">
      <div className="section-heading">
        <h3>Retrieved Chunks</h3>
        <Badge>{chunks.length}</Badge>
      </div>
      {chunks.length > 0 ? (
        <div className="result-items">
          {chunks.map((chunk, index) => (
            <RetrievedChunkItem
              chunk={chunk}
              index={index}
              isCited={chunk.citationUsed || citedChunkIds.has(chunk.chunkId)}
              key={chunk.chunkId}
            />
          ))}
        </div>
      ) : (
        <EmptyState title="No retrieved chunks to inspect">
          This response was saved before matching query-log details were
          available, or retrieval returned no chunks. Ingest sample docs and run
          the embed-missing step if this keeps happening.
        </EmptyState>
      )}
    </section>
  );
}

function RetrievedChunkItem({
  chunk,
  index,
  isCited,
}: {
  chunk: QueryLogRetrievedChunk;
  index: number;
  isCited: boolean;
}) {
  return (
    <Card
      as="article"
      className={isCited ? "result-item chunk-item chunk-item-cited" : "result-item chunk-item"}
    >
      <div className="item-title">
        <strong>
          Retrieved chunk {index + 1}: {chunk.documentTitle}
        </strong>
        <Badge tone={isCited ? "success" : "default"}>
          {isCited ? "cited" : "not cited"}
        </Badge>
      </div>
      <dl className="metadata-row">
        <div>
          <dt>Source</dt>
          <dd>{chunk.sourceKey}</dd>
        </div>
        <div>
          <dt>Chunk</dt>
          <dd>{chunk.chunkIndex}</dd>
        </div>
        <div>
          <dt>Similarity</dt>
          <dd>{chunk.similarity.toFixed(3)}</dd>
        </div>
      </dl>
    </Card>
  );
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

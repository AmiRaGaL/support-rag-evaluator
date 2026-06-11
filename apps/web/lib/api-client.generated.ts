/*
 * Generated-style API client for the Support RAG Evaluator API.
 *
 * Refresh with: npm run generate:api-client
 * The generator can validate against a local OpenAPI document when the API is
 * running, but this checked-in client is dependency-free so CI stays stable.
 */

export type ChatRefusalReason =
  | "empty_question"
  | "no_retrieved_chunks"
  | "insufficient_overlap"
  | "invalid_llm_output"
  | "unsupported_by_retrieved_chunks";

export interface HealthResponse {
  status: string;
  service: string;
  database: string;
  timestamp: string;
}

export interface IngestedDocumentSummary {
  id: string;
  title: string;
  sourceKey: string;
  chunkCount: number;
}

export interface IngestionResponse {
  documentsProcessed: number;
  chunksCreated: number;
  documents: IngestedDocumentSummary[];
}

export interface EmbedMissingChunksResponse {
  embeddedCount: number;
}

export interface ChatRequest {
  question: string;
  limit?: number;
}

export interface ChatCitation {
  chunkId: string;
  documentId: string;
  documentTitle: string;
  sourceKey: string;
  chunkIndex: number;
  snippet: string;
}

export interface ChatAnswerResponse {
  status: "answered";
  question: string;
  answer: string;
  citations: ChatCitation[];
  retrievedChunkCount: number;
}

export interface ChatRefusalResponse {
  status: "refused";
  question: string;
  answer: string;
  citations: [];
  refusalReason: ChatRefusalReason;
  retrievedChunkCount: number;
}

export type ChatResponse = ChatAnswerResponse | ChatRefusalResponse;

export interface QueryLogRetrievedChunk {
  chunkId: string;
  documentId: string;
  documentTitle: string;
  sourceKey: string;
  chunkIndex: number;
  similarity: number;
  citationUsed: boolean;
}

export interface QueryLog {
  id: string;
  question: string;
  answer: string;
  refusal: boolean;
  confidence: number | null;
  provider: string;
  retrievedChunkCount: number;
  latencyMs: number;
  createdAt: string;
  retrievedChunks: QueryLogRetrievedChunk[];
}

export interface EvalMetrics {
  totalCases: number;
  refusalAccuracy: number;
  citationAccuracy: number;
  answerMatchAccuracy: number;
  overallAccuracy: number;
}

export interface EvalScore {
  refusalCorrect: boolean;
  citationCorrect: boolean;
  answerMatch: boolean;
}

export type EvalCaseType = "supported" | "unsupported";

export interface BaselineEvalCaseResult {
  id: string;
  question: string;
  type: EvalCaseType;
  expectedAnswer: string;
  expectedSources: string[];
  response: ChatResponse;
  actualConfidence: number;
  score: EvalScore;
}

export interface BaselineEvalRun {
  evalRunId: string;
  dataset: string;
  metrics: EvalMetrics;
  results: BaselineEvalCaseResult[];
}

export interface PersistedEvalCaseResult {
  caseId: string;
  question: string;
  type: EvalCaseType;
  passed: boolean;
  expectedAnswer: string;
  expectedSources: string[];
  actualAnswer: string;
  actualRefusal: boolean;
  actualConfidence: number | null;
  actualCitations: unknown;
  refusalCorrect: boolean;
  citationCorrect: boolean;
  answerMatch: boolean;
}

export interface EvalRun {
  id: string;
  name: string;
  datasetPath: string;
  totalCases: number;
  passedCases: number;
  failedCases: number;
  refusalAccuracy: number;
  citationAccuracy: number;
  answerMatchAccuracy: number;
  provider: string;
  createdAt: string;
  results: PersistedEvalCaseResult[];
}

export interface ChatStreamCompleteEvent {
  type: "complete";
  response: ChatResponse;
  confidence: number;
  retrievedChunks: QueryLogRetrievedChunk[];
}

export type ChatStreamEvent =
  | {
      type: "answer_delta";
      text: string;
    }
  | ChatStreamCompleteEvent
  | {
      type: "error";
      message: string;
    };

export type ApiOperation =
  | "getHealth"
  | "sendChatMessage"
  | "streamChatMessage"
  | "ingestSampleDocs"
  | "embedMissingChunks"
  | "listQueryLogs"
  | "getQueryLog"
  | "runBaselineEval"
  | "listEvalRuns"
  | "getEvalRun";

interface RequestOptions {
  method?: "GET" | "POST";
  body?: unknown;
}

export interface GeneratedApiClientOptions {
  resolveUrl: (path: string) => string;
  fetchImpl?: typeof fetch;
}

export class ApiClientError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly statusText: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

export class GeneratedApiClient {
  private readonly fetchImpl: typeof fetch;

  constructor(private readonly options: GeneratedApiClientOptions) {
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  getHealth() {
    return this.request<HealthResponse>("/health");
  }

  sendChatMessage(input: ChatRequest) {
    return this.request<ChatResponse>("/chat", {
      method: "POST",
      body: input,
    });
  }

  streamChatMessage(input: ChatRequest) {
    return this.stream<ChatStreamEvent>("/chat/stream", {
      method: "POST",
      body: input,
    });
  }

  ingestSampleDocs() {
    return this.request<IngestionResponse>("/ingestion/sample-docs", {
      method: "POST",
    });
  }

  embedMissingChunks() {
    return this.request<EmbedMissingChunksResponse>(
      "/retrieval/embed-missing",
      {
        method: "POST",
      },
    );
  }

  listQueryLogs(options?: { limit?: number }) {
    return this.request<QueryLog[]>(withLimit("/query-logs", options?.limit));
  }

  getQueryLog(id: string) {
    return this.request<QueryLog>(`/query-logs/${encodeURIComponent(id)}`);
  }

  runBaselineEval() {
    return this.request<BaselineEvalRun>("/evals/run-baseline", {
      method: "POST",
    });
  }

  listEvalRuns(options?: { limit?: number }) {
    return this.request<EvalRun[]>(withLimit("/evals/runs", options?.limit));
  }

  getEvalRun(id: string) {
    return this.request<EvalRun>(`/evals/runs/${encodeURIComponent(id)}`);
  }

  private async request<T>(
    path: string,
    options: RequestOptions = {},
  ): Promise<T> {
    const response = await this.fetchImpl(this.options.resolveUrl(path), {
      method: options.method ?? "GET",
      cache: "no-store",
      headers:
        options.body === undefined
          ? undefined
          : {
              "Content-Type": "application/json",
            },
      body:
        options.body === undefined ? undefined : JSON.stringify(options.body),
    });

    if (!response.ok) {
      throw await toApiClientError(response);
    }

    return (await response.json()) as T;
  }

  private async *stream<T>(
    path: string,
    options: RequestOptions,
  ): AsyncGenerator<T> {
    const response = await this.fetchImpl(this.options.resolveUrl(path), {
      method: options.method ?? "GET",
      cache: "no-store",
      headers:
        options.body === undefined
          ? undefined
          : {
              "Content-Type": "application/json",
            },
      body:
        options.body === undefined ? undefined : JSON.stringify(options.body),
    });

    if (!response.ok) {
      throw await toApiClientError(response);
    }

    if (!response.body) {
      throw new ApiClientError("API stream did not include a body.", 0, "");
    }

    yield* parseServerSentEvents<T>(response.body);
  }
}

async function* parseServerSentEvents<T>(
  body: ReadableStream<Uint8Array>,
): AsyncGenerator<T> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";

    for (const part of parts) {
      const data = part
        .split("\n")
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice("data:".length).trimStart())
        .join("\n");

      if (data) {
        yield JSON.parse(data) as T;
      }
    }
  }

  buffer += decoder.decode();

  if (buffer.trim()) {
    const data = buffer
      .split("\n")
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice("data:".length).trimStart())
      .join("\n");

    if (data) {
      yield JSON.parse(data) as T;
    }
  }
}

function withLimit(path: string, limit?: number) {
  if (limit === undefined) {
    return path;
  }

  const params = new URLSearchParams({ limit: String(limit) });

  return `${path}?${params.toString()}`;
}

async function toApiClientError(response: Response) {
  const body = await readResponseBody(response);
  const message = extractErrorMessage(body);
  const fallback = `${response.status} ${response.statusText}`.trim();

  return new ApiClientError(
    message
      ? `API request failed: ${message}`
      : `API request failed: ${fallback}`,
    response.status,
    response.statusText,
    body,
  );
}

async function readResponseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();

  return text.length > 0 ? text : undefined;
}

function extractErrorMessage(body: unknown): string | undefined {
  if (typeof body === "string") {
    return body;
  }

  if (!isRecord(body)) {
    return undefined;
  }

  const message = body.message;

  if (Array.isArray(message)) {
    return message.filter((item) => typeof item === "string").join("; ");
  }

  if (typeof message === "string") {
    return message;
  }

  if (typeof body.error === "string") {
    return body.error;
  }

  return undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

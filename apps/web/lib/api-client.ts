const DEFAULT_API_BASE_URL = "http://localhost:3001";

export const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ??
  DEFAULT_API_BASE_URL;

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

export interface ChatRetrievedChunk {
  id?: string;
  chunkId?: string;
  documentId: string;
  documentTitle: string;
  sourceKey: string;
  chunkIndex: number;
  content?: string;
  snippet?: string;
  score?: number;
  similarity?: number;
}

interface ChatResponseMetadata {
  question: string;
  answer: string;
  citations: ChatCitation[];
  confidence?: number | null;
  refusal?: boolean;
  retrievedChunks?: ChatRetrievedChunk[];
  retrievedChunkCount: number;
}

export interface ChatAnswerResponse extends ChatResponseMetadata {
  status: "answered";
}

export interface ChatRefusalResponse {
  status: "refused";
  question: string;
  answer: string;
  citations: [];
  confidence?: number | null;
  refusal?: boolean;
  retrievedChunks?: ChatRetrievedChunk[];
  retrievedChunkCount: number;
  refusalReason: ChatRefusalReason;
}

export interface LegacyChatRefusalResponse extends ChatResponseMetadata {
  status: "refused";
  refusalReason: ChatRefusalReason;
}

export type ChatResponse =
  | ChatAnswerResponse
  | ChatRefusalResponse
  | LegacyChatRefusalResponse;

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

export interface ListOptions {
  limit?: number;
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

export function getHealth() {
  return request<HealthResponse>("/health");
}

export function sendChatMessage(input: ChatRequest) {
  return request<ChatResponse>("/chat", {
    method: "POST",
    body: input,
  });
}

export function listQueryLogs(options?: ListOptions) {
  return request<QueryLog[]>(withLimit("/query-logs", options?.limit));
}

export function getQueryLog(id: string) {
  return request<QueryLog>(`/query-logs/${encodeURIComponent(id)}`);
}

export function runBaselineEval() {
  return request<BaselineEvalRun>("/evals/run-baseline", {
    method: "POST",
  });
}

export function listEvalRuns(options?: ListOptions) {
  return request<EvalRun[]>(withLimit("/evals/runs", options?.limit));
}

export function getEvalRun(id: string) {
  return request<EvalRun>(`/evals/runs/${encodeURIComponent(id)}`);
}

interface RequestOptions {
  method?: "GET" | "POST";
  body?: unknown;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetch(buildApiUrl(path), {
    method: options.method ?? "GET",
    cache: "no-store",
    headers:
      options.body === undefined
        ? undefined
        : {
            "Content-Type": "application/json",
          },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  if (!response.ok) {
    throw await toApiClientError(response);
  }

  return (await response.json()) as T;
}

function buildApiUrl(path: string) {
  return `${apiBaseUrl}${path.startsWith("/") ? path : `/${path}`}`;
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
    message ? `API request failed: ${message}` : `API request failed: ${fallback}`,
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

import {
  ApiClientError,
  GeneratedApiClient,
} from "@/lib/api-client.generated";
import type * as ApiSchemas from "@/lib/api-client.generated";

const DEFAULT_API_BASE_URL = "http://localhost:3001";

export const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ??
  DEFAULT_API_BASE_URL;

const generatedClient = new GeneratedApiClient({
  resolveUrl: buildApiUrl,
  authToken: process.env.NEXT_PUBLIC_API_AUTH_TOKEN?.trim() || undefined,
});

export { ApiClientError };

export type ChatRefusalReason = ApiSchemas.ChatRefusalReason;
export type HealthResponse = ApiSchemas.HealthResponse;
export type IngestedDocumentSummary = ApiSchemas.IngestedDocumentSummary;
export type IngestionResponse = ApiSchemas.IngestionResponse;
export type EmbedMissingChunksResponse = ApiSchemas.EmbedMissingChunksResponse;
export type ChatRequest = ApiSchemas.ChatRequest;
export type ChatCitation = ApiSchemas.ChatCitation;
export type ChatAnswerResponse = ApiSchemas.ChatAnswerResponse;
export type ChatRefusalResponse = ApiSchemas.ChatRefusalResponse;
export type ChatResponse = ApiSchemas.ChatResponse;
export type QueryLogRetrievedChunk = ApiSchemas.QueryLogRetrievedChunk;
export type QueryLog = ApiSchemas.QueryLog;
export type EvalMetrics = ApiSchemas.EvalMetrics;
export type EvalScore = ApiSchemas.EvalScore;
export type EvalJudgeResult = ApiSchemas.EvalJudgeResult;
export type EvalCaseType = ApiSchemas.EvalCaseType;
export type BaselineEvalCaseResult = ApiSchemas.BaselineEvalCaseResult;
export type BaselineEvalRun = ApiSchemas.BaselineEvalRun;
export type PersistedEvalCaseResult = ApiSchemas.PersistedEvalCaseResult;
export type EvalRun = ApiSchemas.EvalRun;
export type ChatStreamEvent = ApiSchemas.ChatStreamEvent;
export type ChatStreamCompleteEvent = ApiSchemas.ChatStreamCompleteEvent;

export interface ListOptions {
  limit?: number;
}

export function getServerApiBaseUrl() {
  return process.env.API_BASE_URL?.replace(/\/$/, "") ?? apiBaseUrl;
}

export function getHealth() {
  return generatedClient.getHealth();
}

export function sendChatMessage(input: ChatRequest) {
  return generatedClient.sendChatMessage(input);
}

export function streamChatMessage(input: ChatRequest) {
  return generatedClient.streamChatMessage(input);
}

export function ingestSampleDocs() {
  return generatedClient.ingestSampleDocs();
}

export function embedMissingChunks() {
  return generatedClient.embedMissingChunks();
}

export function listQueryLogs(options?: ListOptions) {
  return generatedClient.listQueryLogs(options);
}

export function getQueryLog(id: string) {
  return generatedClient.getQueryLog(id);
}

export function runBaselineEval() {
  return generatedClient.runBaselineEval();
}

export function listEvalRuns(options?: ListOptions) {
  return generatedClient.listEvalRuns(options);
}

export function getEvalRun(id: string) {
  return generatedClient.getEvalRun(id);
}

export function getApiErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError && error.status === 401) {
    return "The API rejected the request because authentication is enabled. Configure API_AUTH_TOKEN on the dashboard proxy, or NEXT_PUBLIC_API_AUTH_TOKEN for local demo mode.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "The API request did not complete.";
}

function buildApiUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (typeof window !== "undefined") {
    return `/api/backend${normalizedPath}`;
  }

  return `${getServerApiBaseUrl()}${normalizedPath}`;
}

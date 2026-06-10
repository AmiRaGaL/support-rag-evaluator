import type { SearchChunksResult } from '../retrieval/retrieval.service';

export type RetrievedChunk = SearchChunksResult['chunks'][number];

export type ChatRefusalReason =
  | 'empty_question'
  | 'no_retrieved_chunks'
  | 'insufficient_overlap';

export interface ChatCitation {
  chunkId: string;
  documentId: string;
  documentTitle: string;
  sourceKey: string;
  chunkIndex: number;
  snippet: string;
}

export interface ChatRequest {
  question: string;
  limit?: number;
}

export interface ChatAnswerResponse {
  status: 'answered';
  question: string;
  answer: string;
  citations: ChatCitation[];
  retrievedChunkCount: number;
}

export interface ChatRefusalResponse {
  status: 'refused';
  question: string;
  answer: string;
  citations: [];
  refusalReason: ChatRefusalReason;
  retrievedChunkCount: number;
}

export type ChatResponse = ChatAnswerResponse | ChatRefusalResponse;

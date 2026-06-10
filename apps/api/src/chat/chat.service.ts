import { Injectable, Logger } from '@nestjs/common';
import { LlmService } from '../llm/llm.service';
import { QueryLogsService } from '../query-logs/query-logs.service';
import { RetrievalService } from '../retrieval/retrieval.service';
import type { ChatRequest, ChatResponse } from './chat.types';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly retrievalService: RetrievalService,
    private readonly llmService: LlmService,
    private readonly queryLogsService: QueryLogsService,
  ) {}

  async answerQuestion(input: ChatRequest): Promise<ChatResponse> {
    const startedAt = Date.now();
    const question = input.question.trim();

    if (!question) {
      const result = await this.llmService.generateGroundedAnswerWithMetadata({
        question,
        chunks: [],
      });

      await this.logQuery({
        question,
        response: result.response,
        confidence: result.confidence,
        retrievedChunks: [],
        latencyMs: Date.now() - startedAt,
      });

      return result.response;
    }

    const retrievalResult = await this.retrievalService.searchChunks({
      query: question,
      limit: input.limit,
    });

    const result = await this.llmService.generateGroundedAnswerWithMetadata({
      question,
      chunks: retrievalResult.chunks,
    });

    await this.logQuery({
      question,
      response: result.response,
      confidence: result.confidence,
      retrievedChunks: retrievalResult.chunks,
      latencyMs: Date.now() - startedAt,
    });

    return result.response;
  }

  private async logQuery(input: {
    question: string;
    response: ChatResponse;
    confidence: number;
    retrievedChunks: Array<{
      id: string;
      documentId: string;
      documentTitle: string;
      sourceKey: string;
      chunkIndex: number;
      score: number;
    }>;
    latencyMs: number;
  }): Promise<void> {
    const citationChunkIds =
      input.response.status === 'answered'
        ? new Set(input.response.citations.map((citation) => citation.chunkId))
        : new Set<string>();

    try {
      await this.queryLogsService.createRagQueryLog({
        question: input.question,
        answer: input.response.answer,
        refusal: input.response.status === 'refused',
        confidence: input.confidence,
        provider: this.llmService.getProviderName(),
        retrievedChunkCount: input.response.retrievedChunkCount,
        latencyMs: input.latencyMs,
        retrievedChunks: input.retrievedChunks.map((chunk) => ({
          chunkId: chunk.id,
          documentId: chunk.documentId,
          documentTitle: chunk.documentTitle,
          sourceKey: chunk.sourceKey,
          chunkIndex: chunk.chunkIndex,
          similarity: chunk.score,
          citationUsed: citationChunkIds.has(chunk.id),
        })),
      });
    } catch (error) {
      this.logger.error(
        'Failed to persist RAG query log.',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}

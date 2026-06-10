import { Injectable } from '@nestjs/common';
import { LlmService } from '../llm/llm.service';
import { RetrievalService } from '../retrieval/retrieval.service';
import type { ChatRequest, ChatResponse } from './chat.types';

@Injectable()
export class ChatService {
  constructor(
    private readonly retrievalService: RetrievalService,
    private readonly llmService: LlmService,
  ) {}

  async answerQuestion(input: ChatRequest): Promise<ChatResponse> {
    const question = input.question.trim();

    if (!question) {
      return this.llmService.generateGroundedAnswer({
        question,
        chunks: [],
      });
    }

    const retrievalResult = await this.retrievalService.searchChunks({
      query: question,
      limit: input.limit,
    });

    return this.llmService.generateGroundedAnswer({
      question,
      chunks: retrievalResult.chunks,
    });
  }
}

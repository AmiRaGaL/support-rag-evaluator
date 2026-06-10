import { Injectable } from '@nestjs/common';
import { RetrievalService } from '../retrieval/retrieval.service';
import { GroundedAnswerService } from './grounded-answer.service';
import type { ChatRequest, ChatResponse } from './chat.types';

@Injectable()
export class ChatService {
  constructor(
    private readonly retrievalService: RetrievalService,
    private readonly groundedAnswerService: GroundedAnswerService,
  ) {}

  async answerQuestion(input: ChatRequest): Promise<ChatResponse> {
    const question = input.question.trim();

    if (!question) {
      return this.groundedAnswerService.buildAnswer(question, []);
    }

    const retrievalResult = await this.retrievalService.searchChunks({
      query: question,
      limit: input.limit,
    });

    return this.groundedAnswerService.buildAnswer(
      question,
      retrievalResult.chunks,
    );
  }
}

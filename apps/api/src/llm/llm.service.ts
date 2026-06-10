import { Inject, Injectable } from '@nestjs/common';
import type { ChatResponse } from '../chat/chat.types';
import type { GenerateGroundedAnswerInput, LlmProvider } from './llm.types';

export const LLM_PROVIDER = Symbol('LLM_PROVIDER');

@Injectable()
export class LlmService {
  constructor(@Inject(LLM_PROVIDER) private readonly provider: LlmProvider) {}

  async generateGroundedAnswer(
    input: GenerateGroundedAnswerInput,
  ): Promise<ChatResponse> {
    const normalizedQuestion = input.question.trim();
    const answer = await this.provider.generateGroundedAnswer({
      question: normalizedQuestion,
      chunks: input.chunks,
    });

    if (answer.refusal) {
      return {
        status: 'refused',
        question: normalizedQuestion,
        answer: answer.answer,
        citations: [],
        refusal: true,
        confidence: answer.confidence,
        retrievedChunks: input.chunks,
        refusalReason:
          answer.refusalReason ?? 'unsupported_by_retrieved_chunks',
        retrievedChunkCount: input.chunks.length,
      };
    }

    return {
      status: 'answered',
      question: normalizedQuestion,
      answer: answer.answer,
      citations: answer.citations,
      refusal: false,
      confidence: answer.confidence,
      retrievedChunks: input.chunks,
      retrievedChunkCount: input.chunks.length,
    };
  }
}

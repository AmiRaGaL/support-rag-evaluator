import { Inject, Injectable } from '@nestjs/common';
import type { ChatRefusalReason, ChatResponse } from '../chat/chat.types';
import type { GenerateGroundedAnswerInput, LlmProvider } from './llm.types';

export const LLM_PROVIDER = Symbol('LLM_PROVIDER');

@Injectable()
export class LlmService {
  constructor(@Inject(LLM_PROVIDER) private readonly provider: LlmProvider) {}

  async generateGroundedAnswer(
    input: GenerateGroundedAnswerInput,
  ): Promise<ChatResponse> {
    const normalizedQuestion = input.question.trim();

    if (!normalizedQuestion) {
      return this.refuse(
        normalizedQuestion,
        'empty_question',
        0,
        'Ask a support question so I can look for an answer in the documentation.',
      );
    }

    if (input.chunks.length === 0) {
      return this.refuse(
        normalizedQuestion,
        'no_retrieved_chunks',
        0,
        'I could not find support documentation that answers this question.',
      );
    }

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
      retrievedChunkCount: input.chunks.length,
    };
  }

  private refuse(
    question: string,
    refusalReason: ChatRefusalReason,
    retrievedChunkCount: number,
    answer: string,
  ): ChatResponse {
    return {
      status: 'refused',
      question,
      answer,
      citations: [],
      refusalReason,
      retrievedChunkCount,
    };
  }
}

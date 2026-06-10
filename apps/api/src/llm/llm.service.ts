import { Inject, Injectable } from '@nestjs/common';
import type { ChatRefusalReason, ChatResponse } from '../chat/chat.types';
import type { GenerateGroundedAnswerInput, LlmProvider } from './llm.types';

export const LLM_PROVIDER = Symbol('LLM_PROVIDER');

@Injectable()
export class LlmService {
  constructor(@Inject(LLM_PROVIDER) private readonly provider: LlmProvider) {}

  getProviderName(): string {
    return this.provider.providerName || this.provider.constructor.name;
  }

  async generateGroundedAnswer(
    input: GenerateGroundedAnswerInput,
  ): Promise<ChatResponse> {
    const result = await this.generateGroundedAnswerWithMetadata(input);

    return result.response;
  }

  async generateGroundedAnswerWithMetadata(
    input: GenerateGroundedAnswerInput,
  ): Promise<{ response: ChatResponse; confidence: number }> {
    const normalizedQuestion = input.question.trim();

    if (!normalizedQuestion) {
      return {
        response: this.refuse(
          normalizedQuestion,
          'empty_question',
          0,
          'Ask a support question so I can look for an answer in the documentation.',
        ),
        confidence: 0,
      };
    }

    if (input.chunks.length === 0) {
      return {
        response: this.refuse(
          normalizedQuestion,
          'no_retrieved_chunks',
          0,
          'I could not find support documentation that answers this question.',
        ),
        confidence: 0,
      };
    }

    const answer = await this.provider.generateGroundedAnswer({
      question: normalizedQuestion,
      chunks: input.chunks,
    });

    if (answer.refusal) {
      return {
        response: {
          status: 'refused',
          question: normalizedQuestion,
          answer: answer.answer,
          citations: [],
          refusalReason:
            answer.refusalReason ?? 'unsupported_by_retrieved_chunks',
          retrievedChunkCount: input.chunks.length,
        },
        confidence: answer.confidence,
      };
    }

    return {
      response: {
        status: 'answered',
        question: normalizedQuestion,
        answer: answer.answer,
        citations: answer.citations,
        retrievedChunkCount: input.chunks.length,
      },
      confidence: answer.confidence,
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

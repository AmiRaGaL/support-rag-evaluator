import { Injectable } from '@nestjs/common';
import { GroundedAnswerService } from '../chat/grounded-answer.service';
import type {
  GenerateGroundedAnswerInput,
  GroundedAnswer,
  LlmProvider,
} from './llm.types';

@Injectable()
export class DeterministicLlmProvider implements LlmProvider {
  constructor(private readonly groundedAnswerService: GroundedAnswerService) {}

  generateGroundedAnswer(
    input: GenerateGroundedAnswerInput,
  ): Promise<GroundedAnswer> {
    const response = this.groundedAnswerService.buildAnswer(
      input.question,
      input.chunks,
    );

    return Promise.resolve({
      answer: response.answer,
      citations: response.citations,
      refusal: response.status === 'refused',
      confidence: response.status === 'answered' ? 0.7 : 0,
      retrievedChunks: input.chunks,
      refusalReason:
        response.status === 'refused' ? response.refusalReason : undefined,
    });
  }
}

import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GroundedAnswerService } from '../chat/grounded-answer.service';
import { DeterministicLlmProvider } from './deterministic-llm.provider';
import { GroqLlmProvider } from './groq-llm.provider';
import { LLM_PROVIDER, LlmService } from './llm.service';
import type { LlmProvider } from './llm.types';

export function createLlmProvider(
  configService: ConfigService,
  groundedAnswerService: GroundedAnswerService,
): LlmProvider {
  const provider =
    configService.get<string>('LLM_PROVIDER')?.trim().toLowerCase() ??
    'deterministic';

  if (provider === 'groq') {
    return new GroqLlmProvider({
      apiKey: configService.getOrThrow<string>('GROQ_API_KEY'),
      model: configService.get<string>('GROQ_CHAT_MODEL'),
      baseURL: configService.get<string>('GROQ_BASE_URL'),
    });
  }

  return new DeterministicLlmProvider(groundedAnswerService);
}

@Module({
  providers: [
    GroundedAnswerService,
    LlmService,
    {
      provide: LLM_PROVIDER,
      inject: [ConfigService, GroundedAnswerService],
      useFactory: (
        configService: ConfigService,
        groundedAnswerService: GroundedAnswerService,
      ) => createLlmProvider(configService, groundedAnswerService),
    },
  ],
  exports: [LlmService],
})
export class LlmModule {}

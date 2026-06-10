import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { parseGroqGroundedAnswer, safeGroqRefusal } from './groq-output.parser';
import { buildRagPrompt } from './rag-prompt.builder';
import type {
  GenerateGroundedAnswerInput,
  GroundedAnswer,
  LlmProvider,
} from './llm.types';

const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';
const DEFAULT_GROQ_MODEL = 'llama-3.1-8b-instant';

export interface GroqLlmProviderOptions {
  apiKey: string;
  model?: string;
  baseURL?: string;
}

@Injectable()
export class GroqLlmProvider implements LlmProvider {
  readonly providerName = 'groq';

  private readonly client: OpenAI;
  private readonly model: string;

  constructor(options: GroqLlmProviderOptions) {
    const apiKey = options.apiKey.trim();

    if (!apiKey) {
      throw new Error('GROQ_API_KEY is required when LLM_PROVIDER=groq.');
    }

    this.client = new OpenAI({
      apiKey,
      baseURL: options.baseURL?.trim() || GROQ_BASE_URL,
    });
    this.model = options.model?.trim() || DEFAULT_GROQ_MODEL;
  }

  async generateGroundedAnswer(
    input: GenerateGroundedAnswerInput,
  ): Promise<GroundedAnswer> {
    if (!input.question.trim() || input.chunks.length === 0) {
      return safeGroqRefusal(input.chunks);
    }

    const prompt = buildRagPrompt(input.question, input.chunks);
    const completion = await this.createCompletion(prompt).catch(
      () => undefined,
    );

    if (!completion) {
      return safeGroqRefusal(input.chunks);
    }

    const content = completion.choices[0]?.message?.content;

    if (!content) {
      return safeGroqRefusal(input.chunks);
    }

    return parseGroqGroundedAnswer(content, input.chunks);
  }

  private async createCompletion(prompt: { system: string; user: string }) {
    return this.client.chat.completions.create({
      model: this.model,
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: prompt.system },
        { role: 'user', content: prompt.user },
      ],
    });
  }
}

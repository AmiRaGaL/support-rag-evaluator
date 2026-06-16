import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import type { EmbeddingProvider } from './embedding-provider.interface';

const DEFAULT_EMBEDDING_MODEL = 'text-embedding-3-small';

export interface OpenAiEmbeddingProviderOptions {
  apiKey: string;
  model?: string;
  dimensions?: number;
  baseURL?: string;
}

@Injectable()
export class OpenAiEmbeddingProvider implements EmbeddingProvider {
  readonly providerName = 'openai';
  readonly modelName: string;
  readonly dimensions?: number;

  private readonly client: OpenAI;

  constructor(options: OpenAiEmbeddingProviderOptions) {
    const apiKey = options.apiKey.trim();

    if (!apiKey) {
      throw new Error(
        'EMBEDDING_API_KEY is required when EMBEDDING_PROVIDER=openai.',
      );
    }

    this.client = new OpenAI({
      apiKey,
      baseURL: options.baseURL?.trim() || undefined,
    });
    this.modelName = options.model?.trim() || DEFAULT_EMBEDDING_MODEL;
    this.dimensions = options.dimensions;
  }

  async embed(text: string): Promise<number[]> {
    const response = await this.client.embeddings.create({
      model: this.modelName,
      input: text,
      dimensions: this.dimensions,
    });

    return response.data[0]?.embedding ?? [];
  }
}

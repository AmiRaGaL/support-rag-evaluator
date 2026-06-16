import { GoogleGenAI } from '@google/genai';
import { Injectable } from '@nestjs/common';
import type {
  EmbeddingInputOptions,
  EmbeddingProvider,
} from './embedding-provider.interface';

const DEFAULT_GEMINI_EMBEDDING_MODEL = 'gemini-embedding-2';

interface GeminiEmbeddingResponse {
  embeddings?: Array<{
    values?: number[];
  }>;
}

interface GeminiEmbeddingClient {
  models: {
    embedContent(input: {
      model: string;
      contents: string;
      config: {
        outputDimensionality: number;
      };
    }): Promise<GeminiEmbeddingResponse>;
  };
}

export interface GeminiEmbeddingProviderOptions {
  apiKey: string;
  model?: string;
  dimensions: number;
  client?: GeminiEmbeddingClient;
}

@Injectable()
export class GeminiEmbeddingProvider implements EmbeddingProvider {
  readonly providerName = 'gemini';
  readonly modelName: string;
  readonly dimensions: number;

  private readonly client: GeminiEmbeddingClient;

  constructor(options: GeminiEmbeddingProviderOptions) {
    const apiKey = options.apiKey.trim();

    if (!apiKey) {
      throw new Error(
        'GEMINI_API_KEY is required when EMBEDDING_PROVIDER=gemini.',
      );
    }

    this.modelName = options.model?.trim() || DEFAULT_GEMINI_EMBEDDING_MODEL;
    this.dimensions = options.dimensions;
    this.client = options.client ?? new GoogleGenAI({ apiKey });
  }

  async embed(
    text: string,
    options: EmbeddingInputOptions = {},
  ): Promise<number[]> {
    const response = await this.client.models.embedContent({
      model: this.modelName,
      contents: formatGeminiEmbeddingInput(text, options),
      config: {
        outputDimensionality: this.dimensions,
      },
    });

    return parseGeminiEmbeddingResponse(response, this.dimensions);
  }
}

export function formatGeminiEmbeddingInput(
  text: string,
  options: EmbeddingInputOptions = {},
): string {
  if (options.purpose === 'query') {
    return `task: question answering | query: ${text}`;
  }

  if (options.purpose === 'document') {
    return `title: ${options.title?.trim() || 'none'} | text: ${text}`;
  }

  return text;
}

export function parseGeminiEmbeddingResponse(
  response: GeminiEmbeddingResponse,
  dimensions: number,
): number[] {
  const values = response.embeddings?.[0]?.values;

  if (!values) {
    throw new Error('Gemini embedding response did not include values.');
  }

  if (values.length !== dimensions) {
    throw new Error(
      `Gemini embedding response returned ${values.length} dimensions; expected ${dimensions}.`,
    );
  }

  for (const value of values) {
    if (!Number.isFinite(value)) {
      throw new Error('Gemini embedding response included a non-finite value.');
    }
  }

  return values;
}

export const EMBEDDING_DIMENSIONS = 1536;

export interface EmbeddingInputOptions {
  purpose?: 'document' | 'query' | 'generic';
  title?: string;
}

export interface EmbeddingProvider {
  readonly providerName?: string;
  readonly modelName?: string;
  readonly dimensions?: number;

  embed(text: string, options?: EmbeddingInputOptions): Promise<number[]>;
}

export const EMBEDDING_PROVIDER = Symbol('EMBEDDING_PROVIDER');

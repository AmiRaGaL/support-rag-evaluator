export const EMBEDDING_DIMENSIONS = 1536;

export interface EmbeddingProvider {
  embed(text: string): Promise<number[]>;
}

export const EMBEDDING_PROVIDER = Symbol('EMBEDDING_PROVIDER');

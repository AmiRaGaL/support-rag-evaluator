import { createHash } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import {
  EMBEDDING_DIMENSIONS,
  EmbeddingProvider,
} from './embedding-provider.interface';

@Injectable()
export class FakeEmbeddingProvider implements EmbeddingProvider {
  embed(text: string): Promise<number[]> {
    const vector = new Array<number>(EMBEDDING_DIMENSIONS).fill(0);
    const features = this.extractFeatures(text);

    for (const feature of features) {
      const digest = createHash('sha256').update(feature).digest();
      const index = digest.readUInt32BE(0) % EMBEDDING_DIMENSIONS;
      const sign = digest[4] % 2 === 0 ? 1 : -1;
      vector[index] += sign;
    }

    return Promise.resolve(this.normalize(vector));
  }

  private extractFeatures(text: string): string[] {
    const normalized = text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
    const tokens = normalized.length > 0 ? normalized.split(/\s+/) : [''];
    const features = [...tokens];

    for (const token of tokens) {
      if (token.length < 3) {
        continue;
      }

      for (let index = 0; index <= token.length - 3; index += 1) {
        features.push(token.slice(index, index + 3));
      }
    }

    return features.length > 0 ? features : [''];
  }

  private normalize(vector: number[]): number[] {
    const magnitude = Math.sqrt(
      vector.reduce((sum, value) => sum + value * value, 0),
    );

    if (magnitude === 0) {
      vector[0] = 1;
      return vector;
    }

    return vector.map((value) => value / magnitude);
  }
}

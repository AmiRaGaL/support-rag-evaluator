import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { EMBEDDING_DIMENSIONS } from '../embeddings/embedding-provider.interface';
import { EmbeddingsService } from '../embeddings/embeddings.service';
import { PrismaService } from '../prisma/prisma.service';

const DEFAULT_SEARCH_LIMIT = 5;
const MAX_SEARCH_LIMIT = 50;

interface ChunkNeedingEmbedding {
  id: string;
  content: string;
}

interface SearchChunkRow {
  id: string;
  documentId: string;
  documentTitle: string;
  sourceKey: string;
  sourcePath: string | null;
  chunkIndex: number;
  content: string;
  tokenCount: number | null;
  metadata: unknown;
  distance: number;
}

export interface SearchChunksInput {
  query: string;
  limit?: number;
}

export interface SearchChunksResult {
  query: string;
  limit: number;
  chunks: Array<SearchChunkRow & { score: number }>;
}

@Injectable()
export class RetrievalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly embeddingsService: EmbeddingsService,
  ) {}

  async embedMissingChunks() {
    const rows = await this.prisma.$queryRaw<unknown[]>`
      SELECT "id", "content"
      FROM "DocumentChunk"
      WHERE "embedding" IS NULL
      ORDER BY "createdAt" ASC, "id" ASC
    `;
    const chunks = this.parseChunkRows(rows);

    for (const chunk of chunks) {
      const embedding = await this.embeddingsService.embed(chunk.content);
      await this.prisma.$executeRaw`
        UPDATE "DocumentChunk"
        SET "embedding" = ${this.toVectorLiteral(embedding)}::vector
        WHERE "id" = ${chunk.id}
      `;
    }

    return {
      embeddedCount: chunks.length,
    };
  }

  async searchChunks(input: SearchChunksInput): Promise<SearchChunksResult> {
    const query = input.query.trim();

    if (!query) {
      return {
        query,
        limit: this.normalizeLimit(input.limit),
        chunks: [],
      };
    }

    const limit = this.normalizeLimit(input.limit);
    const queryEmbedding = await this.embeddingsService.embed(query);
    const queryVector = this.toVectorLiteral(queryEmbedding);

    const rows = await this.prisma.$queryRaw<unknown[]>`
      WITH scored_chunks AS (
        SELECT
          c."id",
          c."documentId",
          d."title" AS "documentTitle",
          d."sourceKey",
          d."sourcePath",
          c."chunkIndex",
          c."content",
          c."tokenCount",
          c."metadata",
          ((c."embedding" <=> ${queryVector}::vector)::text)::float8 AS "distance"
        FROM "DocumentChunk" c
        INNER JOIN "Document" d ON d."id" = c."documentId"
        WHERE c."embedding" IS NOT NULL
      )
      SELECT *
      FROM scored_chunks
      ORDER BY "distance" ASC
      LIMIT ${limit}
    `;
    const chunks = this.parseSearchRows(rows);

    return {
      query,
      limit,
      chunks: chunks.map((chunk) => ({
        ...chunk,
        score: 1 - Number(chunk.distance),
        distance: Number(chunk.distance),
      })),
    };
  }

  private normalizeLimit(limit: number | undefined): number {
    if (limit === undefined || !Number.isFinite(limit)) {
      return DEFAULT_SEARCH_LIMIT;
    }

    return Math.min(Math.max(Math.trunc(limit), 1), MAX_SEARCH_LIMIT);
  }

  private toVectorLiteral(embedding: number[]): string {
    if (embedding.length !== EMBEDDING_DIMENSIONS) {
      throw new InternalServerErrorException(
        `Embedding must have ${EMBEDDING_DIMENSIONS} dimensions.`,
      );
    }

    const values = embedding.map((value) => {
      if (!Number.isFinite(value)) {
        throw new InternalServerErrorException(
          'Embedding values must be finite numbers.',
        );
      }

      return String(value);
    });

    return `[${values.join(',')}]`;
  }

  private parseChunkRows(rows: unknown[]): ChunkNeedingEmbedding[] {
    return rows.map((row) => {
      if (!this.isRecord(row)) {
        throw this.unexpectedRowShapeError();
      }

      const id = row.id;
      const content = row.content;

      if (typeof id !== 'string' || typeof content !== 'string') {
        throw this.unexpectedRowShapeError();
      }

      return {
        id,
        content,
      };
    });
  }

  private parseSearchRows(rows: unknown[]): SearchChunkRow[] {
    return rows.map((row) => {
      if (!this.isRecord(row)) {
        throw this.unexpectedRowShapeError();
      }

      const distance = this.parseFiniteNumber(row.distance);
      const chunkIndex = row.chunkIndex;

      if (
        typeof row.id !== 'string' ||
        typeof row.documentId !== 'string' ||
        typeof row.documentTitle !== 'string' ||
        typeof row.sourceKey !== 'string' ||
        !this.isNullableString(row.sourcePath) ||
        typeof chunkIndex !== 'number' ||
        !Number.isInteger(chunkIndex) ||
        typeof row.content !== 'string' ||
        !this.isNullableNumber(row.tokenCount) ||
        distance === undefined
      ) {
        throw this.unexpectedRowShapeError();
      }

      return {
        id: row.id,
        documentId: row.documentId,
        documentTitle: row.documentTitle,
        sourceKey: row.sourceKey,
        sourcePath: row.sourcePath,
        chunkIndex,
        content: row.content,
        tokenCount: row.tokenCount,
        metadata: row.metadata,
        distance,
      };
    });
  }

  private parseFiniteNumber(value: unknown): number | undefined {
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : undefined;
    }

    if (typeof value === 'string') {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : undefined;
    }

    return undefined;
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }

  private isNullableString(value: unknown): value is string | null {
    return value === null || typeof value === 'string';
  }

  private isNullableNumber(value: unknown): value is number | null {
    return (
      value === null || (typeof value === 'number' && Number.isFinite(value))
    );
  }

  private unexpectedRowShapeError() {
    return new InternalServerErrorException('Unexpected retrieval row shape.');
  }
}

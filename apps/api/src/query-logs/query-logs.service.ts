import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface RagQueryLogChunkInput {
  chunkId: string;
  documentId: string;
  documentTitle: string;
  sourceKey: string;
  chunkIndex: number;
  similarity: number;
  citationUsed: boolean;
}

export interface CreateRagQueryLogInput {
  question: string;
  answer: string;
  refusal: boolean;
  confidence: number | null;
  provider: string;
  retrievedChunkCount: number;
  latencyMs: number;
  retrievedChunks: RagQueryLogChunkInput[];
}

export type QueryLogWithRetrievedChunks = Prisma.RagQueryGetPayload<{
  include: {
    retrievedChunks: {
      orderBy: {
        createdAt: 'asc';
      };
    };
  };
}>;

@Injectable()
export class QueryLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async createRagQueryLog(input: CreateRagQueryLogInput) {
    return this.prisma.ragQuery.create({
      data: {
        question: input.question,
        answer: input.answer,
        refusal: input.refusal,
        confidence: input.confidence,
        provider: input.provider,
        retrievedChunkCount: input.retrievedChunkCount,
        latencyMs: input.latencyMs,
        retrievedChunks: {
          create: input.retrievedChunks.map((chunk) => ({
            chunkId: chunk.chunkId,
            documentId: chunk.documentId,
            documentTitle: chunk.documentTitle,
            sourceKey: chunk.sourceKey,
            chunkIndex: chunk.chunkIndex,
            similarity: chunk.similarity,
            citationUsed: chunk.citationUsed,
          })),
        },
      },
    });
  }

  async listRecentRagQueryLogs(
    limit: number,
  ): Promise<QueryLogWithRetrievedChunks[]> {
    return this.prisma.ragQuery.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      include: {
        retrievedChunks: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });
  }

  async findRagQueryLogById(
    id: string,
  ): Promise<QueryLogWithRetrievedChunks | null> {
    return this.prisma.ragQuery.findUnique({
      where: {
        id,
      },
      include: {
        retrievedChunks: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });
  }
}

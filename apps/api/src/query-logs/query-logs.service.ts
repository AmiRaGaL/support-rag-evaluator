import { Injectable } from '@nestjs/common';
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
}

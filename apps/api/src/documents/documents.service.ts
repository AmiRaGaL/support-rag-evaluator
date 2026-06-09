import { Injectable } from '@nestjs/common';
import { Prisma, type Document, type DocumentChunk } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface UpsertDocumentInput {
  title: string;
  sourceKey: string;
  sourceType: string;
  sourcePath?: string;
  contentHash?: string;
  chunks: Array<{
    chunkIndex: number;
    content: string;
    tokenCount?: number;
    metadata?: Record<string, unknown>;
  }>;
}

export type DocumentWithChunks = Document & {
  chunks: DocumentChunk[];
};

@Injectable()
export class DocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  async upsertDocumentWithChunks(
    input: UpsertDocumentInput,
  ): Promise<DocumentWithChunks> {
    return this.prisma.$transaction(async (tx) => {
      const document = await tx.document.upsert({
        where: {
          sourceKey: input.sourceKey,
        },
        update: {
          title: input.title,
          sourceType: input.sourceType,
          sourcePath: input.sourcePath,
          contentHash: input.contentHash,
        },
        create: {
          title: input.title,
          sourceKey: input.sourceKey,
          sourceType: input.sourceType,
          sourcePath: input.sourcePath,
          contentHash: input.contentHash,
        },
      });

      await tx.documentChunk.deleteMany({
        where: {
          documentId: document.id,
        },
      });

      if (input.chunks.length > 0) {
        await tx.documentChunk.createMany({
          data: input.chunks.map((chunk) => ({
            documentId: document.id,
            chunkIndex: chunk.chunkIndex,
            content: chunk.content,
            tokenCount: chunk.tokenCount,
            metadata: chunk.metadata as Prisma.InputJsonValue,
          })),
        });
      }

      return tx.document.findUniqueOrThrow({
        where: {
          id: document.id,
        },
        include: {
          chunks: {
            orderBy: {
              chunkIndex: 'asc',
            },
          },
        },
      });
    });
  }

  async listDocuments() {
    return this.prisma.document.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        _count: {
          select: {
            chunks: true,
          },
        },
      },
    });
  }
}

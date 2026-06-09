import { DocumentsService } from './documents.service';

describe('DocumentsService', () => {
  it('replaces chunks inside the document upsert transaction', async () => {
    const document = {
      id: 'doc_1',
      title: 'Billing',
      sourceKey: 'billing',
      sourceType: 'markdown',
      sourcePath: '/docs/billing.md',
      contentHash: 'hash',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const documentWithChunks = {
      ...document,
      chunks: [
        {
          id: 'chunk_1',
          documentId: 'doc_1',
          chunkIndex: 0,
          content: 'Billing content',
          tokenCount: 4,
          metadata: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    };
    const tx = {
      document: {
        upsert: jest.fn().mockResolvedValue(document),
        findUniqueOrThrow: jest.fn().mockResolvedValue(documentWithChunks),
      },
      documentChunk: {
        deleteMany: jest.fn().mockResolvedValue({ count: 2 }),
        createMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };
    const prisma = {
      $transaction: jest.fn((callback: (txClient: typeof tx) => unknown) =>
        callback(tx),
      ),
    };

    const service = new DocumentsService(prisma as never);
    const result = await service.upsertDocumentWithChunks({
      title: 'Billing',
      sourceKey: 'billing',
      sourceType: 'markdown',
      sourcePath: '/docs/billing.md',
      contentHash: 'hash',
      chunks: [
        {
          chunkIndex: 0,
          content: 'Billing content',
          tokenCount: 4,
          metadata: {
            sourceFileName: 'billing.md',
          },
        },
      ],
    });

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.document.upsert).toHaveBeenCalledWith({
      where: {
        sourceKey: 'billing',
      },
      update: {
        title: 'Billing',
        sourceType: 'markdown',
        sourcePath: '/docs/billing.md',
        contentHash: 'hash',
      },
      create: {
        title: 'Billing',
        sourceKey: 'billing',
        sourceType: 'markdown',
        sourcePath: '/docs/billing.md',
        contentHash: 'hash',
      },
    });
    expect(tx.documentChunk.deleteMany).toHaveBeenCalledWith({
      where: {
        documentId: 'doc_1',
      },
    });
    expect(tx.documentChunk.createMany).toHaveBeenCalledWith({
      data: [
        {
          documentId: 'doc_1',
          chunkIndex: 0,
          content: 'Billing content',
          tokenCount: 4,
          metadata: {
            sourceFileName: 'billing.md',
          },
        },
      ],
    });
    expect(
      tx.documentChunk.deleteMany.mock.invocationCallOrder[0],
    ).toBeLessThan(tx.documentChunk.createMany.mock.invocationCallOrder[0]);
    expect(result).toBe(documentWithChunks);
  });
});

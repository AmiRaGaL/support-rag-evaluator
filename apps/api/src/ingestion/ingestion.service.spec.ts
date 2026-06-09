import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import { tmpdir } from 'os';
import * as path from 'path';
import { DocumentsService } from '../documents/documents.service';
import { IngestionService, SAMPLE_DOCS_DIR } from './ingestion.service';

describe('IngestionService', () => {
  const temporaryDirectories: string[] = [];
  const documentsService = {
    upsertDocumentWithChunks: jest.fn(),
  } as unknown as jest.Mocked<
    Pick<DocumentsService, 'upsertDocumentWithChunks'>
  >;

  beforeEach(() => {
    documentsService.upsertDocumentWithChunks.mockReset();
  });

  afterEach(async () => {
    await Promise.all(
      temporaryDirectories.splice(0).map((directoryPath) =>
        fs.rm(directoryPath, {
          recursive: true,
          force: true,
        }),
      ),
    );
  });

  it('uses a repo-relative sample docs path', () => {
    expect(SAMPLE_DOCS_DIR).toBe(
      path.resolve(__dirname, '../../../..', 'datasets/sample-docs'),
    );
  });

  it('ingests markdown files into document upserts and summaries', async () => {
    const directoryPath = await fs.mkdtemp(
      path.join(tmpdir(), 'support-rag-ingestion-'),
    );
    temporaryDirectories.push(directoryPath);
    await fs.writeFile(
      path.join(directoryPath, 'ignored.txt'),
      'not markdown',
      'utf8',
    );
    await fs.writeFile(
      path.join(directoryPath, 'billing.md'),
      '# Billing\n\nUsers can view invoices.',
      'utf8',
    );

    documentsService.upsertDocumentWithChunks.mockResolvedValue({
      id: 'doc_1',
      title: 'Billing',
      sourceKey: 'billing',
      sourceType: 'markdown',
      sourcePath: path.join(directoryPath, 'billing.md'),
      contentHash: createHash('sha256')
        .update('# Billing\n\nUsers can view invoices.')
        .digest('hex'),
      createdAt: new Date(),
      updatedAt: new Date(),
      chunks: [
        {
          id: 'chunk_1',
          documentId: 'doc_1',
          chunkIndex: 0,
          content: '# Billing\n\nUsers can view invoices.',
          tokenCount: 9,
          metadata: { sourceFileName: 'billing.md' },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    });

    const service = new IngestionService(documentsService as DocumentsService);
    const result = await service.ingestMarkdownDirectory(directoryPath);

    expect(documentsService.upsertDocumentWithChunks).toHaveBeenCalledWith({
      title: 'Billing',
      sourceKey: 'billing',
      sourceType: 'markdown',
      sourcePath: path.join(directoryPath, 'billing.md'),
      contentHash: createHash('sha256')
        .update('# Billing\n\nUsers can view invoices.')
        .digest('hex'),
      chunks: [
        {
          chunkIndex: 0,
          content: '# Billing\n\nUsers can view invoices.',
          tokenCount: 9,
          metadata: {
            sourceFileName: 'billing.md',
          },
        },
      ],
    });
    expect(result).toEqual({
      documentsProcessed: 1,
      chunksCreated: 1,
      documents: [
        {
          id: 'doc_1',
          title: 'Billing',
          sourceKey: 'billing',
          chunkCount: 1,
        },
      ],
    });
  });
});

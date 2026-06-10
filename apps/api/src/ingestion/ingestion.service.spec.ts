import { InternalServerErrorException } from '@nestjs/common';
import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import { tmpdir } from 'os';
import * as path from 'path';
import { DocumentsService } from '../documents/documents.service';
import {
  IngestionService,
  resolveSampleDocsDirectory,
  SAMPLE_DOCS_DIR,
} from './ingestion.service';

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

  it('resolves sample docs from the built dist layout', () => {
    const repoRoot = path.resolve(__dirname, '../../../..');
    const builtIngestionDirectory = path.join(
      repoRoot,
      'apps/api/dist/src/ingestion',
    );

    expect(resolveSampleDocsDirectory(builtIngestionDirectory)).toBe(
      path.join(repoRoot, 'datasets/sample-docs'),
    );
  });

  it('points at the actual sample docs directory', async () => {
    await expect(fs.readdir(SAMPLE_DOCS_DIR)).resolves.toEqual(
      expect.arrayContaining([
        'account-management.md',
        'billing.md',
        'troubleshooting.md',
      ]),
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

  it('throws a clear error when the markdown directory cannot be read', async () => {
    const service = new IngestionService(documentsService as DocumentsService);
    const missingDirectory = path.join(
      tmpdir(),
      'support-rag-missing-sample-docs',
    );

    await expect(
      service.ingestMarkdownDirectory(missingDirectory),
    ).rejects.toThrow(InternalServerErrorException);
    await expect(
      service.ingestMarkdownDirectory(missingDirectory),
    ).rejects.toThrow(
      `Sample docs directory is missing or unreadable: ${missingDirectory} (ENOENT).`,
    );
    expect(documentsService.upsertDocumentWithChunks).not.toHaveBeenCalled();
  });

  it('throws a clear error when the markdown directory contains no docs', async () => {
    const directoryPath = await fs.mkdtemp(
      path.join(tmpdir(), 'support-rag-empty-docs-'),
    );
    temporaryDirectories.push(directoryPath);
    await fs.writeFile(path.join(directoryPath, 'ignored.txt'), '', 'utf8');
    const service = new IngestionService(documentsService as DocumentsService);

    await expect(
      service.ingestMarkdownDirectory(directoryPath),
    ).rejects.toThrow(InternalServerErrorException);
    await expect(
      service.ingestMarkdownDirectory(directoryPath),
    ).rejects.toThrow(
      `Markdown directory contains no sample documents: ${directoryPath}`,
    );
    expect(documentsService.upsertDocumentWithChunks).not.toHaveBeenCalled();
  });
});

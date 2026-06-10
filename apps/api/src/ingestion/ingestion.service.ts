import { Injectable, NotFoundException } from '@nestjs/common';
import { createHash } from 'crypto';
import { existsSync, type Dirent } from 'fs';
import { promises as fs } from 'fs';
import * as path from 'path';
import { chunkText } from '../common/utils/chunk-text';
import { DocumentsService } from '../documents/documents.service';

export interface IngestMarkdownDirectoryResult {
  documentsProcessed: number;
  chunksCreated: number;
  documents: IngestedDocumentSummary[];
}

export interface IngestedDocumentSummary {
  id: string;
  title: string;
  sourceKey: string;
  chunkCount: number;
}

export const SAMPLE_DOCS_DIR = resolveSampleDocsDirectory();

@Injectable()
export class IngestionService {
  constructor(private readonly documentsService: DocumentsService) {}

  async ingestSampleDocs(): Promise<IngestMarkdownDirectoryResult> {
    return this.ingestMarkdownDirectory(SAMPLE_DOCS_DIR);
  }

  async ingestMarkdownDirectory(
    directoryPath: string,
  ): Promise<IngestMarkdownDirectoryResult> {
    const entries = await this.readMarkdownDirectoryEntries(directoryPath);
    const markdownFiles = entries
      .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
      .map((entry) => entry.name)
      .sort();

    const documents: IngestMarkdownDirectoryResult['documents'] = [];
    let chunksCreated = 0;

    for (const fileName of markdownFiles) {
      const filePath = path.join(directoryPath, fileName);
      const content = await fs.readFile(filePath, 'utf8');
      const title = extractMarkdownTitle(content) ?? fileName;
      const sourceKey = path.basename(fileName, '.md');
      const contentHash = createHash('sha256').update(content).digest('hex');

      const chunks = chunkText(content).map((chunk) => ({
        chunkIndex: chunk.chunkIndex,
        content: chunk.content,
        tokenCount: chunk.tokenCountEstimate,
        metadata: {
          sourceFileName: fileName,
        },
      }));

      const document = await this.documentsService.upsertDocumentWithChunks({
        title,
        sourceKey,
        sourceType: 'markdown',
        sourcePath: filePath,
        contentHash,
        chunks,
      });

      documents.push({
        id: document.id,
        title: document.title,
        sourceKey: document.sourceKey,
        chunkCount: document.chunks.length,
      });

      chunksCreated += document.chunks.length;
    }

    return {
      documentsProcessed: documents.length,
      chunksCreated,
      documents,
    };
  }

  private async readMarkdownDirectoryEntries(
    directoryPath: string,
  ): Promise<Dirent[]> {
    try {
      return await fs.readdir(directoryPath, { withFileTypes: true });
    } catch (error: unknown) {
      const errorCode = isFileSystemError(error) ? ` (${error.code})` : '';

      throw new NotFoundException(
        `Markdown directory not found or cannot be read: ${directoryPath}${errorCode}`,
      );
    }
  }
}

function extractMarkdownTitle(content: string): string | null {
  const firstHeading = content
    .split('\n')
    .find((line) => line.trim().startsWith('# '));

  if (!firstHeading) {
    return null;
  }

  return firstHeading.trim().replace(/^#\s+/, '').trim();
}

export function resolveSampleDocsDirectory(
  baseDir = __dirname,
  currentWorkingDirectory = process.cwd(),
): string {
  const candidates = [
    path.resolve(baseDir, '../../../..', 'datasets/sample-docs'),
    path.resolve(baseDir, '../../../../..', 'datasets/sample-docs'),
    path.resolve(currentWorkingDirectory, 'datasets/sample-docs'),
    path.resolve(currentWorkingDirectory, '../..', 'datasets/sample-docs'),
  ];

  return candidates.find((candidate) => existsSync(candidate)) ?? candidates[0];
}

function isFileSystemError(error: unknown): error is NodeJS.ErrnoException {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof error.code === 'string'
  );
}

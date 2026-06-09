import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import * as path from 'path';
import { chunkText } from '../common/utils/chunk-text';
import { DocumentsService } from '../documents/documents.service';

export interface IngestMarkdownDirectoryResult {
  documentsProcessed: number;
  chunksCreated: number;
  documents: Array<{
    id: string;
    title: string;
    sourceKey: string;
    chunkCount: number;
  }>;
}

@Injectable()
export class IngestionService {
  constructor(private readonly documentsService: DocumentsService) {}

  async ingestSampleDocs(): Promise<IngestMarkdownDirectoryResult> {
    const docsDir = path.resolve(process.cwd(), '../../datasets/sample-docs');
    return this.ingestMarkdownDirectory(docsDir);
  }

  async ingestMarkdownDirectory(
    directoryPath: string,
  ): Promise<IngestMarkdownDirectoryResult> {
    const entries = await fs.readdir(directoryPath, { withFileTypes: true });
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
}

function extractMarkdownTitle(content: string): string | null {
  const firstHeading = content
    .split('\n')
    .find((line) => line.trim().startsWith('# '));

  if (!firstHeading) {
    return null;
  }

  return firstHeading.replace(/^#\s+/, '').trim();
}

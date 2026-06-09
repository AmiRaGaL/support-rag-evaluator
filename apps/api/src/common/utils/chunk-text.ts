export interface ChunkTextOptions {
  maxChars?: number;
  overlapChars?: number;
}

export interface TextChunk {
  chunkIndex: number;
  content: string;
  tokenCountEstimate: number;
}

const DEFAULT_MAX_CHARS = 1200;
const DEFAULT_OVERLAP_CHARS = 150;

export function chunkText(
  input: string,
  options: ChunkTextOptions = {},
): TextChunk[] {
  const maxChars = options.maxChars ?? DEFAULT_MAX_CHARS;
  const overlapChars = options.overlapChars ?? DEFAULT_OVERLAP_CHARS;

  if (maxChars <= 0) {
    throw new Error('maxChars must be greater than 0');
  }

  if (overlapChars < 0) {
    throw new Error('overlapChars cannot be negative');
  }

  if (overlapChars >= maxChars) {
    throw new Error('overlapChars must be smaller than maxChars');
  }

  const normalized = input.replace(/\r\n/g, '\n').trim();

  if (!normalized) {
    return [];
  }

  const chunks: TextChunk[] = [];
  let start = 0;
  let chunkIndex = 0;

  while (start < normalized.length) {
    const rawEnd = Math.min(start + maxChars, normalized.length);
    let end = rawEnd;

    if (rawEnd < normalized.length) {
      const lastParagraphBreak = normalized.lastIndexOf('\n\n', rawEnd);
      const lastSentenceBreak = normalized.lastIndexOf('. ', rawEnd);

      const paragraphCandidate =
        lastParagraphBreak > start + Math.floor(maxChars * 0.5)
          ? lastParagraphBreak
          : -1;

      const sentenceCandidate =
        lastSentenceBreak > start + Math.floor(maxChars * 0.5)
          ? lastSentenceBreak + 1
          : -1;

      end =
        paragraphCandidate > -1
          ? paragraphCandidate
          : sentenceCandidate > -1
            ? sentenceCandidate
            : rawEnd;
    }

    const content = normalized.slice(start, end).trim();

    if (content) {
      chunks.push({
        chunkIndex,
        content,
        tokenCountEstimate: estimateTokenCount(content),
      });
      chunkIndex += 1;
    }

    if (end >= normalized.length) {
      break;
    }

    start = Math.max(0, end - overlapChars);
  }

  return chunks;
}

export function estimateTokenCount(input: string): number {
  return Math.ceil(input.length / 4);
}

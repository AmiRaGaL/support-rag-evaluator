import { Injectable } from '@nestjs/common';
import type {
  ChatCitation,
  ChatResponse,
  ChatRefusalReason,
  RetrievedChunk,
} from './chat.types';

const MAX_CITATIONS = 3;
const SNIPPET_LENGTH = 220;
const STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'are',
  'as',
  'at',
  'be',
  'by',
  'can',
  'do',
  'does',
  'for',
  'from',
  'how',
  'i',
  'in',
  'is',
  'it',
  'me',
  'my',
  'of',
  'on',
  'or',
  'our',
  'the',
  'to',
  'what',
  'when',
  'where',
  'which',
  'who',
  'why',
  'with',
  'you',
  'your',
]);

interface ScoredChunk {
  chunk: RetrievedChunk;
  overlapCount: number;
  snippet: string;
}

@Injectable()
export class GroundedAnswerService {
  buildAnswer(question: string, chunks: RetrievedChunk[]): ChatResponse {
    const normalizedQuestion = question.trim();

    if (!normalizedQuestion) {
      return this.refuse(
        normalizedQuestion,
        'empty_question',
        chunks,
        'Ask a support question so I can look for an answer in the documentation.',
      );
    }

    if (chunks.length === 0) {
      return this.refuse(
        normalizedQuestion,
        'no_retrieved_chunks',
        [],
        'I could not find support documentation that answers this question.',
      );
    }

    const questionTerms = this.extractTerms(normalizedQuestion);
    const scoredChunks = this.scoreChunks(questionTerms, chunks);
    const supportingChunks = scoredChunks
      .filter((scoredChunk) => scoredChunk.overlapCount > 0)
      .sort((left, right) => {
        if (right.overlapCount !== left.overlapCount) {
          return right.overlapCount - left.overlapCount;
        }

        if (right.chunk.score !== left.chunk.score) {
          return right.chunk.score - left.chunk.score;
        }

        if (left.chunk.documentId !== right.chunk.documentId) {
          return left.chunk.documentId.localeCompare(right.chunk.documentId);
        }

        if (left.chunk.chunkIndex !== right.chunk.chunkIndex) {
          return left.chunk.chunkIndex - right.chunk.chunkIndex;
        }

        return left.chunk.id.localeCompare(right.chunk.id);
      });

    if (!this.hasEnoughSupport(questionTerms, supportingChunks)) {
      return this.refuse(
        normalizedQuestion,
        'insufficient_overlap',
        chunks,
        'I found related documentation, but it does not contain enough matching support details to answer this question.',
      );
    }

    const citedChunks = supportingChunks.slice(0, MAX_CITATIONS);
    const citations = citedChunks.map((scoredChunk) =>
      this.toCitation(scoredChunk),
    );

    return {
      status: 'answered',
      question: normalizedQuestion,
      answer: this.composeAnswer(citations),
      citations,
      retrievedChunkCount: chunks.length,
    };
  }

  private scoreChunks(
    questionTerms: Set<string>,
    chunks: RetrievedChunk[],
  ): ScoredChunk[] {
    return chunks.map((chunk) => {
      const contentTerms = this.extractTerms(chunk.content);
      let overlapCount = 0;

      for (const term of questionTerms) {
        if (contentTerms.has(term)) {
          overlapCount += 1;
        }
      }

      return {
        chunk,
        overlapCount,
        snippet: this.buildSnippet(chunk.content, questionTerms),
      };
    });
  }

  private hasEnoughSupport(
    questionTerms: Set<string>,
    supportingChunks: ScoredChunk[],
  ): boolean {
    if (questionTerms.size === 0 || supportingChunks.length === 0) {
      return false;
    }

    const supportedTerms = new Set<string>();

    for (const scoredChunk of supportingChunks) {
      for (const term of questionTerms) {
        if (this.extractTerms(scoredChunk.chunk.content).has(term)) {
          supportedTerms.add(term);
        }
      }
    }

    const requiredOverlap = questionTerms.size === 1 ? 1 : 2;
    const overlapRatio = supportedTerms.size / questionTerms.size;

    return supportedTerms.size >= requiredOverlap || overlapRatio >= 0.5;
  }

  private composeAnswer(citations: ChatCitation[]): string {
    const facts = citations.map(
      (citation, index) => `${index + 1}. ${citation.snippet}`,
    );

    return `According to the retrieved support documentation:\n${facts.join('\n')}`;
  }

  private toCitation(scoredChunk: ScoredChunk): ChatCitation {
    return {
      chunkId: scoredChunk.chunk.id,
      documentId: scoredChunk.chunk.documentId,
      documentTitle: scoredChunk.chunk.documentTitle,
      sourceKey: scoredChunk.chunk.sourceKey,
      chunkIndex: scoredChunk.chunk.chunkIndex,
      snippet: scoredChunk.snippet,
    };
  }

  private buildSnippet(content: string, questionTerms: Set<string>): string {
    const compactContent = content.replace(/\s+/g, ' ').trim();
    const sentences = compactContent
      .split(/(?<=[.!?])\s+/)
      .map((sentence) => sentence.trim())
      .filter(Boolean);

    const bestSentence = sentences
      .map((sentence) => ({
        sentence,
        overlapCount: this.countOverlap(questionTerms, sentence),
      }))
      .sort(
        (left, right) => right.overlapCount - left.overlapCount,
      )[0]?.sentence;

    return this.truncate(bestSentence ?? compactContent, SNIPPET_LENGTH);
  }

  private countOverlap(questionTerms: Set<string>, text: string): number {
    const textTerms = this.extractTerms(text);
    let overlapCount = 0;

    for (const term of questionTerms) {
      if (textTerms.has(term)) {
        overlapCount += 1;
      }
    }

    return overlapCount;
  }

  private extractTerms(text: string): Set<string> {
    const terms = text
      .toLowerCase()
      .match(/[a-z0-9]+/g)
      ?.map((term) => this.normalizeTerm(term))
      .filter((term) => term.length > 1 && !STOP_WORDS.has(term));

    return new Set(terms ?? []);
  }

  private normalizeTerm(term: string): string {
    if (term.length > 4 && term.endsWith('ies')) {
      return `${term.slice(0, -3)}y`;
    }

    if (term.length > 3 && term.endsWith('s')) {
      return term.slice(0, -1);
    }

    return term;
  }

  private truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
      return text;
    }

    return `${text.slice(0, maxLength - 3).trimEnd()}...`;
  }

  private refuse(
    question: string,
    refusalReason: ChatRefusalReason,
    retrievedChunks: RetrievedChunk[],
    answer: string,
  ): ChatResponse {
    return {
      status: 'refused',
      question,
      answer,
      citations: [],
      refusalReason,
      retrievedChunkCount: retrievedChunks.length,
    };
  }
}

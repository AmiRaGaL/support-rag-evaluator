import { GroundedAnswerService } from './grounded-answer.service';
import type { RetrievedChunk } from './chat.types';

function chunk(overrides: Partial<RetrievedChunk> = {}): RetrievedChunk {
  return {
    id: 'chunk_1',
    documentId: 'doc_1',
    documentTitle: 'Billing',
    sourceKey: 'billing',
    sourcePath: '/docs/billing.md',
    chunkIndex: 0,
    content:
      'Customers can update the billing email from account settings. The change applies to future invoices.',
    tokenCount: null,
    metadata: null,
    distance: 0.1,
    score: 0.9,
    ...overrides,
  };
}

describe('GroundedAnswerService', () => {
  const service = new GroundedAnswerService();

  it('creates a deterministic grounded answer with citations', () => {
    const result = service.buildAnswer('How do I update my billing email?', [
      chunk(),
    ]);

    expect(result).toEqual({
      status: 'answered',
      question: 'How do I update my billing email?',
      answer:
        'According to the retrieved support documentation:\n1. Customers can update the billing email from account settings.',
      citations: [
        {
          chunkId: 'chunk_1',
          documentId: 'doc_1',
          documentTitle: 'Billing',
          sourceKey: 'billing',
          chunkIndex: 0,
          snippet:
            'Customers can update the billing email from account settings.',
        },
      ],
      retrievedChunkCount: 1,
    });
  });

  it('refuses empty questions', () => {
    const result = service.buildAnswer('   ', []);

    expect(result).toEqual({
      status: 'refused',
      question: '',
      answer:
        'Ask a support question so I can look for an answer in the documentation.',
      citations: [],
      refusalReason: 'empty_question',
      retrievedChunkCount: 0,
    });
  });

  it('refuses when retrieval returns no chunks', () => {
    const result = service.buildAnswer('How do I update billing email?', []);

    expect(result).toEqual({
      status: 'refused',
      question: 'How do I update billing email?',
      answer:
        'I could not find support documentation that answers this question.',
      citations: [],
      refusalReason: 'no_retrieved_chunks',
      retrievedChunkCount: 0,
    });
  });

  it('refuses when retrieved chunks do not sufficiently overlap the question', () => {
    const result = service.buildAnswer('Can I export audit logs?', [
      chunk({
        content:
          'Customers can update the billing email from account settings.',
      }),
    ]);

    expect(result).toEqual({
      status: 'refused',
      question: 'Can I export audit logs?',
      answer:
        'I found related documentation, but it does not contain enough matching support details to answer this question.',
      citations: [],
      refusalReason: 'insufficient_overlap',
      retrievedChunkCount: 1,
    });
  });

  it('orders citations by term overlap before retrieval score', () => {
    const result = service.buildAnswer(
      'How do invoice billing settings work?',
      [
        chunk({
          id: 'chunk_low_overlap',
          content: 'Billing settings are available in the account area.',
          score: 0.99,
        }),
        chunk({
          id: 'chunk_high_overlap',
          content: 'Invoice billing settings control future invoice delivery.',
          score: 0.6,
        }),
      ],
    );

    expect(result.status).toBe('answered');
    if (result.status !== 'answered') {
      throw new Error('Expected an answered response.');
    }

    expect(result.citations.map((citation) => citation.chunkId)).toEqual([
      'chunk_high_overlap',
      'chunk_low_overlap',
    ]);
  });

  it('keeps citation snippets within the maximum length', () => {
    const result = service.buildAnswer('billing email settings invoice', [
      chunk({
        content: `${'Billing email settings invoice '.repeat(20)}are available from account settings.`,
      }),
    ]);

    expect(result.status).toBe('answered');
    if (result.status !== 'answered') {
      throw new Error('Expected an answered response.');
    }

    expect(result.citations[0].snippet.length).toBeLessThanOrEqual(220);
  });

  it('uses deterministic tie-breakers when overlap and score are equal', () => {
    const result = service.buildAnswer('billing email settings', [
      chunk({
        id: 'chunk_b',
        documentId: 'doc_b',
        chunkIndex: 2,
        content: 'Billing email settings are editable.',
        score: 0.8,
      }),
      chunk({
        id: 'chunk_a',
        documentId: 'doc_a',
        chunkIndex: 2,
        content: 'Billing email settings are editable.',
        score: 0.8,
      }),
      chunk({
        id: 'chunk_c',
        documentId: 'doc_a',
        chunkIndex: 1,
        content: 'Billing email settings are editable.',
        score: 0.8,
      }),
    ]);

    expect(result.status).toBe('answered');
    if (result.status !== 'answered') {
      throw new Error('Expected an answered response.');
    }

    expect(result.citations.map((citation) => citation.chunkId)).toEqual([
      'chunk_c',
      'chunk_a',
      'chunk_b',
    ]);
  });
});

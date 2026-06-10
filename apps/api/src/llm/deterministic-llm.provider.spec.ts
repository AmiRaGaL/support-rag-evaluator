import type { RetrievedChunk } from '../chat/chat.types';
import { GroundedAnswerService } from '../chat/grounded-answer.service';
import { DeterministicLlmProvider } from './deterministic-llm.provider';

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

describe('DeterministicLlmProvider', () => {
  const provider = new DeterministicLlmProvider(new GroundedAnswerService());

  it('keeps deterministic grounded answer behavior as the default provider', async () => {
    const chunks = [chunk()];

    const result = await provider.generateGroundedAnswer({
      question: 'How do I update my billing email?',
      chunks,
    });

    expect(result).toEqual({
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
      refusal: false,
      confidence: 0.7,
      retrievedChunks: chunks,
      refusalReason: undefined,
    });
  });

  it('refuses deterministically when support is insufficient', async () => {
    const chunks = [
      chunk({
        content:
          'Customers can update the billing email from account settings.',
      }),
    ];

    const result = await provider.generateGroundedAnswer({
      question: 'Can I export audit logs?',
      chunks,
    });

    expect(result).toEqual({
      answer:
        'I found related documentation, but it does not contain enough matching support details to answer this question.',
      citations: [],
      refusal: true,
      confidence: 0,
      retrievedChunks: chunks,
      refusalReason: 'insufficient_overlap',
    });
  });
});

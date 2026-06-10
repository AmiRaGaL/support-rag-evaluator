import type {
  ChatCitation,
  ChatRefusalReason,
  RetrievedChunk,
} from '../chat/chat.types';

export interface GenerateGroundedAnswerInput {
  question: string;
  chunks: RetrievedChunk[];
}

export interface GroundedAnswer {
  answer: string;
  citations: ChatCitation[];
  refusal: boolean;
  confidence: number;
  retrievedChunks: RetrievedChunk[];
  refusalReason?: ChatRefusalReason;
}

export interface LlmProvider {
  generateGroundedAnswer(
    input: GenerateGroundedAnswerInput,
  ): Promise<GroundedAnswer>;
}

export interface RagPrompt {
  system: string;
  user: string;
}

export interface GroqGroundedAnswerJson {
  answer: string;
  citationChunkIds: string[];
  refusal: boolean;
  confidence: number;
}

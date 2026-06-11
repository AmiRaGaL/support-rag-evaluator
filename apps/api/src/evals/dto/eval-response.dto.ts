import { ApiProperty } from '@nestjs/swagger';
import { ChatResponseDto } from '../../chat/dto/chat-response.dto';

export class EvalMetricsResponseDto {
  @ApiProperty({
    description: 'Total number of eval cases.',
    example: 8,
  })
  totalCases!: number;

  @ApiProperty({
    description: 'Share of cases with correct refusal behavior.',
    example: 1,
  })
  refusalAccuracy!: number;

  @ApiProperty({
    description: 'Share of cases with correct citation behavior.',
    example: 0.875,
  })
  citationAccuracy!: number;

  @ApiProperty({
    description: 'Share of cases with matching answer behavior.',
    example: 0.875,
  })
  answerMatchAccuracy!: number;

  @ApiProperty({
    description: 'Share of cases passing every scoring dimension.',
    example: 0.875,
  })
  overallAccuracy!: number;
}

export class EvalScoreResponseDto {
  @ApiProperty({
    description: 'Whether refusal behavior matched the expected outcome.',
    example: true,
  })
  refusalCorrect!: boolean;

  @ApiProperty({
    description: 'Whether citations matched the expected source behavior.',
    example: true,
  })
  citationCorrect!: boolean;

  @ApiProperty({
    description: 'Whether answer content matched the expected answer.',
    example: true,
  })
  answerMatch!: boolean;
}

export class EvalJudgeDimensionsResponseDto {
  @ApiProperty({
    description: 'Whether the answer is grounded in retrieved support context.',
    example: true,
  })
  groundedness!: boolean;

  @ApiProperty({
    description: 'Whether the answer is correct for the eval case.',
    example: true,
  })
  answerCorrectness!: boolean;

  @ApiProperty({
    description: 'Whether citations support the answer.',
    example: true,
  })
  citationSupport!: boolean;

  @ApiProperty({
    description: 'Whether refusal behavior matched the expected case type.',
    example: true,
  })
  refusalBehavior!: boolean;
}

export class EvalJudgeResultResponseDto {
  @ApiProperty({
    description: 'Judge provider used for this eval case.',
    example: 'deterministic',
  })
  provider!: string;

  @ApiProperty({
    description: 'Judge score from 0 to 1.',
    minimum: 0,
    maximum: 1,
    example: 1,
  })
  score!: number;

  @ApiProperty({
    description: 'Whether the judge marked the case as passing.',
    example: true,
  })
  passed!: boolean;

  @ApiProperty({
    description: 'Short judge rationale.',
    example: 'The answer is supported by the cited billing documentation.',
  })
  reasoning!: string;

  @ApiProperty({
    description: 'Judge dimension verdicts.',
    type: EvalJudgeDimensionsResponseDto,
  })
  dimensions!: EvalJudgeDimensionsResponseDto;
}

export class BaselineEvalCaseResultResponseDto {
  @ApiProperty({
    description: 'Eval case identifier from the baseline dataset.',
    example: 'billing-update-email',
  })
  id!: string;

  @ApiProperty({
    description: 'Eval case question.',
    example: 'How can I update the billing email?',
  })
  question!: string;

  @ApiProperty({
    description: 'Whether the case should be answerable from support docs.',
    enum: ['supported', 'unsupported'],
    example: 'supported',
  })
  type!: 'supported' | 'unsupported';

  @ApiProperty({
    description: 'Expected answer text or refusal behavior.',
    example: 'Update the billing email from workspace billing settings.',
  })
  expectedAnswer!: string;

  @ApiProperty({
    description: 'Expected source keys for supported cases.',
    example: ['billing'],
  })
  expectedSources!: string[];

  @ApiProperty({
    description: 'Actual chat response generated for the eval case.',
    type: ChatResponseDto,
  })
  response!: ChatResponseDto;

  @ApiProperty({
    description: 'Confidence recorded for the generated response.',
    example: 0.86,
  })
  actualConfidence!: number;

  @ApiProperty({
    description: 'Per-case scoring result.',
    type: EvalScoreResponseDto,
  })
  score!: EvalScoreResponseDto;

  @ApiProperty({
    description: 'Optional judge result for this eval case.',
    type: EvalJudgeResultResponseDto,
    required: false,
  })
  judge?: EvalJudgeResultResponseDto;
}

export class BaselineEvalRunResponseDto {
  @ApiProperty({
    description: 'Persisted eval run identifier.',
    example: 'eval_run_01J8ZA9Q6TY6G7A5X3Q2R1P0N9',
  })
  evalRunId!: string;

  @ApiProperty({
    description: 'Baseline eval dataset path used for the run.',
    example: '/app/datasets/evals/baseline.json',
  })
  dataset!: string;

  @ApiProperty({
    description: 'Judge provider used for the eval run.',
    example: 'deterministic',
  })
  judgeProvider!: string;

  @ApiProperty({
    description: 'Aggregate eval metrics.',
    type: EvalMetricsResponseDto,
  })
  metrics!: EvalMetricsResponseDto;

  @ApiProperty({
    description: 'Per-case baseline eval results.',
    type: [BaselineEvalCaseResultResponseDto],
  })
  results!: BaselineEvalCaseResultResponseDto[];
}

export class PersistedEvalCaseResultResponseDto {
  @ApiProperty({
    description: 'Eval case identifier from the dataset.',
    example: 'billing-update-email',
  })
  caseId!: string;

  @ApiProperty({
    description: 'Eval case question.',
    example: 'How can I update the billing email?',
  })
  question!: string;

  @ApiProperty({
    description: 'Whether the case should be answerable from support docs.',
    enum: ['supported', 'unsupported'],
    example: 'supported',
  })
  type!: 'supported' | 'unsupported';

  @ApiProperty({
    description: 'Whether the case passed every scoring dimension.',
    example: true,
  })
  passed!: boolean;

  @ApiProperty({
    description: 'Expected answer text or refusal behavior.',
    example: 'Update the billing email from workspace billing settings.',
  })
  expectedAnswer!: string;

  @ApiProperty({
    description: 'Expected source keys for supported cases.',
    example: ['billing'],
  })
  expectedSources!: string[];

  @ApiProperty({
    description: 'Actual answer or refusal message returned by the assistant.',
    example:
      'Workspace owners can update the billing email from Settings > Billing.',
  })
  actualAnswer!: string;

  @ApiProperty({
    description: 'Whether the assistant refused this eval case.',
    example: false,
  })
  actualRefusal!: boolean;

  @ApiProperty({
    description: 'Confidence recorded for the generated response.',
    nullable: true,
    example: 0.86,
  })
  actualConfidence!: number | null;

  @ApiProperty({
    description: 'Citations returned by the assistant.',
    type: [Object],
    example: [
      {
        chunkId: 'chunk_01J8Z8N4Q7R2V3T9M6K1H5D2A0',
        documentId: 'doc_01J8Z8MZK3PX9N8Q4E7V6C2B1A',
        documentTitle: 'Billing and invoices',
        sourceKey: 'billing',
        chunkIndex: 2,
        snippet: 'Workspace owners can update billing contacts from Settings.',
      },
    ],
  })
  actualCitations!: unknown;

  @ApiProperty({
    description: 'Whether refusal behavior matched the expected outcome.',
    example: true,
  })
  refusalCorrect!: boolean;

  @ApiProperty({
    description: 'Whether citations matched the expected source behavior.',
    example: true,
  })
  citationCorrect!: boolean;

  @ApiProperty({
    description: 'Whether answer content matched the expected answer.',
    example: true,
  })
  answerMatch!: boolean;

  @ApiProperty({
    description: 'Optional judge provider used for this eval case.',
    nullable: true,
    example: 'deterministic',
  })
  judgeProvider!: string | null;

  @ApiProperty({
    description: 'Optional judge score from 0 to 1.',
    nullable: true,
    example: 1,
  })
  judgeScore!: number | null;

  @ApiProperty({
    description: 'Optional judge pass/fail verdict.',
    nullable: true,
    example: true,
  })
  judgePassed!: boolean | null;

  @ApiProperty({
    description: 'Optional judge rationale.',
    nullable: true,
    example: 'The answer is supported by citations.',
  })
  judgeReasoning!: string | null;

  @ApiProperty({
    description: 'Optional structured judge result.',
    nullable: true,
    type: EvalJudgeResultResponseDto,
  })
  judgeResult!: EvalJudgeResultResponseDto | null;
}

export class EvalRunResponseDto {
  @ApiProperty({
    description: 'Persisted eval run identifier.',
    example: 'eval_run_01J8ZA9Q6TY6G7A5X3Q2R1P0N9',
  })
  id!: string;

  @ApiProperty({
    description: 'Eval run name.',
    example: 'baseline',
  })
  name!: string;

  @ApiProperty({
    description: 'Dataset path used for the run.',
    example: '/app/datasets/evals/baseline.json',
  })
  datasetPath!: string;

  @ApiProperty({
    description: 'Total number of eval cases.',
    example: 8,
  })
  totalCases!: number;

  @ApiProperty({
    description: 'Number of cases that passed every scoring dimension.',
    example: 7,
  })
  passedCases!: number;

  @ApiProperty({
    description: 'Number of cases that failed at least one scoring dimension.',
    example: 1,
  })
  failedCases!: number;

  @ApiProperty({
    description: 'Share of cases with correct refusal behavior.',
    example: 1,
  })
  refusalAccuracy!: number;

  @ApiProperty({
    description: 'Share of cases with correct citation behavior.',
    example: 0.875,
  })
  citationAccuracy!: number;

  @ApiProperty({
    description: 'Share of cases with matching answer behavior.',
    example: 0.875,
  })
  answerMatchAccuracy!: number;

  @ApiProperty({
    description: 'LLM provider used for the eval run.',
    example: 'deterministic',
  })
  provider!: string;

  @ApiProperty({
    description: 'Judge provider used for the eval run.',
    example: 'deterministic',
  })
  judgeProvider!: string;

  @ApiProperty({
    description: 'Eval run creation timestamp.',
    format: 'date-time',
    example: '2026-06-10T14:30:00.000Z',
  })
  createdAt!: string;

  @ApiProperty({
    description: 'Persisted per-case eval results.',
    type: [PersistedEvalCaseResultResponseDto],
  })
  results!: PersistedEvalCaseResultResponseDto[];
}

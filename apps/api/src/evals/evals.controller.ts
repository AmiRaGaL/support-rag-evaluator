import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { IdParamDto } from '../common/dto/id-param.dto';
import { DEFAULT_LIST_LIMIT, ListQueryDto } from '../common/dto/list-query.dto';
import {
  BaselineEvalRunResponseDto,
  EvalRunResponseDto,
} from './dto/eval-response.dto';
import {
  EvalsService,
  type PersistedEvalRunWithCaseResults,
} from './evals.service';

@ApiTags('evals')
@Controller('evals')
export class EvalsController {
  constructor(private readonly evalsService: EvalsService) {}

  @Get('runs')
  @ApiOkResponse({
    description: 'Recent eval runs ordered newest first.',
    type: [EvalRunResponseDto],
  })
  async listEvalRuns(@Query() query: ListQueryDto) {
    const runs = await this.evalsService.listRecentEvalRuns(
      query.limit ?? DEFAULT_LIST_LIMIT,
    );

    return runs.map((run) => this.toResponse(run));
  }

  @Get('runs/:id')
  @ApiOkResponse({
    description: 'Eval run detail with per-case results.',
    type: EvalRunResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'No eval run exists for the supplied id.',
  })
  async getEvalRun(@Param() params: IdParamDto) {
    const run = await this.evalsService.findEvalRunById(params.id);

    if (!run) {
      throw new NotFoundException(`Eval run ${params.id} was not found.`);
    }

    return this.toResponse(run);
  }

  @Post('run-baseline')
  @ApiCreatedResponse({
    description: 'Runs the baseline eval dataset and persists the result.',
    type: BaselineEvalRunResponseDto,
  })
  runBaseline() {
    return this.evalsService.runBaseline();
  }

  private toResponse(run: PersistedEvalRunWithCaseResults) {
    return {
      id: run.id,
      name: run.name,
      datasetPath: run.datasetPath,
      totalCases: run.totalCases,
      passedCases: run.passedCases,
      failedCases: run.failedCases,
      refusalAccuracy: run.refusalAccuracy,
      citationAccuracy: run.citationAccuracy,
      answerMatchAccuracy: run.answerMatchAccuracy,
      provider: run.provider,
      createdAt: run.createdAt,
      results: run.caseResults.map((result) => ({
        caseId: result.caseId,
        question: result.question,
        type: result.type,
        passed: result.passed,
        expectedAnswer: result.expectedAnswer,
        expectedSources: result.expectedSources,
        actualAnswer: result.actualAnswer,
        actualRefusal: result.actualRefusal,
        actualConfidence: result.actualConfidence,
        actualCitations: result.actualCitations,
        refusalCorrect: result.refusalCorrect,
        citationCorrect: result.citationCorrect,
        answerMatch: result.answerMatch,
      })),
    };
  }
}

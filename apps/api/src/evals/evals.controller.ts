import { Controller, Post } from '@nestjs/common';
import { EvalsService } from './evals.service';

@Controller('evals')
export class EvalsController {
  constructor(private readonly evalsService: EvalsService) {}

  @Post('run-baseline')
  runBaseline() {
    return this.evalsService.runBaseline();
  }
}

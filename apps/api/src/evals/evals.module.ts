import { Module } from '@nestjs/common';
import { ChatModule } from '../chat/chat.module';
import { IngestionModule } from '../ingestion/ingestion.module';
import { RetrievalModule } from '../retrieval/retrieval.module';
import { EvalsController } from './evals.controller';
import { EvalsService } from './evals.service';

@Module({
  imports: [ChatModule, IngestionModule, RetrievalModule],
  controllers: [EvalsController],
  providers: [EvalsService],
})
export class EvalsModule {}

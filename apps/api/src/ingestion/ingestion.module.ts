import { Module } from '@nestjs/common';
import { DocumentsModule } from '../documents/documents.module';
import { IngestionController } from './ingestion.controller';
import { IngestionService } from './ingestion.service';

@Module({
  imports: [DocumentsModule],
  controllers: [IngestionController],
  providers: [IngestionService],
})
export class IngestionModule {}

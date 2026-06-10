import { Module } from '@nestjs/common';
import { LlmModule } from '../llm/llm.module';
import { QueryLogsModule } from '../query-logs/query-logs.module';
import { RetrievalModule } from '../retrieval/retrieval.module';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

@Module({
  imports: [RetrievalModule, LlmModule, QueryLogsModule],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}

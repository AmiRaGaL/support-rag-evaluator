import { Module } from '@nestjs/common';
import { RetrievalModule } from '../retrieval/retrieval.module';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { GroundedAnswerService } from './grounded-answer.service';

@Module({
  imports: [RetrievalModule],
  controllers: [ChatController],
  providers: [ChatService, GroundedAnswerService],
})
export class ChatModule {}

import { Body, Controller, Post } from '@nestjs/common';
import { ChatService } from './chat.service';

interface ChatBody {
  question?: unknown;
  limit?: unknown;
}

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  answerQuestion(@Body() body: ChatBody) {
    return this.chatService.answerQuestion({
      question: this.normalizeQuestion(body?.question),
      limit: this.normalizeLimit(body?.limit),
    });
  }

  private normalizeQuestion(question: unknown): string {
    return typeof question === 'string' ? question : '';
  }

  private normalizeLimit(limit: unknown): number | undefined {
    if (typeof limit === 'number') {
      return limit;
    }

    if (typeof limit === 'string') {
      const parsed = Number(limit);
      return Number.isFinite(parsed) ? parsed : undefined;
    }

    return undefined;
  }
}

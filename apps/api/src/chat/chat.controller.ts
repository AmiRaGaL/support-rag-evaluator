import { Body, Controller, Post } from '@nestjs/common';
import { ChatRequestDto } from './dto/chat-request.dto';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  answerQuestion(@Body() body: ChatRequestDto) {
    return this.chatService.answerQuestion({
      question: body.question,
      limit: body.limit,
    });
  }
}

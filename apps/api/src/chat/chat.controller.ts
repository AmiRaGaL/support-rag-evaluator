import { Body, Controller, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiTags } from '@nestjs/swagger';
import { ChatRequestDto } from './dto/chat-request.dto';
import { ChatResponseDto } from './dto/chat-response.dto';
import { ChatService } from './chat.service';

@ApiTags('chat')
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  @ApiCreatedResponse({
    description:
      'Grounded answer with citations, or a refusal when unsupported.',
    type: ChatResponseDto,
  })
  answerQuestion(@Body() body: ChatRequestDto) {
    return this.chatService.answerQuestion({
      question: body.question,
      limit: body.limit,
    });
  }
}

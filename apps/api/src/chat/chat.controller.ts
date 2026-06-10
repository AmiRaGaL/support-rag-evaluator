import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ChatRequestDto } from './dto/chat-request.dto';
import { ChatResponseDto } from './dto/chat-response.dto';
import { ChatService } from './chat.service';

@ApiTags('chat')
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  @ApiOperation({
    summary: 'Answer a support question from retrieved docs',
    description:
      'Retrieves support documentation and returns a grounded answer with citations, or refuses unsupported questions. The deterministic provider is the default; Groq is optional only when explicitly configured.',
  })
  @ApiCreatedResponse({
    description:
      'Grounded answer with citations, or a refusal when unsupported.',
    type: ChatResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'The request body failed validation.',
  })
  @ApiInternalServerErrorResponse({
    description:
      'Retrieval, answer generation, or query logging failed unexpectedly.',
  })
  answerQuestion(@Body() body: ChatRequestDto) {
    return this.chatService.answerQuestion({
      question: body.question,
      limit: body.limit,
    });
  }
}

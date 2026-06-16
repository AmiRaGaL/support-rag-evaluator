import { Body, Controller, HttpStatus, Post, Res } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiProduces,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { ChatRequestDto } from './dto/chat-request.dto';
import { ChatResponseDto } from './dto/chat-response.dto';
import { ChatStreamCompleteEventDto } from './dto/chat-stream-event.dto';
import { ChatService } from './chat.service';

@ApiTags('chat')
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  @ApiOperation({
    summary: 'Answer a support question from retrieved docs',
    description:
      'Retrieves support documentation and returns a grounded answer with citations, or refuses unsupported questions. Groq is the default outside tests; deterministic remains available for CI and offline fallback.',
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

  @Post('stream')
  @ApiOperation({
    summary: 'Stream a support answer from retrieved docs',
    description:
      'Streams answer text as server-sent events, then sends a final complete event containing the unchanged chat response shape, confidence, citations, refusal metadata, and retrieved chunks. The selected provider produces the final answer; deterministic chunks that answer for CI-safe fallback streaming.',
  })
  @ApiProduces('text/event-stream')
  @ApiOkResponse({
    description:
      'Server-sent events. answer_delta events contain text increments; the complete event matches this schema.',
    type: ChatStreamCompleteEventDto,
  })
  @ApiBadRequestResponse({
    description: 'The request body failed validation.',
  })
  @ApiInternalServerErrorResponse({
    description:
      'Retrieval, answer generation, streaming, or query logging failed unexpectedly.',
  })
  async streamAnswerQuestion(
    @Body() body: ChatRequestDto,
    @Res() response: Response,
  ) {
    response.status(HttpStatus.OK);
    response.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    response.setHeader('Cache-Control', 'no-cache, no-transform');
    response.setHeader('Connection', 'keep-alive');
    response.flushHeaders?.();

    try {
      for await (const event of this.chatService.streamAnswerQuestion({
        question: body.question,
        limit: body.limit,
      })) {
        response.write(`event: ${event.type}\n`);
        response.write(`data: ${JSON.stringify(event)}\n\n`);
      }
    } catch (error) {
      response.write('event: error\n');
      response.write(
        `data: ${JSON.stringify({
          type: 'error',
          message: error instanceof Error ? error.message : 'Streaming failed.',
        })}\n\n`,
      );
    } finally {
      response.end();
    }
  }
}

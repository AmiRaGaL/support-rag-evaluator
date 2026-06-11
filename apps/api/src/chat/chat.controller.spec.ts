import type { Response } from 'express';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

describe('ChatController', () => {
  const chatService = {
    answerQuestion: jest.fn(),
    streamAnswerQuestion: jest.fn(),
  };

  beforeEach(() => {
    chatService.answerQuestion.mockReset();
    chatService.streamAnswerQuestion.mockReset();
  });

  it('keeps POST /chat on the non-streaming response shape', async () => {
    const response = {
      status: 'answered',
      question: 'billing exports',
      answer: 'Billing exports are available from billing settings.',
      citations: [],
      retrievedChunkCount: 1,
    };
    chatService.answerQuestion.mockResolvedValue(response);
    const controller = new ChatController(
      chatService as unknown as ChatService,
    );

    await expect(
      controller.answerQuestion({
        question: 'billing exports',
        limit: 5,
      }),
    ).resolves.toEqual(response);
    expect(chatService.answerQuestion).toHaveBeenCalledWith({
      question: 'billing exports',
      limit: 5,
    });
  });

  it('streams answer events without requiring Groq configuration', async () => {
    chatService.streamAnswerQuestion.mockReturnValue(
      streamEvents([
        {
          type: 'answer_delta',
          text: 'Billing exports ',
        },
        {
          type: 'answer_delta',
          text: 'are available.',
        },
        {
          type: 'complete',
          response: {
            status: 'answered',
            question: 'billing exports',
            answer: 'Billing exports are available.',
            citations: [],
            retrievedChunkCount: 1,
          },
          confidence: 0.7,
          retrievedChunks: [],
        },
      ]),
    );
    const response = createResponseMock();
    const controller = new ChatController(
      chatService as unknown as ChatService,
    );

    await controller.streamAnswerQuestion(
      {
        question: 'billing exports',
        limit: 5,
      },
      response as unknown as Response,
    );

    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.setHeader).toHaveBeenCalledWith(
      'Content-Type',
      'text/event-stream; charset=utf-8',
    );
    expect(response.write.mock.calls.join('\n')).toContain(
      'event: answer_delta',
    );
    expect(response.write.mock.calls.join('\n')).toContain('event: complete');
    expect(response.end).toHaveBeenCalledTimes(1);
    expect(chatService.streamAnswerQuestion).toHaveBeenCalledWith({
      question: 'billing exports',
      limit: 5,
    });
  });
});

async function* streamEvents(events: unknown[]) {
  for (const event of events) {
    await Promise.resolve();
    yield event;
  }
}

function createResponseMock() {
  return {
    status: jest.fn().mockReturnThis(),
    setHeader: jest.fn(),
    flushHeaders: jest.fn(),
    write: jest.fn(),
    end: jest.fn(),
  };
}

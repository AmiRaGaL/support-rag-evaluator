import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { ChatRequestDto } from './chat-request.dto';

describe('ChatRequestDto', () => {
  it('accepts a non-empty question and integer limit in range', () => {
    const dto = plainToInstance(ChatRequestDto, {
      question: '  How do I update billing?  ',
      limit: '20',
    });

    expect(validateSync(dto)).toEqual([]);
    expect(dto.question).toBe('How do I update billing?');
    expect(dto.limit).toBe(20);
  });

  it('rejects an empty question', () => {
    const dto = plainToInstance(ChatRequestDto, {
      question: '   ',
    });

    expect(validateSync(dto)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          property: 'question',
        }),
      ]),
    );
  });

  it('rejects limits outside the safe range', () => {
    const dto = plainToInstance(ChatRequestDto, {
      question: 'How do I update billing?',
      limit: '21',
    });

    expect(validateSync(dto)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          property: 'limit',
        }),
      ]),
    );
  });

  it('rejects null limits', () => {
    const dto = plainToInstance(ChatRequestDto, {
      question: 'How do I update billing?',
      limit: null,
    });

    expect(validateSync(dto)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          property: 'limit',
        }),
      ]),
    );
  });
});

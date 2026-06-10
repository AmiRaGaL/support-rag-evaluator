import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import {
  RetrievalSearchBodyDto,
  RetrievalSearchQueryDto,
} from './retrieval-search.dto';

describe('RetrievalSearchBodyDto', () => {
  it('accepts a non-empty query and integer limit in range', () => {
    const dto = plainToInstance(RetrievalSearchBodyDto, {
      query: '  billing export  ',
      limit: '5',
    });

    expect(validateSync(dto)).toEqual([]);
    expect(dto.query).toBe('billing export');
    expect(dto.limit).toBe(5);
  });

  it('rejects an empty query', () => {
    const dto = plainToInstance(RetrievalSearchBodyDto, {
      query: '   ',
    });

    expect(validateSync(dto)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          property: 'query',
        }),
      ]),
    );
  });
});

describe('RetrievalSearchQueryDto', () => {
  it('accepts a non-empty q param and integer limit in range', () => {
    const dto = plainToInstance(RetrievalSearchQueryDto, {
      q: '  billing export  ',
      limit: '20',
    });

    expect(validateSync(dto)).toEqual([]);
    expect(dto.q).toBe('billing export');
    expect(dto.limit).toBe(20);
  });

  it('rejects limits outside the safe range', () => {
    const dto = plainToInstance(RetrievalSearchQueryDto, {
      q: 'billing export',
      limit: '0',
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

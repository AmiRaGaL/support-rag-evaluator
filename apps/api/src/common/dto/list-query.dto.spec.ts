import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { ListQueryDto } from './list-query.dto';

describe('ListQueryDto', () => {
  it('accepts an omitted limit', () => {
    const dto = plainToInstance(ListQueryDto, {});

    expect(validateSync(dto)).toEqual([]);
    expect(dto.limit).toBeUndefined();
  });

  it('transforms and validates a limit in range', () => {
    const dto = plainToInstance(ListQueryDto, {
      limit: '50',
    });

    expect(validateSync(dto)).toEqual([]);
    expect(dto.limit).toBe(50);
  });

  it('rejects invalid list limits', () => {
    const dto = plainToInstance(ListQueryDto, {
      limit: 'not-a-number',
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

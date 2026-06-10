import { validateSync } from 'class-validator';
import { IdParamDto } from './id-param.dto';

describe('IdParamDto', () => {
  it('accepts common local and cuid-like ids', () => {
    const queryId = new IdParamDto();
    queryId.id = 'query_1';
    const cuid = new IdParamDto();
    cuid.id = 'clxbrwr9d000008l18xg2d2x9';

    expect(validateSync(queryId)).toEqual([]);
    expect(validateSync(cuid)).toEqual([]);
  });

  it('rejects empty or unsafe ids', () => {
    const empty = new IdParamDto();
    empty.id = '';
    const unsafe = new IdParamDto();
    unsafe.id = '../secret';

    expect(validateSync(empty)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          property: 'id',
        }),
      ]),
    );
    expect(validateSync(unsafe)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          property: 'id',
        }),
      ]),
    );
  });
});

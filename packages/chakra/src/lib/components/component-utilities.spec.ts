import { numericAspectRatio } from './aspect-ratio.js';
import { postkitHeadingSize } from './heading-size.js';

describe('component value adapters', () => {
  const headingSizes = { sm: 'sm', md: 'lg', lg: '2xl' } as const;

  it('maps scalar, responsive array, and conditional heading sizes', () => {
    expect(postkitHeadingSize(undefined, headingSizes)).toBe('lg');
    expect(postkitHeadingSize('sm', headingSizes)).toBe('sm');
    expect(postkitHeadingSize('unknown', headingSizes)).toBe('lg');
    expect(postkitHeadingSize(['sm', null, 'lg'], headingSizes)).toEqual([
      'sm',
      'lg',
      '2xl',
    ]);
    expect(postkitHeadingSize({ base: 'sm', md: 'lg' }, headingSizes)).toEqual({
      base: 'sm',
      md: '2xl',
    });
  });

  it('normalizes numeric, fractional, and invalid aspect ratios', () => {
    expect(numericAspectRatio(2)).toBe(2);
    expect(numericAspectRatio(Number.NaN, 1)).toBe(1);
    expect(numericAspectRatio('4/3')).toBe(4 / 3);
    expect(numericAspectRatio('2')).toBe(2);
    expect(numericAspectRatio('4/0', 1)).toBe(1);
    expect(numericAspectRatio(undefined, 1)).toBe(1);
  });
});

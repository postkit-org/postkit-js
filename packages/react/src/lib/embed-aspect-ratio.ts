import type { CSSProperties } from 'react';

/**
 * An embed's aspect ratio for CSS, from a number or `"16 / 9"` text; 16 / 9
 * when it's missing or invalid, as `@postkit/chakra`'s embeds default.
 *
 * @internal
 */
export function postkitEmbedAspectRatio(
  value: number | string | undefined,
): CSSProperties['aspectRatio'] {
  if (typeof value === 'number') {
    return Number.isFinite(value) && value > 0 ? value : 16 / 9;
  }
  if (typeof value === 'string') {
    const [width, height] = value.split('/').map(Number);
    const ratio = height === undefined ? width : width / height;
    if (Number.isFinite(ratio) && ratio > 0) return ratio;
  }
  return 16 / 9;
}

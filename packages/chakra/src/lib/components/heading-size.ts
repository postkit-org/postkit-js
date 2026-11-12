import type { HeadingProps } from '@chakra-ui/react';

type PostkitSize = 'sm' | 'md' | 'lg';
type HeadingSize = Exclude<HeadingProps['size'], undefined>;

export type PostkitHeadingSizeMap = Readonly<Record<PostkitSize, HeadingSize>>;

function mapHeadingSize(value: unknown, sizes: PostkitHeadingSizeMap): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => mapHeadingSize(entry, sizes));
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([condition, entry]) => [
        condition,
        mapHeadingSize(entry, sizes),
      ]),
    );
  }
  return typeof value === 'string' && value in sizes
    ? sizes[value as PostkitSize]
    : sizes.md;
}

export function postkitHeadingSize(
  size: unknown,
  sizes: PostkitHeadingSizeMap,
): HeadingProps['size'] {
  return mapHeadingSize(size ?? 'md', sizes) as HeadingProps['size'];
}

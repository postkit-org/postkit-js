import { Box, type BoxProps } from '@chakra-ui/react';

/** `content` 1120px (most pages), `docs` 1280px (docs shell), `prose` 680px (note text). */
export type PageContainerWidth = 'content' | 'docs' | 'prose';

export interface PageContainerProps extends Omit<BoxProps, 'width' | 'maxW'> {
  /** The content width, from the `sizes` tokens (02 §4). Defaults to `content`. */
  readonly width?: PageContainerWidth;
}

/**
 * Centres a page's content at one of the three layout widths with 24px gutters (02 §4).
 * The width is the content box: the gutters sit outside it, as in the header.
 * Any other Box prop (`as`, padding, `paddingBlock`…) passes through.
 */
export function PageContainer({
  width = 'content',
  ...props
}: PageContainerProps) {
  return (
    <Box
      width="100%"
      maxW={`calc({sizes.${width}} + 2 * {spacing.gutter})`}
      marginInline="auto"
      paddingInline="gutter"
      {...props}
    />
  );
}

import { Box, chakra, type BoxProps } from '@chakra-ui/react';
import type { ReactNode } from 'react';

import {
  PageContainer,
  TwoToneHeading,
  type PageContainerProps,
} from '../layout';

export interface HomeSectionProps extends Omit<PageContainerProps, 'title'> {
  /** The heading's id; the section is labelled by it. */
  readonly id: string;
  /** The statement, in `fg`. */
  readonly title: ReactNode;
  /** The value line, in `fg.quiet`. */
  readonly quiet: ReactNode;
  readonly children: ReactNode;
}

/**
 * One Home section (SiteHome): a two-tone `section` heading at most 20ch wide, then its
 * content 56px below. Sections are 96px apart on desktop and 64px on phones (02 §4).
 */
export function HomeSection({
  id,
  title,
  quiet,
  children,
  ...props
}: HomeSectionProps) {
  return (
    <PageContainer
      as="section"
      aria-labelledby={id}
      paddingTop={{ base: 'sectionPhone', md: 'section' }}
      {...props}
    >
      <TwoToneHeading id={id} title={title} quiet={quiet} maxW="20ch" />
      <Box marginTop={{ base: '10', md: '14' }}>{children}</Box>
    </PageContainer>
  );
}

export interface DemoTileProps extends BoxProps {
  /** The component names on the tile's chip, e.g. "KeyTakeaway" or "CodeGroup · Diff". */
  readonly label: string;
  readonly children: ReactNode;
}

/**
 * A `bg.subtle` tile with a mono chip naming what's drawn on it (SiteHome's kit tiles).
 * The chip sits in the top-left corner; the content starts below it.
 */
export function DemoTile({ label, children, ...props }: DemoTileProps) {
  return (
    <Box
      position="relative"
      minW="0"
      bg="bg.subtle"
      borderRadius="2xl"
      paddingTop="52px"
      paddingInline="5"
      paddingBottom="5"
      display="flex"
      alignItems="center"
      {...props}
    >
      <DemoChip position="absolute" top="3.5" left="3.5">
        {label}
      </DemoChip>
      {children}
    </Box>
  );
}

/** The mono pill that names a demo: "post.mdx", "Rendered", "Figure". */
export const DemoChip = chakra('span', {
  base: {
    display: 'inline-block',
    paddingBlock: '1',
    paddingInline: '2.5',
    borderRadius: 'full',
    bg: 'bg',
    color: 'fg',
    fontFamily: 'mono',
    fontSize: 'xs',
    lineHeight: 'body',
  },
});

/** The white (`bg`) card a demo sits on inside its tile. */
export const DemoCard = chakra('div', {
  base: {
    width: '100%',
    minW: '0',
    borderRadius: 'lg',
    bg: 'bg',
  },
});

import { Box, chakra } from '@chakra-ui/react';
import { Prose, type ProseProps } from '@postkit/chakra';
import type { MDXComponents } from 'mdx/types';
import type { MDXRemoteSerializeResult } from 'next-mdx-remote';
import type { ComponentType, ReactNode } from 'react';

import { MdxContent, PageContainer, siteMdxComponents } from '../layout';

interface HeadingProps {
  readonly children?: ReactNode;
  readonly [prop: string]: unknown;
}

const SiteH2 = siteMdxComponents.h2 as ComponentType<HeadingProps>;

/**
 * Note `h2`s are two-tone (SiteArticle): "Write the component once. A tag in MDX, …" sets
 * the first sentence in `fg` and the rest in `fg.quiet`. Only plain-text headings split;
 * the id still comes from the whole text, so links to it don't change.
 */
function NoteH2({ children, ...props }: HeadingProps) {
  const text =
    typeof children === 'string'
      ? children
      : Array.isArray(children) &&
          children.every((child) => typeof child === 'string')
        ? children.join('')
        : null;
  const split = text ? /^(.+?[.!?])\s+(\S.*)$/s.exec(text) : null;

  return (
    <SiteH2 {...props}>
      {split ? (
        <>
          {split[1]} <chakra.span color="fg.quiet">{split[2]}</chakra.span>
        </>
      ) : (
        children
      )}
    </SiteH2>
  );
}

/**
 * The MDX wrapper stays Postkit's `Prose`; only its rhythm variable is tuned (SiteArticle):
 * an `h2` opens a new part of the article 96px down, 56px on phones.
 */
function NoteProse(props: ProseProps) {
  return (
    <Prose
      {...props}
      css={{
        '--postkit-prose-heading-space': '56px',
        md: { '--postkit-prose-heading-space': '96px' },
      }}
    />
  );
}

const noteComponents: MDXComponents = {
  wrapper: NoteProse,
  h2: NoteH2 as MDXComponents['h2'],
};

export interface NoteBodyProps {
  readonly source: MDXRemoteSerializeResult;
}

/**
 * The site's footnote sizes (01 §5.3, §6.6): from xl (1200px) the sidenotes and Asides sit in
 * a 192px column 28px right of the text, lined up with the lead image's right edge.
 */
const SIDENOTE = '& [data-postkit-component=Sidenote][data-postkit-part=root]';

const sidenoteColumn = {
  '--postkit-sidenote-width': '{sizes.sidenote}',
  '--postkit-sidenote-gap': '{sizes.sidenoteGap}',
  // SiteArticle: margin notes at 13px with an accent number, an accent edge on the note whose
  // mark is hovered or focused; on phones a 14px note opens on a quiet surface under its line.
  [SIDENOTE]: { color: 'fg.muted', fontSize: '13px', lineHeight: '1.5' },
  [`${SIDENOTE}[data-highlighted]`]: { borderInlineStartColor: 'accent' },
  [`${SIDENOTE}[data-active-placement=inline]`]: {
    bg: 'bg.subtle',
    borderRadius: '10px',
    color: 'fg.secondary',
    fontSize: '14px',
    marginTop: '12px',
  },
  [`${SIDENOTE} [data-postkit-part=number]`]: {
    color: 'accent',
    fontWeight: 'medium',
  },
} as const;

/**
 * The article text: a 680px column, centred, in the `prose` type style, rendered through
 * `MdxContent` with the real Postkit components.
 *
 * Footnotes are Postkit's `Footnote` and `Footnotes` (03 §7.1), placed per
 * `siteFootnoteDefaults`: notes open under their line on phones, close the article from md,
 * and move into the margin from xl, where `Aside` joins them (D14). The footnotes behaviour
 * moves focus between marks and notes and tints the note you jumped to.
 */
export function NoteBody({ source }: NoteBodyProps) {
  return (
    <PageContainer
      width="prose"
      position="relative"
      paddingTop={{ base: '48px', md: '72px' }}
    >
      <Box textStyle="prose" color="fg" css={sidenoteColumn}>
        <MdxContent source={source} components={noteComponents} />
      </Box>
    </PageContainer>
  );
}

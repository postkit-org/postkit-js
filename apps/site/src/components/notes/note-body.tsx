import { Box, chakra } from '@chakra-ui/react';
import { Prose, type ProseProps } from '@postkit/chakra';
import type { MDXComponents } from 'mdx/types';
import type { MDXRemoteSerializeResult } from 'next-mdx-remote';
import {
  useCallback,
  useEffect,
  useRef,
  type ComponentType,
  type MouseEvent,
  type ReactNode,
} from 'react';

import { MdxContent, PageContainer, siteMdxComponents } from '../layout';

/** Jumps land below the sticky header with room to spare. */
const JUMP_MARGIN = 'calc({sizes.header} + 24px)';

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

/**
 * End-note styles (CompFootnotes, `placement="end"`): accent superscript marks with a 24px
 * tap target, then a 64px rule and a numbered list whose ↩ backlinks return to the mark.
 * They target GFM's footnote markup (`data-footnote-ref`, `section[data-footnotes]`,
 * `data-footnote-backref`), which is what the Postkit preset emits until 03 step 10's
 * `Footnotes` lands.
 */
const footnoteStyles = {
  '& sup:has(> a[data-footnote-ref])': { lineHeight: 0 },
  '& a[data-footnote-ref]': {
    position: 'relative',
    // Inline (not inline-block), so the punctuation after a mark never wraps away from it.
    display: 'inline',
    paddingInline: '2px',
    borderRadius: 'xs',
    color: 'accent',
    fontSize: '0.68em',
    fontWeight: 'medium',
    lineHeight: 1,
    textDecoration: 'none',
    scrollMarginTop: JUMP_MARGIN,
    transitionProperty: 'background-color',
    transitionDuration: 'hover',
    transitionTimingFunction: 'ease-out',
    // The mark is drawn small; its hit area is at least 24×24 (02 §6, WCAG 2.5.8).
    '&::after': {
      content: '""',
      position: 'absolute',
      top: '50%',
      left: '50%',
      width: '100%',
      height: '100%',
      minWidth: '24px',
      minHeight: '24px',
      transform: 'translate(-50%, -50%)',
    },
    '&:hover, &:focus-visible': { bg: 'tint.note' },
  },
  '& section[data-footnotes]': {
    marginTop: '64px',
    '&::before': {
      content: '""',
      display: 'block',
      width: '64px',
      marginBottom: '16px',
      borderTopWidth: '1px',
      borderTopColor: 'border.faint',
    },
    // GFM's "Notes" heading: kept for screen readers (the list's label), hidden on screen.
    '& > h2': { srOnly: true },
    '& > ol': {
      counterReset: 'footnote',
      margin: 0,
      padding: 0,
      listStyleType: 'none',
      fontSize: '15px',
      lineHeight: '1.55',
    },
    '& > ol > li': {
      counterIncrement: 'footnote',
      display: 'grid',
      gridTemplateColumns: '24px minmax(0, 1fr)',
      columnGap: '4px',
      margin: '0 -10px',
      padding: '5px 10px',
      borderRadius: 'sm',
      scrollMarginTop: JUMP_MARGIN,
      transitionProperty: 'background-color',
      transitionDuration: '1.5s',
      transitionTimingFunction: 'ease-out',
      '&::before': {
        content: 'counter(footnote) "."',
        color: 'fg.quiet',
        fontVariantNumeric: 'tabular-nums',
      },
      '& > *': { gridColumn: 2, margin: 0, color: 'fg.secondary' },
      '& > * + *': { marginTop: '8px' },
      // Jumping to a note tints it; the tint fades over 1.5s (02 §6).
      '&[data-footnote-jumped]': { bg: 'tint.note', transitionDuration: '0s' },
      '&:focus': { outline: 'none' },
      '&:focus-visible': {
        outline: '2px solid',
        outlineColor: 'accent',
        outlineOffset: '2px',
      },
    },
    '& a[data-footnote-backref]': {
      position: 'relative',
      display: 'inline-block',
      // GFM already puts a space before ↩.
      marginInlineStart: '2px',
      borderRadius: 'xs',
      color: 'accent',
      textDecoration: 'none',
      lineHeight: 1,
      '&::after': {
        content: '""',
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: '24px',
        height: '24px',
        transform: 'translate(-50%, -50%)',
      },
    },
  },
} as const;

/**
 * Footnote jumps move focus, not just the scroll position (02 §6, 01 §13): a mark focuses its
 * note, and ↩ focuses the mark again. Native fragment navigation still does the scrolling
 * and updates the URL; this only follows it with focus and the tint.
 */
function useFootnoteFocus() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current
      ?.querySelectorAll<HTMLElement>('section[data-footnotes] > ol > li')
      .forEach((note) => {
        note.tabIndex = -1;
      });
  }, []);

  const onClick = useCallback((event: MouseEvent<HTMLDivElement>) => {
    const link = (event.target as Element).closest<HTMLAnchorElement>(
      'a[data-footnote-ref], a[data-footnote-backref]',
    );
    const hash = link?.getAttribute('href');
    if (!link || !hash?.startsWith('#')) return;

    const target = document.getElementById(decodeURIComponent(hash.slice(1)));
    if (!target) return;

    // After the browser has followed the fragment.
    requestAnimationFrame(() => {
      target.focus({ preventScroll: true });
      if (target.matches('li')) {
        target.setAttribute('data-footnote-jumped', '');
        requestAnimationFrame(() =>
          requestAnimationFrame(() =>
            target.removeAttribute('data-footnote-jumped'),
          ),
        );
      }
    });
  }, []);

  return { ref, onClick };
}

export interface NoteBodyProps {
  readonly source: MDXRemoteSerializeResult;
}

/**
 * The article text: a 680px column, centred, in the `prose` type style, rendered through
 * `MdxContent` with the real Postkit components.
 *
 * Footnotes are end notes at every width, and `Aside` is a block in the column: the stated
 * fallback (06 PK-037) until 03 step 10's `Footnotes` gives responsive `placement`.
 */
export function NoteBody({ source }: NoteBodyProps) {
  const { ref, onClick } = useFootnoteFocus();

  return (
    <PageContainer
      width="prose"
      position="relative"
      paddingTop={{ base: '48px', md: '72px' }}
    >
      {/* PK-037: sidenotes when 03 step 10 lands. From xl (1200px) the notes and Asides move
          into a 192px column 28px right of the text ({sizes.sidenote}, {sizes.sidenoteGap}),
          lined up with the lead image's right edge; this Box is the positioning context. */}
      <Box
        ref={ref}
        onClick={onClick}
        textStyle="prose"
        color="fg"
        css={footnoteStyles}
      >
        <MdxContent source={source} components={noteComponents} />
      </Box>
    </PageContainer>
  );
}

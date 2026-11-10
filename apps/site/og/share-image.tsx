import { tokens } from '@postkit/site-theme';

import type { ShareImage } from '../src/lib/share-images';

/**
 * The share-image template (05 §1; boards OgHome, OgComponent, OgDocs, OgNote, OgRelease):
 * one layout for all five kinds, rendered by `@vercel/og` (Satori) through `next/og` at
 * build time. Satori lays out with flexbox and inline styles only, so this is plain JSX, not
 * Chakra. Light only, whatever the reader's theme: every colour is a token's `light` value.
 */

const color = {
  bg: tokens.color.bg.light,
  bgSubtle: tokens.color['bg.subtle'].light,
  bgRaised: tokens.color['bg.raised'].light,
  fg: tokens.color.fg.light,
  muted: tokens.color['fg.muted'].light,
  quiet: tokens.color['fg.quiet'].light,
  latest: tokens.tone.tip.light,
} as const;

export const SANS = 'Inter Tight';
export const MONO = 'JetBrains Mono';

/** 64px top and 72px side padding. */
const PAD_TOP = 64;
const PAD_SIDE = 72;
/** The right-hand panel: a component preview or a note's cover. */
const ASIDE_WIDTH = 380;
const ASIDE_HEIGHT = 300;
const ASIDE_GAP = 48;

/** The title column: 980px alone, 620px beside a preview (the boards' `max-width`s). */
export const TITLE_WIDTH = { alone: 980, withAside: 620 } as const;
/** 76px alone, 64px beside a preview; long titles shrink in 4px steps to 56px. */
export const TITLE_SIZE = {
  alone: 76,
  withAside: 64,
  min: 56,
  step: 4,
} as const;
export const TITLE_MAX_LINES = 3;
export const TITLE_LINE_HEIGHT = tokens.lineHeight.tight;
const TITLE_TRACKING = -0.035;
/**
 * Inter Tight's word space at −0.035em tracking, measured in Satori. The title is one flex
 * item per word (Satori can't flow a coloured `<span>` inline with text), so this gap stands
 * in for the space between words.
 */
const WORD_SPACE = 0.187;

/** The title, split into words, after fitting: the grey half may end in "…". */
export interface TitleWords {
  readonly title: readonly string[];
  readonly quiet: readonly string[];
}

export type ShareImageAside =
  | {
      readonly type: 'component';
      readonly name: string;
      readonly directive: string;
    }
  | { readonly type: 'cover'; readonly src: string | null };

/** The two-tone title, one flex item per word so it wraps like text. */
export function TwoToneTitle({
  words,
  fontSize,
  width,
  hidden = false,
}: {
  readonly words: TitleWords;
  readonly fontSize: number;
  readonly width: number;
  /** Lays the words out without painting them (for measuring). */
  readonly hidden?: boolean;
}) {
  const wordStyle = (tone: string) => ({
    color: hidden ? 'transparent' : tone,
  });

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        width,
        columnGap: fontSize * WORD_SPACE,
        fontFamily: SANS,
        fontWeight: 500,
        fontSize,
        lineHeight: TITLE_LINE_HEIGHT,
        letterSpacing: fontSize * TITLE_TRACKING,
      }}
    >
      {words.title.map((word, index) => (
        <span key={`t${index}`} style={wordStyle(color.fg)}>
          {word}
        </span>
      ))}
      {words.quiet.map((word, index) => (
        <span key={`q${index}`} style={wordStyle(color.quiet)}>
          {word}
        </span>
      ))}
    </div>
  );
}

/**
 * What the renderer measures: the title alone, unpainted, with a bar under it. The bar's top
 * edge is the title's height, so its line count.
 */
export function TitleProbe({
  words,
  fontSize,
  width,
}: {
  readonly words: TitleWords;
  readonly fontSize: number;
  readonly width: number;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        background: color.bg,
      }}
    >
      <TwoToneTitle words={words} fontSize={fontSize} width={width} hidden />
      <div style={{ width: 8, height: 4, background: color.fg }} />
    </div>
  );
}

function Logo() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 11,
        fontFamily: SANS,
        fontWeight: 500,
        fontSize: 26,
        letterSpacing: 26 * -0.02,
        color: color.fg,
      }}
    >
      <div
        style={{
          width: 42,
          height: 23,
          borderRadius: tokens.radius.full,
          backgroundImage: tokens.gradient.logo,
        }}
      />
      <span>Postkit</span>
    </div>
  );
}

/** "● Latest", above the newest released changelog entry's title only. */
function LatestBadge() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: 8,
        marginBottom: 20,
        padding: '6px 14px',
        borderRadius: tokens.radius.full,
        background: color.bgSubtle,
        fontFamily: SANS,
        fontWeight: 400,
        fontSize: 18,
        lineHeight: 1.5,
        color: color.latest,
      }}
    >
      <div
        style={{
          width: 12,
          height: 12,
          borderRadius: tokens.radius.full,
          background: color.latest,
        }}
      />
      <span>Latest</span>
    </div>
  );
}

/**
 * The component panel. INTERIM (PK-061): 05 §1 asks for a static render of the component's
 * default preview, from the email renderer's static output or a pre-rendered PNG. Neither
 * path exists yet (Satori can't lay out email tables or Chakra's styles, and there are no
 * pre-rendered previews), so the panel shows the component's name and its directive.
 */
function ComponentPanel({
  name,
  directive,
}: {
  readonly name: string;
  readonly directive: string;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: ASIDE_WIDTH,
        height: ASIDE_HEIGHT,
        flexShrink: 0,
        borderRadius: tokens.radius['3xl'],
        background: color.bgSubtle,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          width: 300,
          padding: '22px 24px',
          borderRadius: tokens.radius.xl,
          background: color.bgRaised,
        }}
      >
        <span
          style={{
            fontFamily: SANS,
            fontWeight: 500,
            fontSize: 30,
            lineHeight: 1.15,
            letterSpacing: 30 * -0.02,
            color: color.fg,
          }}
        >
          {name}
        </span>
        <span
          style={{
            fontFamily: MONO,
            fontSize: 15,
            lineHeight: 1.4,
            color: color.muted,
          }}
        >
          {`:::${directive}`}
        </span>
      </div>
    </div>
  );
}

/** A note's cover: its image, or the brand gradient's `cover` stops. */
function CoverPanel({ src }: { readonly src: string | null }) {
  const frame = {
    width: ASIDE_WIDTH,
    height: ASIDE_HEIGHT,
    flexShrink: 0,
    borderRadius: tokens.radius['3xl'],
  } as const;

  if (src) {
    return (
      // Decoration inside a PNG: the image's own alt text is the title.
      <img
        alt=""
        src={src}
        width={ASIDE_WIDTH}
        height={ASIDE_HEIGHT}
        style={{ ...frame, objectFit: 'cover' }}
      />
    );
  }
  return <div style={{ ...frame, backgroundImage: tokens.gradient.cover }} />;
}

export interface ShareImageCardProps {
  readonly image: ShareImage;
  /** `postkit.org`: the canonical host, shown before the page path. */
  readonly host: string;
  readonly words: TitleWords;
  readonly fontSize: number;
  readonly aside: ShareImageAside | null;
  readonly latest: boolean;
}

/** The whole 1200×630 card. */
export function ShareImageCard({
  image,
  host,
  words,
  fontSize,
  aside,
  latest,
}: ShareImageCardProps) {
  const url = image.pagePath === '/' ? host : `${host}${image.pagePath}`;

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        padding: `${PAD_TOP}px ${PAD_SIDE}px 0`,
        background: color.bg,
        color: color.fg,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Logo />
        <span
          style={{
            fontFamily: MONO,
            fontSize: 18,
            lineHeight: 1.5,
            color: color.quiet,
          }}
        >
          {image.label}
        </span>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: ASIDE_GAP,
          marginTop: 72,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {latest ? <LatestBadge /> : null}
          <TwoToneTitle
            words={words}
            fontSize={fontSize}
            width={aside ? TITLE_WIDTH.withAside : TITLE_WIDTH.alone}
          />
        </div>
        {aside?.type === 'component' ? (
          <ComponentPanel name={aside.name} directive={aside.directive} />
        ) : null}
        {aside?.type === 'cover' ? <CoverPanel src={aside.src} /> : null}
      </div>

      <span
        style={{
          position: 'absolute',
          left: PAD_SIDE,
          bottom: 44,
          fontFamily: MONO,
          fontSize: 18,
          lineHeight: 1.5,
          color: color.muted,
        }}
      >
        {url}
      </span>
      <div
        style={{
          position: 'absolute',
          left: 0,
          bottom: 0,
          width: '100%',
          height: 12,
          backgroundImage: tokens.gradient.brand,
        }}
      />
    </div>
  );
}

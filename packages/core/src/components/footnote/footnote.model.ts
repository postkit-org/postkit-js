/**
 * Footnote helpers every renderer shares (03 §7.1): numbering formats, the
 * per-document ids, backlink labels and responsive placement. Framework-free
 * and dependency-free, so the headless, Chakra, email and static renderers
 * number and link notes identically.
 */

/** Where notes appear (03 §7.1). `end` is the list that closes the article. */
export const postkitFootnotePlacements = Object.freeze([
  'end',
  'side',
  'popover',
  'inline',
] as const);

/** One placement: `end`, `side`, `popover` or `inline`. */
export type PostkitFootnotePlacement =
  (typeof postkitFootnotePlacements)[number];

/**
 * The breakpoints a responsive placement may name, smallest first. `base`
 * applies from zero; the others at the host's breakpoint of the same name.
 */
export const postkitFootnoteBreakpointNames = Object.freeze([
  'base',
  'sm',
  'md',
  'lg',
  'xl',
  '2xl',
] as const);

/** A breakpoint a responsive placement may name. */
export type PostkitFootnoteBreakpoint =
  (typeof postkitFootnoteBreakpointNames)[number];

/** A responsive placement, such as `{ base: 'inline', md: 'end', xl: 'side' }`. */
export type PostkitResponsiveFootnotePlacement = Partial<
  Readonly<Record<PostkitFootnoteBreakpoint, PostkitFootnotePlacement>>
>;

/** The `placement` prop: one placement, or one per breakpoint. */
export type PostkitFootnotePlacementValue =
  PostkitFootnotePlacement | PostkitResponsiveFootnotePlacement;

/**
 * Minimum widths, in px, for the breakpoint names: Chakra UI's defaults
 * (30em, 48em, 64em, 80em, 96em). Hosts with other breakpoints pass theirs.
 */
export const postkitDefaultFootnoteBreakpoints: Readonly<
  Record<PostkitFootnoteBreakpoint, number>
> = Object.freeze({
  base: 0,
  sm: 480,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
});

/** The width below which `side` falls back to `end` (03 §7.1). */
export const postkitDefaultSideBreakpoint = 1024;

/** Marker styles for the reference in the text. */
export const postkitFootnoteMarkers = Object.freeze([
  'superscript',
  'bracket',
  'pill',
] as const);

/** A marker style: `superscript` (the default), `bracket` or `pill`. */
export type PostkitFootnoteMarker = (typeof postkitFootnoteMarkers)[number];

/** Built-in numbering formats. Renderers may also take a function. */
export const postkitFootnoteNumberings = Object.freeze([
  'decimal',
  'lower-roman',
  'lower-alpha',
  'symbol',
] as const);

/** A built-in numbering format. */
export type PostkitFootnoteNumbering =
  (typeof postkitFootnoteNumberings)[number];

/** A numbering format, or a function from the 1-based index to the mark. */
export type PostkitFootnoteNumberingValue =
  PostkitFootnoteNumbering | ((index: number) => string);

/** The book convention: *, †, ‡, §, ‖, ¶, then doubled, tripled… */
export const postkitFootnoteSymbols = Object.freeze([
  '*',
  '†',
  '‡',
  '§',
  '‖',
  '¶',
] as const);

function isPlacement(value: unknown): value is PostkitFootnotePlacement {
  return (
    typeof value === 'string' &&
    (postkitFootnotePlacements as readonly string[]).includes(value)
  );
}

function alpha(index: number): string {
  let value = index;
  let result = '';
  while (value > 0) {
    value -= 1;
    result = String.fromCharCode(97 + (value % 26)) + result;
    value = Math.floor(value / 26);
  }
  return result;
}

function roman(index: number): string {
  const numerals: readonly (readonly [number, string])[] = [
    [1000, 'm'],
    [900, 'cm'],
    [500, 'd'],
    [400, 'cd'],
    [100, 'c'],
    [90, 'xc'],
    [50, 'l'],
    [40, 'xl'],
    [10, 'x'],
    [9, 'ix'],
    [5, 'v'],
    [4, 'iv'],
    [1, 'i'],
  ];
  let value = index;
  let result = '';
  for (const [amount, numeral] of numerals) {
    while (value >= amount) {
      result += numeral;
      value -= amount;
    }
  }
  return result;
}

/**
 * The mark for the `index`-th note (1-based) in a numbering format. Unknown
 * formats and indexes below 1 fall back to decimal.
 */
export function formatPostkitFootnoteNumber(
  index: number,
  numbering: PostkitFootnoteNumberingValue | undefined = 'decimal',
): string {
  const value = Math.trunc(index);
  if (!Number.isFinite(value) || value < 1) return String(index);
  if (typeof numbering === 'function') return numbering(value);
  switch (numbering) {
    case 'lower-roman':
      return roman(value);
    case 'lower-alpha':
      return alpha(value);
    case 'symbol': {
      const symbols = postkitFootnoteSymbols;
      const symbol = symbols[(value - 1) % symbols.length] as string;
      return symbol.repeat(Math.floor((value - 1) / symbols.length) + 1);
    }
    default:
      return String(value);
  }
}

/** The label of a note's `occurrence`-th backlink when it has several: a, b, … */
export function postkitFootnoteBacklinkLabel(occurrence: number): string {
  return alpha(Math.max(1, Math.trunc(occurrence)));
}

/** Ids for one note and its references (03 §7.1). */
export interface PostkitFootnoteIds {
  /** The note in the end list: `fn-{scope}-{index}`. */
  readonly note: string;
  /** The note's sidenote, popover or inline copy: `sn-{scope}-{index}`. */
  readonly sidenote: string;
  /** The list title: `fn-{scope}-title`. */
  readonly title: string;
  /**
   * The `occurrence`-th reference (1-based): `fnref-{scope}-{index}`, then
   * `fnref-{scope}-{index}-2`, …
   */
  reference(occurrence?: number): string;
}

/** Lower-case, kebab-case: a scope that is safe in an id and a fragment. */
export function postkitFootnoteScope(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const scope = value
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return scope || undefined;
}

/**
 * The ids for the `index`-th note. `scope` (a document's slug) prefixes them
 * so feeds and index pages that show several documents never collide.
 */
export function postkitFootnoteIds(
  index: number,
  scope?: string,
): PostkitFootnoteIds {
  const normalized = postkitFootnoteScope(scope);
  const infix = normalized ? `-${normalized}` : '';
  return {
    note: `fn${infix}-${index}`,
    sidenote: `sn${infix}-${index}`,
    title: `fn${infix}-title`,
    reference: (occurrence = 1) =>
      `fnref${infix}-${index}${occurrence > 1 ? `-${occurrence}` : ''}`,
  };
}

/**
 * Reads a `placement` value: a placement name, a responsive object, or JSON
 * for either (as a Markdown directive writes it). Returns `undefined` when it
 * names nothing valid.
 */
export function parsePostkitFootnotePlacement(
  value: unknown,
): PostkitFootnotePlacementValue | undefined {
  if (isPlacement(value)) return value;
  let candidate = value;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (isPlacement(trimmed)) return trimmed;
    try {
      candidate = JSON.parse(trimmed) as unknown;
    } catch {
      return undefined;
    }
    if (isPlacement(candidate)) return candidate;
  }
  if (
    typeof candidate !== 'object' ||
    candidate === null ||
    Array.isArray(candidate)
  ) {
    return undefined;
  }
  const responsive: Partial<
    Record<PostkitFootnoteBreakpoint, PostkitFootnotePlacement>
  > = {};
  for (const name of postkitFootnoteBreakpointNames) {
    const entry = (candidate as Record<string, unknown>)[name];
    if (isPlacement(entry)) responsive[name] = entry;
  }
  return Object.keys(responsive).length > 0 ? responsive : undefined;
}

/**
 * Every breakpoint a placement value names, in order, with the placement
 * that applies from it. A single placement is `[['base', placement]]`.
 */
export function postkitFootnotePlacementSteps(
  value: PostkitFootnotePlacementValue | undefined,
): readonly (readonly [PostkitFootnoteBreakpoint, PostkitFootnotePlacement])[] {
  const parsed = parsePostkitFootnotePlacement(value) ?? 'end';
  if (typeof parsed === 'string') return [['base', parsed]];
  const steps = postkitFootnoteBreakpointNames.flatMap((name) => {
    const placement = parsed[name];
    return placement ? [[name, placement] as const] : [];
  });
  return steps[0]?.[0] === 'base' ? steps : [['base', 'end'], ...steps];
}

/** Every placement a value can resolve to at some width. */
export function postkitFootnotePlacementsUsed(
  value: PostkitFootnotePlacementValue | undefined,
): ReadonlySet<PostkitFootnotePlacement> {
  return new Set(
    postkitFootnotePlacementSteps(value).map(([, placement]) => placement),
  );
}

/** Options for {@link resolvePostkitFootnotePlacement}. */
export interface ResolvePostkitFootnotePlacementOptions {
  /** The viewport width, in px. */
  readonly width: number;
  /** Breakpoint minimum widths, in px. Defaults to Chakra UI's. */
  readonly breakpoints?: Partial<
    Readonly<Record<PostkitFootnoteBreakpoint, number>>
  >;
  /** `side` falls back to `end` below this width. Defaults to 1024. */
  readonly sideBreakpoint?: number;
  /**
   * Whether the margin has room for sidenotes. `false` makes `side` fall
   * back to `end`. Defaults to `true`.
   */
  readonly marginFits?: boolean;
}

/**
 * The placement that applies at a width: the responsive value's entry for
 * the largest breakpoint the width reaches, with `side` falling back to
 * `end` below `sideBreakpoint` or when the margin has no room (03 §7.1).
 */
export function resolvePostkitFootnotePlacement(
  value: PostkitFootnotePlacementValue | undefined,
  options: ResolvePostkitFootnotePlacementOptions,
): PostkitFootnotePlacement {
  const breakpoints = {
    ...postkitDefaultFootnoteBreakpoints,
    ...options.breakpoints,
  };
  let placement: PostkitFootnotePlacement = 'end';
  for (const [name, step] of postkitFootnotePlacementSteps(value)) {
    if (options.width >= (breakpoints[name] ?? Number.POSITIVE_INFINITY)) {
      placement = step;
    }
  }
  if (
    placement === 'side' &&
    (options.width < (options.sideBreakpoint ?? postkitDefaultSideBreakpoint) ||
      options.marginFits === false)
  ) {
    return 'end';
  }
  return placement;
}

import * as React from 'react';
import type { ReactNode } from 'react';

/**
 * Figure auto-numbering (03 §7, from Commune §6.10): beneath
 * `<PostkitProvider figures="numbered">`, each figure-like component takes
 * the next number in reading order and shows it before its caption.
 *
 * The rule:
 * - A `Figure`, `Video` or `Device` is one figure: "Fig. 1", "Fig. 2", …
 * - A `Carousel` or `Gallery` is one numbered figure whose items share its
 *   number, lettered from the second: "Fig. 1", "Fig. 1b", "Fig. 1c", …
 *   The next figure after it is "Fig. 2".
 * - Numbers follow render order, which is reading order on the server and
 *   when hydrating. A figure keeps its number across re-renders.
 */

/** `numbered` turns numbering on; `none` (the default) leaves figures as they are. */
export type PostkitFigureNumbering = 'none' | 'numbered';

interface FigureRegistry {
  claim(id: string): number;
}

interface FiguresContextValue {
  readonly registry: FigureRegistry;
  readonly label: string;
}

function createRegistry(): FigureRegistry {
  const numbers = new Map<string, number>();
  return {
    claim(id) {
      let number = numbers.get(id);
      if (number === undefined) {
        number = numbers.size + 1;
        numbers.set(id, number);
      }
      return number;
    },
  };
}

/*
 * React Server Components have no context; there, numbering is off and
 * figures render as they do without the provider.
 */
const FiguresContext =
  typeof React.createContext === 'function'
    ? React.createContext<FiguresContextValue | undefined>(undefined)
    : undefined;

const useFiguresContext: () => FiguresContextValue | undefined =
  FiguresContext && typeof React.useContext === 'function'
    ? () => React.useContext(FiguresContext)
    : () => undefined;

const useFigureId: () => string | undefined =
  typeof React.useId === 'function' ? React.useId : () => undefined;

export interface PostkitFiguresProviderProps {
  /** `numbered` numbers the figures beneath it. Defaults to `none`. */
  readonly figures?: PostkitFigureNumbering;
  /** The label before each number. Defaults to `Fig.` */
  readonly figureLabel?: string;
  readonly children?: ReactNode;
}

/**
 * Numbers the figures beneath it when `figures="numbered"`. Both providers
 * render it: `createPostkit().Provider` and `@postkit/chakra`'s
 * `PostkitProvider` take the same `figures` and `figureLabel` props.
 */
export const PostkitFiguresProvider: (
  props: PostkitFiguresProviderProps,
) => ReactNode = FiguresContext
  ? function PostkitFiguresProvider({
      figures = 'none',
      figureLabel = 'Fig.',
      children,
    }: PostkitFiguresProviderProps) {
      // One registry per mounted provider: a server render, or a hydration,
      // numbers from 1 in reading order.
      const [registry] = React.useState(createRegistry);
      const value = React.useMemo(
        () =>
          figures === 'numbered' ? { registry, label: figureLabel } : undefined,
        [figureLabel, figures, registry],
      );
      return (
        <FiguresContext.Provider value={value}>
          {children}
        </FiguresContext.Provider>
      );
    }
  : ({ children }: PostkitFiguresProviderProps) => children;

/** Letters for an item's position in a group: 0 → '', 1 → 'b', 25 → 'z', 26 → 'ba'. */
function itemLetters(index: number): string {
  if (index <= 0) return '';
  let letters = '';
  let rest = index;
  while (rest > 0) {
    letters = String.fromCharCode(97 + (rest % 26)) + letters;
    rest = Math.floor(rest / 26);
  }
  return letters;
}

/**
 * The label for a figure, or for item `index` of a numbered group:
 * `postkitFigureLabel(1)` → "Fig. 1", `postkitFigureLabel(1, 1)` → "Fig. 1b".
 */
export function postkitFigureLabel(
  number: number,
  index = 0,
  label = 'Fig.',
): string {
  return `${label} ${number}${itemLetters(index)}`;
}

/** A numbered figure: its label, and its items' labels for a group. */
export interface PostkitFigureNumber {
  readonly number: number;
  /** "Fig. 1" for the figure, or "Fig. 1b" for its second item. */
  label(index?: number): string;
}

/**
 * The figure number for the calling component, or `undefined` when no
 * `figures="numbered"` provider is above it. Call it once per figure (a
 * group calls it once and labels its items with `label(index)`).
 */
export function usePostkitFigureNumber(): PostkitFigureNumber | undefined {
  const id = useFigureId();
  const context = useFiguresContext();
  if (!context || id === undefined) return undefined;
  const number = context.registry.claim(id);
  return {
    number,
    label: (index = 0) => postkitFigureLabel(number, index, context.label),
  };
}

import {
  createFootnotes,
  type FootnotesBehaviorApi,
  type FootnotesBehaviorOptions,
} from '@postkit/core/behaviors';
import { useEffect, useState, type RefObject } from 'react';

/** Options for {@link useFootnotes}. */
export type UseFootnotesOptions = Omit<FootnotesBehaviorOptions, 'root'> & {
  /**
   * Anything that changes which notes and references are in the page, such
   * as the number of notes. The behaviour restarts when it changes.
   */
  readonly notesKey?: string | number;
};

/** What {@link useFootnotes} returns: the behaviour's API once started. */
export type UseFootnotesReturn = FootnotesBehaviorApi | undefined;

/**
 * Postkit's footnotes behaviour for React (03 §7.1), over the framework-free
 * `createFootnotes` in `@postkit/core/behaviors`. Pass a ref to the
 * `Footnotes` root: once the list and its references are in the page, the
 * behaviour applies the placement for the current width (side, popover,
 * inline or end), and moves focus between marks and notes.
 */
export function useFootnotes(
  ref: RefObject<HTMLElement | null>,
  options: UseFootnotesOptions,
): UseFootnotesReturn {
  const [api, setApi] = useState<FootnotesBehaviorApi>();
  const placement = JSON.stringify(options.placement ?? 'end');
  const breakpoints = JSON.stringify(options.breakpoints ?? {});
  const { sideBreakpoint, scope, container, notesKey, onPlacementChange } =
    options;

  useEffect(() => {
    const root = ref.current;
    if (!root) return undefined;
    const behavior = createFootnotes({
      root,
      placement: JSON.parse(placement) as FootnotesBehaviorOptions['placement'],
      breakpoints: JSON.parse(
        breakpoints,
      ) as FootnotesBehaviorOptions['breakpoints'],
      ...(sideBreakpoint === undefined ? {} : { sideBreakpoint }),
      ...(scope === undefined ? {} : { scope }),
      ...(container ? { container } : {}),
      ...(onPlacementChange ? { onPlacementChange } : {}),
    });
    const unsubscribe = behavior.subscribe(() => setApi(behavior.api));
    behavior.start();
    setApi(behavior.api);
    return () => {
      unsubscribe();
      behavior.stop();
    };
    // `onPlacementChange` is read when the behaviour starts.
  }, [ref, placement, breakpoints, sideBreakpoint, scope, container, notesKey]);

  return api;
}

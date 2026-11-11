import {
  postkitDefaultSideBreakpoint,
  postkitFootnoteIds,
  resolvePostkitFootnotePlacement,
  type PostkitFootnoteBreakpoint,
  type PostkitFootnotePlacement,
  type PostkitFootnotePlacementValue,
} from '../../components/footnote/footnote.model.js';
import type { Behavior } from '../behavior.js';

/**
 * Footnote placement (03 §7.1), framework-free. The views render every note
 * twice: in the end list (`Footnotes`, always present, so print and no-script
 * work) and, for the first reference, as a `Sidenote` beside it. This
 * behaviour decides which placement applies at the current width, shows the
 * sidenote copy for `side`, `popover` and `inline`, and moves focus the way a
 * reader expects.
 *
 * The DOM it reads (every Postkit renderer emits it):
 *
 * - the `Footnotes` root, whose `[data-postkit-part="item"]` notes carry the
 *   note id, `data-footnote-index` and `data-footnote-references`;
 * - each reference's `Footnote` root, with the reference id, and its
 *   `[data-postkit-part="marker"]` link;
 * - the `Sidenote` copy, with the sidenote id and an optional
 *   `[data-postkit-sidenote-close]` button.
 */

/** One box in the margin column: a sidenote or an `Aside`. */
export interface PostkitSidenoteBox {
  /** Where the box would like to start: its reference's line, in px. */
  readonly top: number;
  readonly height: number;
}

/**
 * Lays out the margin column: each box starts at its reference's line, and a
 * box that would overlap the one before moves down below it ("later note
 * pushes down", 03 §7.1). Returns each box's top, in order.
 */
export function layoutPostkitSidenotes(
  boxes: readonly PostkitSidenoteBox[],
  options: { readonly gap?: number } = {},
): number[] {
  const gap = options.gap ?? 0;
  const tops: number[] = [];
  let floor = Number.NEGATIVE_INFINITY;
  for (const box of boxes) {
    const top = Math.max(box.top, floor);
    tops.push(top);
    floor = top + box.height + gap;
  }
  return tops;
}

/** Options for {@link createFootnotes}. */
export interface FootnotesBehaviorOptions {
  /** The `Footnotes` root: the end list. */
  readonly root: HTMLElement;
  /** Where notes appear. Defaults to `end`. */
  readonly placement?: PostkitFootnotePlacementValue;
  /** `side` falls back to `end` below this width, in px. Defaults to 1024. */
  readonly sideBreakpoint?: number;
  /** Breakpoint minimum widths in px, for responsive placements. */
  readonly breakpoints?: Partial<
    Readonly<Record<PostkitFootnoteBreakpoint, number>>
  >;
  /** The ids' scope, as the views were given it. */
  readonly scope?: string;
  /**
   * The element whose right edge the margin column starts from. Defaults to
   * the list's parent: the article's text column.
   */
  readonly container?: HTMLElement;
  /** Called when the placement that applies changes. */
  readonly onPlacementChange?: (details: {
    readonly placement: PostkitFootnotePlacement;
  }) => void;
}

/** What a running footnotes behaviour reports. */
export interface FootnotesBehaviorApi {
  /** The placement that applies now, after any fallback. */
  readonly placement: PostkitFootnotePlacement;
  /** The placement the value asks for at this width, before fallbacks. */
  readonly intended: PostkitFootnotePlacement;
  /** The note that is open in place (popover or inline), if any. */
  readonly open: number | undefined;
  /** Opens a note in place (popover or inline placements). */
  openNote(index: number): void;
  /** Closes the open note, returning focus to its mark. */
  closeNote(): void;
  /** Measures again, as a resize does. */
  refresh(): void;
}

/** A running footnotes behaviour. */
export type FootnotesBehavior = Behavior<FootnotesBehaviorApi>;

interface Note {
  readonly index: number;
  readonly item: HTMLElement;
  readonly references: readonly HTMLElement[];
  readonly sidenote: HTMLElement | null;
}

type PopoverElement = HTMLElement & {
  showPopover?: () => void;
  hidePopover?: () => void;
};

const ACTIVE = 'data-active-placement';
const MARGIN = 'data-postkit-margin';

function px(value: string, fallback: number): number {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/**
 * Creates the footnotes behaviour. Plain TypeScript and DOM, with no Zag
 * dependency (decision D7): call `start()` once the list and its references
 * are in the document, and `stop()` to remove every listener and attribute
 * it added.
 */
export function createFootnotes(
  options: FootnotesBehaviorOptions,
): FootnotesBehavior {
  const { root } = options;
  const document = root.ownerDocument;
  const win = document.defaultView as (Window & typeof globalThis) | null;
  const listeners = new Set<() => void>();
  const cleanups: (() => void)[] = [];
  let notes: Note[] = [];
  let placement: PostkitFootnotePlacement = 'end';
  let intended: PostkitFootnotePlacement = 'end';
  let open: number | undefined;
  let running = false;
  let frame: number | undefined;

  const container = () => options.container ?? root.parentElement ?? root;

  const notify = () => {
    if (running) for (const listener of [...listeners]) listener();
  };

  const reducedMotion = () =>
    win?.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

  const collect = (): Note[] =>
    Array.from(
      root.querySelectorAll<HTMLElement>(
        '[data-postkit-part="item"][data-footnote-index]',
      ),
    ).map((item) => {
      const index = Number(item.getAttribute('data-footnote-index'));
      const count = Math.max(
        1,
        Number(item.getAttribute('data-footnote-references') ?? '1') || 1,
      );
      const ids = postkitFootnoteIds(index, options.scope);
      const references = Array.from({ length: count }, (_, position) =>
        document.getElementById(ids.reference(position + 1)),
      ).filter((element): element is HTMLElement => element !== null);
      return {
        index,
        item,
        references,
        sidenote: document.getElementById(ids.sidenote),
      };
    });

  const markerOf = (reference: HTMLElement | undefined) =>
    reference?.querySelector<HTMLElement>('[data-postkit-part="marker"]') ??
    null;

  const noteFor = (element: Element): Note | undefined =>
    notes.find(
      (note) =>
        note.sidenote?.contains(element) ||
        note.references.some((reference) => reference.contains(element)),
    );

  const sidenoteSize = () => {
    const style = win?.getComputedStyle(root);
    return {
      width: px(style?.getPropertyValue('--postkit-sidenote-width') ?? '', 232),
      gap: px(style?.getPropertyValue('--postkit-sidenote-gap') ?? '', 48),
    };
  };

  /** Whether the margin beside the text column has room for sidenotes. */
  const marginFits = (): boolean => {
    if (!win) return true;
    const { width, gap } = sidenoteSize();
    const column = container().getBoundingClientRect();
    if (column.width === 0 && column.right === 0) return true; // No layout.
    return win.innerWidth - column.right >= width + gap;
  };

  /**
   * Whether the notes and Asides, stacked in the margin, end before the
   * article would with end notes (`end`, its bottom then). When they'd run
   * past it, the margin has run out.
   */
  const marginHolds = (end: number): boolean => {
    const column = container().getBoundingClientRect();
    if (column.height === 0) return true; // No layout to measure.
    const boxes = [
      ...notes.flatMap((note) => {
        const anchor = note.references[0];
        if (!note.sidenote || !anchor) return [];
        return [{ anchor, box: note.sidenote }];
      }),
      ...Array.from(
        container().querySelectorAll<HTMLElement>(
          '[data-postkit-component="Aside"]',
        ),
      ).map((aside) => ({ anchor: aside, box: aside })),
    ]
      .map(({ anchor, box }) => ({
        top: anchor.getBoundingClientRect().top,
        height: box.getBoundingClientRect().height,
      }))
      .sort((first, second) => first.top - second.top);
    if (boxes.length === 0) return true;
    const tops = layoutPostkitSidenotes(boxes, { gap: 16 });
    const last = boxes.length - 1;
    return (
      (tops[last] ?? 0) + (boxes[last]?.height ?? 0) <=
      Math.max(end, column.bottom) + 1
    );
  };

  const setMarker = (note: Note, expanded: boolean | undefined) => {
    for (const reference of note.references) {
      const marker = markerOf(reference);
      if (!marker) continue;
      if (expanded === undefined) {
        marker.removeAttribute('aria-expanded');
        marker.removeAttribute('aria-controls');
      } else {
        marker.setAttribute('aria-expanded', String(expanded));
        if (note.sidenote) {
          marker.setAttribute('aria-controls', note.sidenote.id);
        }
      }
    }
  };

  /** Where a note opened under its paragraph came from, to put it back. */
  const homes = new Map<HTMLElement, { parent: Node; next: Node | null }>();

  const restore = (sidenote: HTMLElement) => {
    const home = homes.get(sidenote);
    if (!home) return;
    homes.delete(sidenote);
    home.parent.insertBefore(
      sidenote,
      home.next?.parentNode === home.parent ? home.next : null,
    );
  };

  /**
   * Shows or hides a note's copy. `under` opens it under the paragraph that
   * holds its reference (inline), so the sentence isn't split; hiding puts
   * it back beside the reference.
   */
  const showSidenote = (note: Note, visible: boolean, under = false) => {
    const sidenote = note.sidenote as PopoverElement | null;
    if (!sidenote) return;
    if (!visible || !under) restore(sidenote);
    const block = under
      ? note.references[0]?.closest(
          'p, li, dd, td, th, blockquote, h1, h2, h3, h4, h5, h6',
        )
      : null;
    if (visible && block?.parentNode && !homes.has(sidenote)) {
      homes.set(sidenote, {
        parent: sidenote.parentNode as Node,
        next: sidenote.nextSibling,
      });
      block.parentNode.insertBefore(sidenote, block.nextSibling);
    }
    sidenote.hidden = !visible;
    if (visible) sidenote.setAttribute('data-open', '');
    else sidenote.removeAttribute('data-open');
  };

  /** Applies a placement to every part, without measuring. */
  const apply = (next: PostkitFootnotePlacement) => {
    root.setAttribute(ACTIVE, next);
    if (next === 'side') container().setAttribute(MARGIN, 'side');
    else container().removeAttribute(MARGIN);
    for (const note of notes) {
      for (const reference of note.references) {
        reference.setAttribute(ACTIVE, next);
      }
      const sidenote = note.sidenote as PopoverElement | null;
      if (!sidenote) continue;
      sidenote.setAttribute(ACTIVE, next);
      // Only a note opened in place needs its own close button.
      const close = sidenote.querySelector<HTMLElement>(
        '[data-postkit-sidenote-close]',
      );
      if (close) close.hidden = next !== 'inline';
      if (next === 'popover') {
        sidenote.setAttribute('popover', 'auto');
        sidenote.hidden = false;
        sidenote.removeAttribute('data-open');
      } else {
        if (sidenote.hasAttribute('popover')) {
          try {
            sidenote.hidePopover?.();
          } catch {
            // Already closed.
          }
          sidenote.removeAttribute('popover');
        }
        showSidenote(note, next === 'side');
      }
      setMarker(
        note,
        next === 'popover' || next === 'inline' ? false : undefined,
      );
    }
    open = undefined;
  };

  const update = () => {
    if (!running) return;
    const width = win?.innerWidth ?? 0;
    const sideBreakpoint =
      options.sideBreakpoint ?? postkitDefaultSideBreakpoint;
    intended = resolvePostkitFootnotePlacement(options.placement, {
      width,
      breakpoints: options.breakpoints,
      sideBreakpoint: 0,
    });
    let next = resolvePostkitFootnotePlacement(options.placement, {
      width,
      breakpoints: options.breakpoints,
      sideBreakpoint,
      marginFits: intended === 'side' ? marginFits() : true,
    });
    if (next === 'side') {
      // Measure the article with end notes, then the stacked column.
      apply('end');
      const end = container().getBoundingClientRect().bottom;
      apply('side');
      if (!marginHolds(end)) next = 'end';
    }
    if (root.getAttribute(ACTIVE) !== next) apply(next);
    if (next !== placement) {
      placement = next;
      options.onPlacementChange?.({ placement });
      notify();
    }
  };

  const scheduleUpdate = () => {
    if (!win || frame !== undefined) return;
    frame = win.requestAnimationFrame(() => {
      frame = undefined;
      update();
    });
  };

  const focus = (element: HTMLElement | null) => {
    if (!element) return;
    element.focus({ preventScroll: true });
    element.scrollIntoView?.({
      block: 'nearest',
      behavior: reducedMotion() ? 'auto' : 'smooth',
    });
  };

  const target = (note: Note | undefined) => {
    for (const other of notes) other.item.removeAttribute('data-targeted');
    note?.item.setAttribute('data-targeted', '');
  };

  const openNote = (index: number, from?: HTMLElement) => {
    const note = notes.find((entry) => entry.index === index);
    if (!note?.sidenote) return;
    if (open !== undefined && open !== index) closeNote(false);
    const sidenote = note.sidenote as PopoverElement;
    if (placement === 'popover') {
      const marker = from ?? markerOf(note.references[0]);
      if (marker && win) {
        const rect = marker.getBoundingClientRect();
        sidenote.style.setProperty('position', 'fixed');
        sidenote.style.setProperty('inset', 'auto');
        sidenote.style.setProperty('margin', '0');
        sidenote.style.setProperty('top', `${Math.round(rect.bottom + 6)}px`);
        sidenote.style.setProperty(
          'left',
          `${Math.round(
            Math.max(
              8,
              Math.min(
                rect.left - 12,
                win.innerWidth - sidenoteSize().width - 8,
              ),
            ),
          )}px`,
        );
      }
      try {
        sidenote.showPopover?.();
      } catch {
        // Not connected or already open.
      }
      sidenote.setAttribute('data-open', '');
    } else if (placement === 'inline') {
      showSidenote(note, true, true);
    } else {
      return;
    }
    setMarker(note, true);
    open = index;
    notify();
  };

  const closeNote = (returnFocus = true) => {
    const note = notes.find((entry) => entry.index === open);
    if (!note) return;
    const sidenote = note.sidenote as PopoverElement | null;
    if (sidenote?.hasAttribute('popover')) {
      try {
        sidenote.hidePopover?.();
      } catch {
        // Already closed.
      }
      sidenote.removeAttribute('data-open');
    } else if (note.sidenote) {
      showSidenote(note, false);
    }
    setMarker(note, false);
    open = undefined;
    if (returnFocus) markerOf(note.references[0])?.focus();
    notify();
  };

  const onClick = (event: MouseEvent) => {
    const element = event.target as Element | null;
    if (!element || event.defaultPrevented || event.button !== 0) return;
    const close = element.closest('[data-postkit-sidenote-close]');
    if (close && noteFor(close)) {
      event.preventDefault();
      closeNote();
      return;
    }
    const marker = element.closest<HTMLElement>('[data-postkit-part="marker"]');
    const note = marker && noteFor(marker);
    if (marker && note) {
      if (placement === 'popover' || placement === 'inline') {
        event.preventDefault();
        if (open === note.index) closeNote(false);
        else openNote(note.index, marker);
        return;
      }
      if (placement === 'side' && note.sidenote) {
        event.preventDefault();
        note.sidenote.tabIndex = -1;
        focus(note.sidenote);
        return;
      }
      // End notes: the link jumps; focus and the tint follow it.
      win?.requestAnimationFrame(() => {
        target(note);
        focus(note.item);
      });
      return;
    }
    const backlink = element.closest<HTMLAnchorElement>('a[href^="#"]');
    if (backlink && root.contains(backlink)) {
      const id = decodeURIComponent(
        backlink.getAttribute('href')?.slice(1) ?? '',
      );
      const reference = notes
        .flatMap((entry) => entry.references)
        .find((candidate) => candidate.id === id);
      if (!reference) return;
      // The reader returns: the tint clears and focus goes back to the mark.
      win?.requestAnimationFrame(() => {
        target(undefined);
        focus(markerOf(reference));
      });
    }
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Escape' || open === undefined) return;
    const element = event.target as Element | null;
    if (element && noteFor(element)) {
      event.preventDefault();
      closeNote();
    }
  };

  const highlight = (event: Event, on: boolean) => {
    const element = event.target as Element | null;
    const note = element && noteFor(element);
    if (!note) return;
    for (const part of [...note.references, note.sidenote]) {
      if (!part) continue;
      if (on) part.setAttribute('data-highlighted', '');
      else part.removeAttribute('data-highlighted');
    }
  };

  const onToggle = (event: Event) => {
    const toggle = event as Event & { newState?: string };
    const note = notes.find((entry) => entry.sidenote === event.target);
    if (!note || toggle.newState !== 'closed' || open !== note.index) return;
    // Light dismiss or Escape closed the popover.
    note.sidenote?.removeAttribute('data-open');
    setMarker(note, false);
    open = undefined;
    notify();
  };

  const listen = <K extends keyof DocumentEventMap>(
    target: Document | HTMLElement,
    type: K,
    handler: (event: DocumentEventMap[K]) => void,
    capture = false,
  ) => {
    target.addEventListener(type, handler as EventListener, capture);
    cleanups.push(() =>
      target.removeEventListener(type, handler as EventListener, capture),
    );
  };

  return {
    get api(): FootnotesBehaviorApi {
      return {
        placement,
        intended,
        open,
        openNote: (index) => openNote(index),
        closeNote: () => closeNote(),
        refresh: () => update(),
      };
    },
    start() {
      if (running) return;
      running = true;
      notes = collect();
      for (const note of notes) note.item.tabIndex = -1;
      listen(document, 'click', onClick);
      listen(document, 'keydown', onKeyDown);
      listen(document, 'pointerover', (event) => highlight(event, true));
      listen(document, 'pointerout', (event) => highlight(event, false));
      listen(document, 'focusin', (event) => highlight(event, true));
      listen(document, 'focusout', (event) => highlight(event, false));
      for (const note of notes) {
        if (note.sidenote) {
          const sidenote = note.sidenote;
          sidenote.addEventListener('toggle', onToggle);
          cleanups.push(() => sidenote.removeEventListener('toggle', onToggle));
        }
      }
      if (win) {
        win.addEventListener('resize', scheduleUpdate);
        cleanups.push(() => win.removeEventListener('resize', scheduleUpdate));
        if (typeof win.ResizeObserver === 'function') {
          const observer = new win.ResizeObserver(scheduleUpdate);
          observer.observe(container());
          cleanups.push(() => observer.disconnect());
        }
      }
      placement = 'end';
      root.removeAttribute(ACTIVE);
      update();
    },
    stop() {
      if (!running) return;
      running = false;
      if (frame !== undefined) win?.cancelAnimationFrame(frame);
      frame = undefined;
      for (const cleanup of cleanups.splice(0)) cleanup();
      root.removeAttribute(ACTIVE);
      container().removeAttribute(MARGIN);
      for (const note of notes) {
        note.item.removeAttribute('data-targeted');
        for (const reference of note.references) {
          reference.removeAttribute(ACTIVE);
        }
        setMarker(note, undefined);
        const sidenote = note.sidenote;
        if (sidenote) {
          restore(sidenote);
          sidenote.removeAttribute(ACTIVE);
          sidenote.removeAttribute('popover');
          sidenote.removeAttribute('data-open');
          sidenote.hidden = true;
        }
      }
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

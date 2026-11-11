import {
  postkitFootnoteIds,
  type PostkitFootnotePlacementValue,
} from '../../components/footnote/footnote.model.js';
import {
  check,
  checkEqual,
  click,
  keyDown,
  type BehaviorDriver,
  type BehaviorSpec,
} from '../testing/harness.js';
import { installBehaviorEnvironment } from '../testing/environment.js';

/** One note in the shared spec's article. */
export interface FootnotesBehaviorNote {
  /** The note's text. */
  readonly text: string;
  /** How many times the text references it. */
  readonly references: number;
}

/**
 * What a footnotes renderer draws for the shared spec: a paragraph per
 * reference, in note order (note 1's references, then note 2's, …), each
 * with a `Footnote` (the first reference to a note carries its text, for the
 * sidenote), then the `Footnotes` list, all in one container.
 */
export interface FootnotesBehaviorFixture {
  readonly placement: PostkitFootnotePlacementValue;
  readonly sideBreakpoint?: number;
  readonly scope: string;
  readonly notes: readonly FootnotesBehaviorNote[];
}

const notes: readonly FootnotesBehaviorNote[] = [
  { text: 'Markdown with directives, or MDX.', references: 2 },
  { text: 'Headless, Chakra, email or web components.', references: 1 },
];

function setWidth(width: number): void {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    writable: true,
    value: width,
  });
}

function parts(root: Element, scope: string, index: number) {
  const ids = postkitFootnoteIds(index, scope);
  const byId = (id: string) => root.ownerDocument.getElementById(id);
  const reference = (occurrence = 1) => byId(ids.reference(occurrence));
  const marker = (occurrence = 1) => {
    const element = reference(occurrence)?.querySelector<HTMLElement>(
      '[data-postkit-part="marker"]',
    );
    check(element, `Note ${index} has a marker for reference ${occurrence}`);
    return element;
  };
  const item = () => {
    const element = byId(ids.note);
    check(element, `Note ${index} is in the end list`);
    return element;
  };
  const sidenote = () => {
    const element = byId(ids.sidenote);
    check(element, `Note ${index} has a sidenote copy`);
    return element;
  };
  const backlink = (occurrence = 1) => {
    const element = item().querySelector<HTMLElement>(
      `a[href="#${ids.reference(occurrence)}"]`,
    );
    check(element, `Note ${index} links back to reference ${occurrence}`);
    return element;
  };
  return { ids, reference, marker, item, sidenote, backlink };
}

function list(root: Element): HTMLElement {
  const element = root.querySelector<HTMLElement>(
    '[data-postkit-component="Footnotes"]',
  );
  check(element, 'The Footnotes list renders');
  return element;
}

function active(root: Element): string | null {
  return list(root).getAttribute('data-active-placement');
}

/**
 * The shared footnotes spec (03 §7.1). Every renderer passes it:
 *
 * - end notes: a mark moves focus to its note and tints it until the reader
 *   returns with ↩, which moves focus back to the mark;
 * - shared notes link back to each reference (a, b, …);
 * - responsive placement follows the width, and `side` falls back to `end`
 *   below `sideBreakpoint` or when the margin has no room;
 * - `inline` and `popover` open the note in place and keep the end list;
 * - hovering or focusing a mark or its sidenote tints both.
 */
export function footnotesBehaviorSpec(
  driver: BehaviorDriver<FootnotesBehaviorFixture>,
): BehaviorSpec {
  const run =
    (
      overrides: Partial<FootnotesBehaviorFixture>,
      body: (root: Element, fixture: FootnotesBehaviorFixture) => Promise<void>,
      width = 1440,
    ) =>
    async () => {
      const restore = installBehaviorEnvironment();
      const previousWidth = window.innerWidth;
      setWidth(width);
      const fixture: FootnotesBehaviorFixture = {
        placement: 'end',
        scope: 'spec',
        notes,
        ...overrides,
      };
      try {
        await body(await driver.render(fixture), fixture);
      } finally {
        await driver.cleanup();
        setWidth(previousWidth);
        restore();
      }
    };

  const resize = (width: number) =>
    driver.interact(() => {
      setWidth(width);
      window.dispatchEvent(new Event('resize'));
    });

  return {
    behavior: 'Footnotes',
    cases: [
      {
        name: 'end notes: a mark focuses and tints its note; ↩ returns focus and clears the tint',
        run: run({ placement: 'end' }, async (root, { scope }) => {
          const first = parts(root, scope, 1);
          await driver.waitFor(() =>
            checkEqual(active(root), 'end', 'Placement'),
          );
          checkEqual(
            first.marker().getAttribute('href'),
            `#${first.ids.note}`,
            'The mark links to its note',
          );
          const copy = root.ownerDocument.getElementById(first.ids.sidenote);
          check(
            !copy || copy.hidden,
            'End notes leave out or hide the sidenote copy',
          );
          await driver.interact(() => click(first.marker()));
          await driver.waitFor(() => {
            checkEqual(
              root.ownerDocument.activeElement,
              first.item(),
              'Focus moves to the note',
            );
            check(
              first.item().hasAttribute('data-targeted'),
              'The jumped-to note is tinted',
            );
          });
          await driver.interact(() => click(first.backlink(2)));
          await driver.waitFor(() => {
            checkEqual(
              root.ownerDocument.activeElement,
              first.marker(2),
              'Focus returns to the second mark',
            );
            check(
              !first.item().hasAttribute('data-targeted'),
              'Returning clears the tint',
            );
          });
        }),
      },
      {
        name: 'numbers notes by first reference and links a shared note back to each mark',
        run: run({}, async (root, { scope }) => {
          const first = parts(root, scope, 1);
          const second = parts(root, scope, 2);
          checkEqual(first.marker().textContent?.trim(), '1', 'The first mark');
          checkEqual(
            second.marker().textContent?.trim(),
            '2',
            'The second note’s mark',
          );
          checkEqual(
            first.item().getAttribute('data-footnote-references'),
            '2',
            'The shared note counts its references',
          );
          checkEqual(
            first.backlink(1).textContent?.trim(),
            'a',
            'The first backlink',
          );
          checkEqual(
            first.backlink(2).textContent?.trim(),
            'b',
            'The second backlink',
          );
          checkEqual(
            second.backlink().textContent?.trim(),
            '↩',
            'A single backlink',
          );
        }),
      },
      {
        name: 'follows a responsive placement as the width changes',
        run: run(
          { placement: { base: 'inline', md: 'end', xl: 'side' } },
          async (root, { scope }) => {
            const first = parts(root, scope, 1);
            await driver.waitFor(() =>
              checkEqual(active(root), 'inline', 'At 390px'),
            );
            await resize(900);
            await driver.waitFor(() =>
              checkEqual(active(root), 'end', 'At 900px'),
            );
            await resize(1440);
            await driver.waitFor(() => {
              checkEqual(active(root), 'side', 'At 1440px');
              check(!first.sidenote().hidden, 'Side shows the sidenote');
              checkEqual(
                first.reference()?.getAttribute('data-active-placement'),
                'side',
                'The reference knows the placement',
              );
            });
          },
          390,
        ),
      },
      {
        name: 'side falls back to end below sideBreakpoint',
        run: run(
          { placement: 'side', sideBreakpoint: 1024 },
          async (root, { scope }) => {
            await driver.waitFor(() =>
              checkEqual(active(root), 'end', 'Below the breakpoint'),
            );
            check(
              parts(root, scope, 1).sidenote().hidden,
              'The sidenote stays hidden',
            );
            await resize(1100);
            await driver.waitFor(() =>
              checkEqual(active(root), 'side', 'Above the breakpoint'),
            );
          },
          900,
        ),
      },
      {
        name: 'side falls back to end when the margin runs out',
        run: run({ placement: 'side' }, async (root) => {
          await driver.waitFor(() =>
            checkEqual(active(root), 'side', 'With room in the margin'),
          );
          const prototype = window.Element.prototype;
          const original = prototype.getBoundingClientRect;
          // The text column ends 100px from the window's edge: no room for a
          // 232px column and its 48px gap.
          prototype.getBoundingClientRect = function () {
            return {
              x: 400,
              y: 0,
              left: 400,
              top: 0,
              right: 1340,
              bottom: 2000,
              width: 940,
              height: 2000,
              toJSON: () => ({}),
            } as DOMRect;
          };
          try {
            await resize(1440);
            await driver.waitFor(() =>
              checkEqual(active(root), 'end', 'Without room in the margin'),
            );
          } finally {
            prototype.getBoundingClientRect = original;
          }
        }),
      },
      {
        name: 'inline opens the note in place, keeps the end list, and Escape closes it',
        run: run({ placement: 'inline' }, async (root, { scope }) => {
          const first = parts(root, scope, 1);
          await driver.waitFor(() =>
            checkEqual(active(root), 'inline', 'Placement'),
          );
          check(!first.item().hidden, 'The end list stays');
          checkEqual(
            first.marker().getAttribute('aria-expanded'),
            'false',
            'The mark is a closed toggle',
          );
          await driver.interact(() => click(first.marker()));
          await driver.waitFor(() => {
            check(!first.sidenote().hidden, 'The note opens in place');
            checkEqual(
              first.marker().getAttribute('aria-expanded'),
              'true',
              'The mark is expanded',
            );
            checkEqual(
              first.marker().getAttribute('aria-controls'),
              first.ids.sidenote,
              'The mark controls the note',
            );
          });
          first.marker().focus();
          await driver.interact(() => keyDown(first.marker(), 'Escape'));
          await driver.waitFor(() => {
            check(first.sidenote().hidden, 'Escape closes the note');
            checkEqual(
              root.ownerDocument.activeElement,
              first.marker(),
              'Focus stays on the mark',
            );
          });
        }),
      },
      {
        name: 'popover opens a native popover anchored to the mark and keeps the end list',
        run: run({ placement: 'popover' }, async (root, { scope }) => {
          const first = parts(root, scope, 1);
          await driver.waitFor(() => {
            checkEqual(active(root), 'popover', 'Placement');
            checkEqual(
              first.sidenote().getAttribute('popover'),
              'auto',
              'The note is a native popover',
            );
          });
          check(!first.item().hidden, 'The end list stays');
          await driver.interact(() => click(first.marker()));
          await driver.waitFor(() => {
            check(
              first.sidenote().hasAttribute('data-open'),
              'The popover opens',
            );
            checkEqual(
              first.marker().getAttribute('aria-expanded'),
              'true',
              'The mark is expanded',
            );
          });
        }),
      },
      {
        name: 'hovering or focusing either half of a sidenote tints both',
        run: run({ placement: 'side' }, async (root, { scope }) => {
          const first = parts(root, scope, 1);
          await driver.waitFor(() => checkEqual(active(root), 'side', 'Side'));
          await driver.interact(() => first.marker().focus());
          await driver.waitFor(() => {
            check(
              first.reference()?.hasAttribute('data-highlighted'),
              'The reference is tinted',
            );
            check(
              first.sidenote().hasAttribute('data-highlighted'),
              'The sidenote is tinted',
            );
          });
          await driver.interact(() => first.marker().blur());
          await driver.waitFor(() =>
            check(
              !first.sidenote().hasAttribute('data-highlighted'),
              'The tint clears',
            ),
          );
        }),
      },
    ],
  };
}

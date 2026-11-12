import {
  accessibleName,
  byId,
  check,
  checkEqual,
  click,
  keyDown,
  visibleText,
  type BehaviorDriver,
  type BehaviorSpec,
} from '../testing/harness.js';
import { installBehaviorEnvironment } from '../testing/environment.js';

/** What a carousel renderer draws for the shared spec. */
export interface CarouselBehaviorFixture {
  /** The carousel's accessible name. */
  readonly label: string;
  /** One title per slide. */
  readonly slides: readonly string[];
  /** A number, or a string from a Markdown directive. */
  readonly initialIndex?: number | string;
}

const fixture: CarouselBehaviorFixture = {
  label: 'Launch photos',
  slides: ['Harbour at dawn', 'Crowd at noon', 'Fireworks at night'],
};

const PROGRESS = /^(\d+) \/ (\d+)$/;

function parts(root: Element) {
  const region = root.matches('[aria-roledescription="carousel"]')
    ? root
    : root.querySelector('[aria-roledescription="carousel"]');
  check(region, 'The carousel has aria-roledescription="carousel"');
  const slides = Array.from(
    region.querySelectorAll<HTMLElement>('[aria-roledescription="slide"]'),
  );
  const triggers = Array.from(
    region.querySelectorAll<HTMLButtonElement>('button[aria-controls]'),
  );
  const previous = triggers.find((button) =>
    /previous/i.test(accessibleName(button)),
  );
  const next = triggers.find((button) => /next/i.test(accessibleName(button)));
  check(previous, 'The carousel has a previous-slide button');
  check(next, 'The carousel has a next-slide button');
  const viewport = byId(region, next.getAttribute('aria-controls'));
  check(viewport, 'The slide buttons control the slide viewport by id');
  const progress = Array.from(region.querySelectorAll('[aria-live]')).find(
    (element) => PROGRESS.test(visibleText(element)),
  );
  return { region, slides, previous, next, viewport, progress };
}

function expectPage(root: Element, index: number): void {
  const { slides, progress, previous, next } = parts(root);
  check(progress, 'A live region announces the page as "n / total"');
  checkEqual(
    visibleText(progress),
    `${index + 1} / ${fixture.slides.length}`,
    'Progress text',
  );
  slides.forEach((slide, slideIndex) => {
    checkEqual(
      slide.getAttribute('aria-hidden'),
      slideIndex === index ? null : 'true',
      `Slide ${slideIndex} aria-hidden`,
    );
  });
  check(
    !previous.disabled && !next.disabled,
    'The buttons wrap, so stay enabled',
  );
}

/**
 * The shared carousel spec: region and slide semantics, the starting page,
 * previous and next buttons that wrap, keyboard paging (arrows, Home, End)
 * from the focused viewport, and `aria-hidden` on slides out of view.
 */
export function carouselBehaviorSpec(
  driver: BehaviorDriver<CarouselBehaviorFixture>,
): BehaviorSpec {
  const run =
    (
      body: (root: Element) => Promise<void>,
      overrides: Partial<CarouselBehaviorFixture> = {},
    ) =>
    async () => {
      const restore = installBehaviorEnvironment();
      try {
        await body(await driver.render({ ...fixture, ...overrides }));
      } finally {
        await driver.cleanup();
        restore();
      }
    };

  const waitForPage = (root: Element, index: number) =>
    driver.waitFor(() => expectPage(root, index));

  return {
    behavior: 'Carousel',
    cases: [
      {
        name: 'is a labelled region of labelled slides',
        run: run(async (root) => {
          const { region, slides, viewport } = parts(root);
          checkEqual(region.getAttribute('role'), 'region', 'Carousel role');
          checkEqual(accessibleName(region), fixture.label, 'Carousel label');
          checkEqual(
            slides.length,
            fixture.slides.length,
            'One slide per item',
          );
          slides.forEach((slide, index) => {
            checkEqual(
              slide.getAttribute('role'),
              'group',
              `Slide ${index} role`,
            );
            checkEqual(
              slide.getAttribute('aria-label'),
              `${index + 1} of ${fixture.slides.length}`,
              `Slide ${index} label`,
            );
            check(
              visibleText(slide).includes(fixture.slides[index] ?? ''),
              `Slide ${index} shows its content`,
            );
          });
          check(
            slides.every((slide) => viewport.contains(slide)),
            'The controlled viewport holds the slides',
          );
          await waitForPage(root, 0);
        }),
      },
      {
        name: 'starts on initialIndex, given as a directive string',
        run: run(async (root) => waitForPage(root, 1), { initialIndex: '1' }),
      },
      {
        name: 'clamps initialIndex to the last slide',
        run: run(async (root) => waitForPage(root, 2), { initialIndex: 99 }),
      },
      {
        name: 'pages with the next and previous buttons, wrapping at both ends',
        run: run(async (root) => {
          await waitForPage(root, 0);
          const step = async (button: 'next' | 'previous', page: number) => {
            await driver.interact(() => click(parts(root)[button]));
            await waitForPage(root, page);
          };
          await step('next', 1);
          await step('next', 2);
          await step('next', 0);
          await step('previous', 2);
          await step('previous', 1);
        }),
      },
      {
        name: 'pages with arrow keys, Home and End while the viewport has focus',
        run: run(async (root) => {
          await waitForPage(root, 0);
          const { viewport } = parts(root);
          await driver.waitFor(() =>
            checkEqual(
              viewport.getAttribute('tabindex'),
              '0',
              'A viewport without focusable content is focusable',
            ),
          );
          await driver.interact(() => viewport.focus());
          const press = async (key: string, page: number) => {
            await driver.interact(() => keyDown(viewport, key));
            await waitForPage(root, page);
          };
          await press('ArrowRight', 1);
          await press('End', 2);
          await press('ArrowRight', 0);
          await press('ArrowLeft', 2);
          await press('Home', 0);
        }),
      },
    ],
  };
}

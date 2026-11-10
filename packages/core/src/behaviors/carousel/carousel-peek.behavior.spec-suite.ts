import {
  accessibleName,
  check,
  checkEqual,
  click,
  keyDown,
  visibleText,
  type BehaviorDriver,
  type BehaviorSpec,
} from '../testing/harness.js';
import { installBehaviorEnvironment } from '../testing/environment.js';

/** What a peek carousel renderer draws for the shared spec. */
export interface CarouselPeekBehaviorFixture {
  /** The carousel's accessible name. */
  readonly label: string;
  /** One title per slide. */
  readonly slides: readonly string[];
  /** One caption per slide, shown below the current one. */
  readonly captions: readonly string[];
}

const fixture: CarouselPeekBehaviorFixture = {
  label: 'Entry media',
  slides: ['Launcher', 'Zones', 'Attention'],
  captions: [
    'The launcher, searching live sessions.',
    'Zones holding their layout across two displays.',
    'Agent attention: the one session that needs you.',
  ],
};

const PROGRESS = /^\d+ \/ \d+$/;

function parts(root: Element) {
  const region = root.matches('[aria-roledescription="carousel"]')
    ? root
    : root.querySelector('[aria-roledescription="carousel"]');
  check(region, 'The carousel has aria-roledescription="carousel"');
  const slides = Array.from(
    region.querySelectorAll<HTMLElement>('[aria-roledescription="slide"]'),
  );
  const buttons = Array.from(region.querySelectorAll('button'));
  const previous = buttons.find((button) =>
    /previous/i.test(accessibleName(button)),
  );
  const next = buttons.find((button) => /next/i.test(accessibleName(button)));
  check(previous, 'The carousel has a previous-slide arrow');
  check(next, 'The carousel has a next-slide arrow');
  const viewport = region.ownerDocument.getElementById(
    next.getAttribute('aria-controls') ?? '',
  );
  check(viewport, 'The arrows control the slide viewport by id');
  const caption = Array.from(
    region.querySelectorAll('[aria-live="polite"]'),
  ).find((element) =>
    fixture.captions.some((text) => visibleText(element).includes(text)),
  );
  return { region, slides, buttons, previous, next, viewport, caption };
}

function expectCurrent(root: Element, index: number): void {
  const { slides, caption } = parts(root);
  check(caption, 'A polite live region shows the current caption');
  checkEqual(
    visibleText(caption).includes(fixture.captions[index] ?? ''),
    true,
    `The caption is slide ${index}'s`,
  );
  slides.forEach((slide, slideIndex) => {
    checkEqual(
      slide.getAttribute('aria-hidden'),
      slideIndex === index ? null : 'true',
      `Slide ${slideIndex} aria-hidden (neighbours are hidden)`,
    );
  });
}

/**
 * The shared spec for `Carousel` `presentation: 'peek'` (03 §7): a labelled
 * region whose neighbours are hidden from assistive technology, arrows only
 * (no position counter, indicators or autoplay control), the current
 * caption in a polite live region, wrapping arrows and arrow keys, and no
 * auto-advance.
 */
export function carouselPeekBehaviorSpec(
  driver: BehaviorDriver<CarouselPeekBehaviorFixture>,
): BehaviorSpec {
  const run = (body: (root: Element) => Promise<void>) => async () => {
    const restore = installBehaviorEnvironment();
    try {
      await body(await driver.render(fixture));
    } finally {
      await driver.cleanup();
      restore();
    }
  };

  const waitForCurrent = (root: Element, index: number) =>
    driver.waitFor(() => expectCurrent(root, index));

  return {
    behavior: 'Carousel (peek)',
    cases: [
      {
        name: 'is a labelled region whose neighbours are hidden',
        run: run(async (root) => {
          const { region, slides } = parts(root);
          checkEqual(region.getAttribute('role'), 'region', 'Carousel role');
          checkEqual(accessibleName(region), fixture.label, 'Carousel label');
          checkEqual(slides.length, fixture.slides.length, 'One slide each');
          await waitForCurrent(root, 0);
        }),
      },
      {
        name: 'has arrows only: no counter, indicators or autoplay control',
        run: run(async (root) => {
          await waitForCurrent(root, 0);
          const { region, buttons } = parts(root);
          checkEqual(buttons.length, 2, 'Only the two arrows are buttons');
          check(
            !Array.from(region.querySelectorAll('*')).some((element) =>
              PROGRESS.test(visibleText(element)),
            ),
            'No "n / total" counter is shown',
          );
          check(
            !region.querySelector(
              '[data-part="indicator"], [data-part="autoplay-trigger"]',
            ),
            'No indicators or autoplay control',
          );
        }),
      },
      {
        name: 'announces the caption as the arrows page, wrapping at both ends',
        run: run(async (root) => {
          await waitForCurrent(root, 0);
          const step = async (button: 'next' | 'previous', index: number) => {
            await driver.interact(() => click(parts(root)[button]));
            await waitForCurrent(root, index);
          };
          await step('next', 1);
          await step('next', 2);
          await step('next', 0);
          await step('previous', 2);
        }),
      },
      {
        name: 'pages with the arrow keys while the viewport has focus',
        run: run(async (root) => {
          await waitForCurrent(root, 0);
          const { viewport } = parts(root);
          await driver.interact(() => viewport.focus());
          await driver.interact(() => keyDown(viewport, 'ArrowRight'));
          await waitForCurrent(root, 1);
          await driver.interact(() => keyDown(viewport, 'ArrowLeft'));
          await waitForCurrent(root, 0);
        }),
      },
      {
        name: 'never advances on its own',
        run: run(async (root) => {
          await waitForCurrent(root, 0);
          const { viewport } = parts(root);
          check(
            viewport.getAttribute('aria-live') !== 'off',
            'The slides are not autoplaying (Zag turns aria-live off while it plays)',
          );
          await new Promise((resolve) => setTimeout(resolve, 300));
          expectCurrent(root, 0);
        }),
      },
    ],
  };
}

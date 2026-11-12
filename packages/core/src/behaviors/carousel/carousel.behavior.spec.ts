// @vitest-environment jsdom
import { spreadProps } from '../dom.js';
import {
  createBareDriver,
  element,
} from '../testing/bare-driver.spec-support.js';
import { registerBehaviorSpec } from '../testing/harness.js';
import {
  carouselBehaviorSpec,
  type CarouselBehaviorFixture,
} from './carousel.behavior.spec-suite.js';
import {
  carouselProps,
  createCarousel,
  postkitCarouselConfig,
  type CarouselBehaviorApi,
} from './carousel.behavior.js';

let count = 0;

const driver = createBareDriver<CarouselBehaviorFixture, CarouselBehaviorApi>(
  (container, fixture) => {
    const behavior = createCarousel({
      id: `carousel-${(count += 1)}`,
      slideCount: fixture.slides.length,
      initialIndex: fixture.initialIndex,
    });
    const root = element('div');
    const itemGroup = element('div');
    const items = fixture.slides.map((title) => {
      const item = element('div');
      item.append(element('h3', title));
      return item;
    });
    const control = element('div');
    const previous = element('button', 'Previous');
    const progress = element('span');
    const next = element('button', 'Next');
    itemGroup.append(...items);
    control.append(previous, progress, next);
    root.append(itemGroup, control);
    container.append(root);
    return {
      behavior,
      update(api) {
        spreadProps(root, {
          ...api.getRootProps(),
          'aria-label': fixture.label,
        });
        spreadProps(itemGroup, api.getItemGroupProps());
        items.forEach((item, index) =>
          spreadProps(item, api.getItemProps({ index })),
        );
        spreadProps(control, api.getControlProps());
        spreadProps(previous, api.getPrevTriggerProps());
        spreadProps(progress, {
          ...api.getProgressTextProps(),
          'aria-live': 'polite',
        });
        progress.textContent = api.getProgressText();
        spreadProps(next, api.getNextTriggerProps());
      },
    };
  },
);

registerBehaviorSpec(
  carouselBehaviorSpec(driver),
  { describe, it },
  {
    label: 'bare machine',
  },
);

describe('carouselProps', () => {
  it('configures Zag as @postkit/chakra does', () => {
    expect(carouselProps({ id: 'c', slideCount: 3 })).toEqual({
      ...postkitCarouselConfig,
      id: 'c',
      slideCount: 3,
      defaultPage: 0,
    });
  });

  it('clamps and parses initialIndex', () => {
    expect(
      carouselProps({ id: 'c', slideCount: 3, initialIndex: '2' }).defaultPage,
    ).toBe(2);
    expect(
      carouselProps({ id: 'c', slideCount: 3, initialIndex: 9 }).defaultPage,
    ).toBe(2);
    expect(
      carouselProps({ id: 'c', slideCount: 3, initialIndex: -1 }).defaultPage,
    ).toBe(0);
    expect(
      carouselProps({ id: 'c', slideCount: 3, initialIndex: 'x' }).defaultPage,
    ).toBe(0);
  });

  it('passes callbacks and translations through', () => {
    const onPageChange = vi.fn();
    const getRootNode = () => document;
    expect(
      carouselProps({
        id: 'c',
        slideCount: 2,
        onPageChange,
        getRootNode,
        translations: { nextTrigger: 'Forward' },
      }),
    ).toMatchObject({
      onPageChange,
      getRootNode,
      translations: { nextTrigger: 'Forward' },
    });
  });
});

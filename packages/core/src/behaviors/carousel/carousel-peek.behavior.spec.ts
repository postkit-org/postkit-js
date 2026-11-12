// @vitest-environment jsdom
import { spreadProps } from '../dom.js';
import {
  createBareDriver,
  element,
} from '../testing/bare-driver.spec-support.js';
import { registerBehaviorSpec } from '../testing/harness.js';
import {
  carouselPeekBehaviorSpec,
  type CarouselPeekBehaviorFixture,
} from './carousel-peek.behavior.spec-suite.js';
import {
  carouselItemSnapAlign,
  carouselProps,
  createCarousel,
  postkitCarouselPeekConfig,
  type CarouselBehaviorApi,
} from './carousel.behavior.js';

let count = 0;

const driver = createBareDriver<
  CarouselPeekBehaviorFixture,
  CarouselBehaviorApi
>((container, fixture) => {
  const behavior = createCarousel({
    id: `carousel-peek-${(count += 1)}`,
    slideCount: fixture.slides.length,
    presentation: 'peek',
  });
  const root = element('div');
  const itemGroup = element('div');
  const items = fixture.slides.map((title) => {
    const item = element('div');
    item.append(element('h3', title));
    return item;
  });
  const control = element('div');
  const caption = element('p');
  caption.setAttribute('aria-live', 'polite');
  const previous = element('button', '←');
  const next = element('button', '→');
  itemGroup.append(...items);
  control.append(caption, previous, next);
  root.append(itemGroup, control);
  container.append(root);
  return {
    behavior,
    update(api) {
      spreadProps(root, { ...api.getRootProps(), 'aria-label': fixture.label });
      spreadProps(itemGroup, api.getItemGroupProps());
      items.forEach((item, index) =>
        spreadProps(
          item,
          api.getItemProps({ index, snapAlign: carouselItemSnapAlign('peek') }),
        ),
      );
      spreadProps(control, api.getControlProps());
      spreadProps(previous, api.getPrevTriggerProps());
      spreadProps(next, api.getNextTriggerProps());
      caption.textContent = fixture.captions[api.page] ?? '';
    },
  };
});

registerBehaviorSpec(
  carouselPeekBehaviorSpec(driver),
  { describe, it },
  { label: 'bare machine' },
);

describe('carouselProps with presentation: peek', () => {
  it('centres slides with their neighbours in view and never autoplays', () => {
    const props = carouselProps({
      id: 'c',
      slideCount: 3,
      presentation: 'peek',
    });
    expect(props).toEqual({
      ...postkitCarouselPeekConfig,
      id: 'c',
      slideCount: 3,
      defaultPage: 0,
    });
    expect(props).not.toHaveProperty('autoplay');
    expect(carouselItemSnapAlign('peek')).toBe('center');
    expect(carouselItemSnapAlign('slides')).toBe('start');
  });
});

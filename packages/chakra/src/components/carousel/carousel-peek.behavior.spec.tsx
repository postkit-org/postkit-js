import { defaultSystem } from '@chakra-ui/react';
import {
  carouselPeekBehaviorSpec,
  registerBehaviorSpec,
  settle,
  type BehaviorDriver,
  type CarouselPeekBehaviorFixture,
} from '@postkit/core/behaviors/testing';
import { act, cleanup, render, waitFor } from '@testing-library/react';

import { PostkitProvider } from '../../lib/postkit-provider.js';
import { Carousel } from './carousel.js';

/*
 * The shared peek spec (03 §7) against the Chakra Carousel, which keeps
 * Chakra's Ark carousel and must pass the same spec as the bare machine and
 * the headless view.
 */
const driver: BehaviorDriver<CarouselPeekBehaviorFixture> = {
  async render(fixture) {
    const { container } = render(
      <PostkitProvider system={defaultSystem}>
        <Carousel
          presentation="peek"
          label={fixture.label}
          items={fixture.slides.map((title, index) => ({
            title,
            caption: fixture.captions[index],
          }))}
        />
      </PostkitProvider>,
    );
    // Ark starts its machines in a microtask after layout effects.
    await act(async () => {
      await settle();
    });
    return container;
  },
  async interact(action) {
    await act(async () => {
      action();
      await settle();
    });
  },
  waitFor: (assertion, options) =>
    waitFor(assertion, { timeout: options?.timeout ?? 2000 }),
  cleanup: () => cleanup(),
};

registerBehaviorSpec(
  carouselPeekBehaviorSpec(driver),
  { describe, it },
  { label: '@postkit/chakra Carousel' },
);

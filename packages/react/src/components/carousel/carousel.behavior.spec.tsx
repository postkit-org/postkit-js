import {
  carouselBehaviorSpec,
  registerBehaviorSpec,
} from '@postkit/core/behaviors/testing';

import {
  runner,
  testingLibraryDriver,
} from '../../lib/testing-library-driver.spec-support.js';
import { Carousel } from './carousel.js';

registerBehaviorSpec(
  carouselBehaviorSpec(
    testingLibraryDriver((fixture) => (
      <Carousel
        label={fixture.label}
        initialIndex={fixture.initialIndex}
        items={fixture.slides.map((title) => ({ title }))}
      />
    )),
  ),
  runner,
  { label: '@postkit/react Carousel' },
);

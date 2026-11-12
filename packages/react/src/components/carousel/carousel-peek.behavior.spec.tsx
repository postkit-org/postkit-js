import {
  carouselPeekBehaviorSpec,
  registerBehaviorSpec,
} from '@postkit/core/behaviors/testing';

import {
  runner,
  testingLibraryDriver,
} from '../../lib/testing-library-driver.spec-support.js';
import { Carousel } from './carousel.js';

registerBehaviorSpec(
  carouselPeekBehaviorSpec(
    testingLibraryDriver((fixture) => (
      <Carousel
        presentation="peek"
        label={fixture.label}
        items={fixture.slides.map((title, index) => ({
          title,
          caption: fixture.captions[index],
        }))}
      />
    )),
  ),
  runner,
  { label: '@postkit/react Carousel' },
);

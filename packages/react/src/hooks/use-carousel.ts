import {
  carouselMachine,
  carouselProps,
  connectCarousel,
  type CarouselBehaviorOptions,
} from '@postkit/core/behaviors';
import { normalizeProps, useMachine, type PropTypes } from '@zag-js/react';
import { useId } from 'react';

/** Options for {@link useCarousel}: the behaviour's options with an optional id. */
export type UseCarouselOptions = Omit<CarouselBehaviorOptions, 'id'> & {
  /** Defaults to a `useId` value. */
  readonly id?: string;
};

/** The carousel API for React: spread its prop getters onto your elements. */
export type UseCarouselReturn = ReturnType<typeof connectCarousel<PropTypes>>;

/**
 * Postkit's carousel behaviour for React: a thin wrapper over the Zag machine
 * in `@postkit/core/behaviors`, configured as `@postkit/chakra`'s `Carousel`
 * (one slide per page, wrapping, mouse dragging).
 */
export function useCarousel(options: UseCarouselOptions): UseCarouselReturn {
  const generatedId = useId();
  const service = useMachine(
    carouselMachine,
    carouselProps({ ...options, id: options.id ?? generatedId }),
  );
  return connectCarousel(service, normalizeProps);
}

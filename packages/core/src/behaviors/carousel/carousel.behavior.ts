import * as carousel from '@zag-js/carousel';

import {
  clampIndex,
  createMachineBehavior,
  type MachineBehavior,
  type MachineSchemaOf,
} from '../behavior.js';
import type { DomPropTypes } from '../dom.js';

/** Options for Postkit's carousel behaviour. */
export interface CarouselBehaviorOptions {
  /** A unique id; Zag derives every part's id from it. */
  readonly id: string;
  /** The number of slides. */
  readonly slideCount: number;
  /** The first slide shown; clamped to the slides, as the `Carousel` prop is. */
  readonly initialIndex?: number | string;
  /** The root node to query, for shadow DOM hosts. */
  readonly getRootNode?: carousel.Props['getRootNode'];
  /** Called when the page changes. */
  readonly onPageChange?: carousel.Props['onPageChange'];
  /** Overrides for Zag's accessible labels and progress text. */
  readonly translations?: Partial<carousel.IntlTranslations>;
}

/**
 * How Postkit configures the carousel, matching `@postkit/chakra`'s
 * `Carousel`: one slide per page, no gap, wrapping at both ends, and mouse
 * dragging. Peek presentation is a later step.
 */
export const postkitCarouselConfig = Object.freeze({
  slidesPerPage: 1,
  spacing: '0px',
  loop: true,
  allowMouseDrag: true,
} as const);

/** Zag carousel props for Postkit's configuration. */
export function carouselProps(
  options: CarouselBehaviorOptions,
): carousel.Props {
  return {
    ...postkitCarouselConfig,
    id: options.id,
    slideCount: options.slideCount,
    defaultPage: clampIndex(options.initialIndex, options.slideCount),
    ...(options.getRootNode ? { getRootNode: options.getRootNode } : {}),
    ...(options.onPageChange ? { onPageChange: options.onPageChange } : {}),
    ...(options.translations
      ? { translations: options.translations as carousel.IntlTranslations }
      : {}),
  };
}

/** Zag's carousel machine, for framework adapters such as `useMachine`. */
export const carouselMachine: carousel.Machine = carousel.machine;

/** Zag's carousel `connect`, for framework adapters. */
export const connectCarousel = carousel.connect;

/** The carousel's API for framework-free hosts. */
export type CarouselBehaviorApi = carousel.Api<DomPropTypes>;

/** A running carousel behaviour. */
export type CarouselBehavior = MachineBehavior<
  MachineSchemaOf<carousel.Machine>,
  CarouselBehaviorApi
>;

/** Creates Postkit's carousel behaviour without a UI framework. */
export function createCarousel(
  options: CarouselBehaviorOptions,
): CarouselBehavior {
  return createMachineBehavior(
    carousel.machine,
    carousel.connect,
    carouselProps(options),
  );
}

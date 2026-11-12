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
  /**
   * `slides` (the default) shows one slide at a time; `peek` centres it with
   * its neighbours partly in view ({@link postkitCarouselPeekConfig}).
   */
  readonly presentation?: CarouselPresentation;
}

/** How a carousel lays out its slides: the `Carousel` `presentation` prop. */
export type CarouselPresentation = 'peek' | 'slides';

/**
 * How Postkit configures the carousel, matching `@postkit/chakra`'s
 * `Carousel`: one slide per page, no gap, wrapping at both ends, and mouse
 * dragging. {@link postkitCarouselPeekConfig} is the peek presentation.
 */
export const postkitCarouselConfig = Object.freeze({
  slidesPerPage: 1,
  spacing: '0px',
  loop: true,
  allowMouseDrag: true,
} as const);

/**
 * The `peek` presentation (03 §7, from Commune's entry hero): the current
 * slide centred, its neighbours partly in view either side (views fade them
 * to 35%), wrapping arrows, and no autoplay. Slides snap to the centre; pass
 * {@link carouselItemSnapAlign} to `getItemProps`.
 */
export const postkitCarouselPeekConfig = Object.freeze({
  slidesPerPage: 1,
  spacing: '16px',
  padding: '12%',
  loop: true,
  allowMouseDrag: true,
} as const);

/** Where a slide snaps for a presentation: `center` for peek. */
export function carouselItemSnapAlign(
  presentation: CarouselPresentation | undefined,
): 'center' | 'start' {
  return presentation === 'peek' ? 'center' : 'start';
}

/** Zag carousel props for Postkit's configuration. */
export function carouselProps(
  options: CarouselBehaviorOptions,
): carousel.Props {
  return {
    ...(options.presentation === 'peek'
      ? postkitCarouselPeekConfig
      : postkitCarouselConfig),
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

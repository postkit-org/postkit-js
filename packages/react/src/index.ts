/**
 * `@postkit/react`: headless, styleable React views for Postkit components.
 *
 * Views emit the component anatomy (`data-postkit-component`,
 * `data-postkit-part` and state attributes such as `data-tone`) and no styles.
 *
 * @module
 */
export {
  isPostkitDevelopment,
  postkitPartAttributes,
  postkitStateAttributeName,
  resolvePostkitViewState,
  validatePostkitProps,
  warnPostkitProps,
  type PostkitPartAttributes,
  type PostkitViewState,
  type ResolvePostkitViewStateOptions,
} from './lib/anatomy.js';
export {
  postkitView,
  type PostkitChildrenPropsOf,
  type PostkitPartGetter,
  type PostkitPartOptions,
  type PostkitPartProps,
  type PostkitRootProps,
  type PostkitViewComponent,
  type PostkitViewContext,
  type PostkitViewOptions,
  type PostkitViewOwnProps,
  type PostkitViewProps,
} from './lib/view.js';
export { Aside, type AsideProps } from './components/aside/aside.js';
export {
  Callout,
  postkitCalloutMarks,
  type CalloutProps,
  type CalloutSlot,
  type CalloutTone,
} from './components/callout/callout.js';
export {
  Figure,
  postkitImageDimension,
  type FigureProps,
  type FigureSlot,
} from './components/figure/figure.js';
export {
  AppearsOn,
  type AppearsOnProps,
  type AppearsOnService,
  type AppearsOnSlot,
  type SyndicationReference,
} from './components/appears-on/appears-on.js';
export {
  Audio,
  type AudioProps,
  type AudioSlot,
} from './components/audio/audio.js';
export {
  AuthorCard,
  type AuthorCardProps,
  type AuthorCardSlot,
  type AuthorLink,
} from './components/author-card/author-card.js';
export {
  CallToAction,
  type CallToActionProps,
  type CallToActionSlot,
} from './components/call-to-action/call-to-action.js';
export {
  Chart,
  postkitChartLayout,
  type ChartDatum,
  type ChartProps,
  type ChartSeries,
  type ChartSlot,
  type PostkitChartLayout,
  type PostkitChartLayoutSeries,
  type PostkitChartMark,
} from './components/chart/chart.js';
export {
  Video,
  type VideoProps,
  type VideoSlot,
  type VideoTrack,
} from './components/video/video.js';
export { chakraOnly } from './lib/chakra-only.js';

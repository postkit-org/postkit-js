import {
  Aside,
  Audio,
  Callout,
  CallToAction,
  Figure,
  Video,
} from './components.js';

export interface PostkitEmailMdxComponents {
  readonly Aside: typeof Aside;
  readonly Audio: typeof Audio;
  readonly Callout: typeof Callout;
  readonly CallToAction: typeof CallToAction;
  readonly Figure: typeof Figure;
  readonly Video: typeof Video;
}

const defaults = Object.freeze({
  Aside: Aside,
  Audio: Audio,
  Callout: Callout,
  CallToAction: CallToAction,
  Figure: Figure,
  Video: Video,
});

export function createPostkitEmailMdxComponents(): PostkitEmailMdxComponents {
  return { ...defaults };
}

export const postkitEmailMdxComponents: PostkitEmailMdxComponents = defaults;

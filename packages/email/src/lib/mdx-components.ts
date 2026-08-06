import {
  PostkitEmailAside,
  PostkitEmailAudio,
  PostkitEmailCallout,
  PostkitEmailCallToAction,
  PostkitEmailFigure,
  PostkitEmailVideo,
} from './components.js';

export interface PostkitEmailMdxComponents {
  readonly Aside: typeof PostkitEmailAside;
  readonly Audio: typeof PostkitEmailAudio;
  readonly Callout: typeof PostkitEmailCallout;
  readonly CallToAction: typeof PostkitEmailCallToAction;
  readonly Figure: typeof PostkitEmailFigure;
  readonly Video: typeof PostkitEmailVideo;
}

const defaults = Object.freeze({
  Aside: PostkitEmailAside,
  Audio: PostkitEmailAudio,
  Callout: PostkitEmailCallout,
  CallToAction: PostkitEmailCallToAction,
  Figure: PostkitEmailFigure,
  Video: PostkitEmailVideo,
});

export function createPostkitEmailMdxComponents(): PostkitEmailMdxComponents {
  return { ...defaults };
}

export const postkitEmailMdxComponents: PostkitEmailMdxComponents = defaults;

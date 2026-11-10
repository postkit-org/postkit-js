import {
  Aside,
  Audio,
  Callout,
  CallToAction,
  Figure,
  Video,
} from './components.js';
import { KeyTakeaway } from './views/key-takeaway.js';
import { LinkPreview } from './views/link-preview.js';
import { ProductCard } from './views/product-card.js';
import { PullQuote } from './views/pull-quote.js';
import { Stat } from './views/stat.js';
import { Steps } from './views/steps.js';

export interface PostkitEmailMdxComponents {
  readonly Aside: typeof Aside;
  readonly Audio: typeof Audio;
  readonly Callout: typeof Callout;
  readonly CallToAction: typeof CallToAction;
  readonly Figure: typeof Figure;
  readonly KeyTakeaway: typeof KeyTakeaway;
  readonly LinkPreview: typeof LinkPreview;
  readonly ProductCard: typeof ProductCard;
  readonly PullQuote: typeof PullQuote;
  readonly Stat: typeof Stat;
  readonly Steps: typeof Steps;
  readonly Video: typeof Video;
}

const defaults = Object.freeze({
  Aside: Aside,
  Audio: Audio,
  Callout: Callout,
  CallToAction: CallToAction,
  Figure: Figure,
  KeyTakeaway: KeyTakeaway,
  LinkPreview: LinkPreview,
  ProductCard: ProductCard,
  PullQuote: PullQuote,
  Stat: Stat,
  Steps: Steps,
  Video: Video,
});

export function createPostkitEmailMdxComponents(): PostkitEmailMdxComponents {
  return { ...defaults };
}

export const postkitEmailMdxComponents: PostkitEmailMdxComponents = defaults;

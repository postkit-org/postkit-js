import type { ComponentType } from 'react';

import {
  Aside,
  Audio,
  Callout,
  CallToAction,
  Figure,
  Video,
} from './components.js';
import { Footnote, Footnotes } from './footnotes.js';
import { KeyTakeaway } from './views/key-takeaway.js';
import { LinkPreview } from './views/link-preview.js';
import { ProductCard } from './views/product-card.js';
import { PullQuote } from './views/pull-quote.js';
import { Stat } from './views/stat.js';
import { Steps } from './views/steps.js';

/** Any email view: it takes a definition's props plus `children`. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type PostkitEmailView = ComponentType<any>;

/**
 * Every email view `@postkit/email` exports, keyed by definition name. A
 * component in this map is `email: supported` in the manifest; any other
 * uses its definition's declared fallback (03 §6). `renderEmail` renders
 * from it, and `npm run catalog:generate` reads its keys.
 */
export const postkitEmailViews = Object.freeze({
  Aside,
  Audio,
  Callout,
  CallToAction,
  Figure,
  Footnote,
  Footnotes,
  KeyTakeaway,
  LinkPreview,
  ProductCard,
  PullQuote,
  Stat,
  Steps,
  Video,
}) satisfies Readonly<Record<string, PostkitEmailView>>;

/** A component name with an email view. */
export type PostkitEmailViewName = keyof typeof postkitEmailViews;

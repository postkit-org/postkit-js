import type { PostkitAnyComponent } from './config.js';
import { AppearsOn } from '../components/appears-on/appears-on.js';
import { Aside } from '../components/aside/aside.js';
import { AudienceBoundary } from '../components/audience-boundary/audience-boundary.js';
import { Audio } from '../components/audio/audio.js';
import { AuthorCard } from '../components/author-card/author-card.js';
import { CallToAction } from '../components/call-to-action/call-to-action.js';
import { Callout } from '../components/callout/callout.js';
import { CardGrid } from '../components/card-grid/card-grid.js';
import { Chart } from '../components/chart/chart.js';
import { Comparison } from '../components/comparison/comparison.js';
import { Diff } from '../components/diff/diff.js';
import { Disclosure } from '../components/disclosure/disclosure.js';
import { Figure } from '../components/figure/figure.js';
import { FileCard } from '../components/file-card/file-card.js';
import { FileTree } from '../components/file-tree/file-tree.js';
import { Gallery } from '../components/gallery/gallery.js';
import { KeyTakeaway } from '../components/key-takeaway/key-takeaway.js';
import { ProductCard } from '../components/product-card/product-card.js';
import { PullQuote } from '../components/pull-quote/pull-quote.js';
import { RelatedContent } from '../components/related-content/related-content.js';
import { SeriesNavigation } from '../components/series-navigation/series-navigation.js';
import { SponsorBlock } from '../components/sponsor-block/sponsor-block.js';
import { Stat } from '../components/stat/stat.js';
import { Steps } from '../components/steps/steps.js';
import { Terminal } from '../components/terminal/terminal.js';
import { Video } from '../components/video/video.js';

/**
 * The headless views `@postkit/react` exports, keyed by component name. The
 * manifest's computed `support.headless` and the headless renderer read it,
 * so add a view here when it ships (and remove its name from `chakraOnly`).
 */
export const postkitHeadlessViews: Readonly<
  Record<string, PostkitAnyComponent>
> = Object.freeze({
  Aside,
  Callout,
  CardGrid,
  Disclosure,
  Gallery,
  Steps,
  Diff,
  FileCard,
  FileTree,
  Terminal,
  AudienceBoundary,
  Comparison,
  KeyTakeaway,
  ProductCard,
  PullQuote,
  RelatedContent,
  SeriesNavigation,
  SponsorBlock,
  Stat,
  AppearsOn,
  Audio,
  AuthorCard,
  CallToAction,
  Chart,
  Figure,
  Video,
});

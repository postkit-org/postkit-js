import { AppearsOn } from '../components/appears-on/appears-on.js';
import { Audio } from '../components/audio/audio.js';
import { AuthorCard } from '../components/author-card/author-card.js';
import { CallToAction } from '../components/call-to-action/call-to-action.js';
import { Carousel } from '../components/carousel/carousel.js';
import { Chart } from '../components/chart/chart.js';
import { LinkPreview } from '../components/link-preview/link-preview.js';
import { NewsletterSignup } from '../components/newsletter-signup/newsletter-signup.js';
import { ShareActions } from '../components/share-actions/share-actions.js';
import { SocialPost } from '../components/social-post/social-post.js';
import { Video } from '../components/video/video.js';
import { Figure } from '../components/figure/figure.js';
import {
  createPostkitProseLink,
  postkitProseComponents,
  type ProseComponents,
} from './components/prose.js';
import { CodeBlock } from '../components/code-block/code-block.js';
import { CodeGroup } from '../components/code-group/code-group.js';
import { Diff } from '../components/diff/diff.js';
import { FileCard } from '../components/file-card/file-card.js';
import { FileTree } from '../components/file-tree/file-tree.js';
import { Terminal } from '../components/terminal/terminal.js';
import { AudienceBoundary } from '../components/audience-boundary/audience-boundary.js';
import { Comparison } from '../components/comparison/comparison.js';
import { KeyTakeaway } from '../components/key-takeaway/key-takeaway.js';
import { Poll } from '../components/poll/poll.js';
import { ProductCard } from '../components/product-card/product-card.js';
import { PullQuote } from '../components/pull-quote/pull-quote.js';
import { RelatedContent } from '../components/related-content/related-content.js';
import { SeriesNavigation } from '../components/series-navigation/series-navigation.js';
import { SponsorBlock } from '../components/sponsor-block/sponsor-block.js';
import { Stat } from '../components/stat/stat.js';
import { Aside } from '../components/aside/aside.js';
import { Callout } from '../components/callout/callout.js';
import { CardGrid } from '../components/card-grid/card-grid.js';
import { Disclosure } from '../components/disclosure/disclosure.js';
import { Gallery } from '../components/gallery/gallery.js';
import { Steps } from '../components/steps/steps.js';
import { Tabs } from '../components/tabs/tabs.js';
import {
  createPostkitLink,
  type CreatePostkitLinkOptions,
  type PostkitLinkComponent,
  type PostkitLinkProps,
} from './link.js';

export type PostkitMdxComponents = ProseComponents & {
  readonly AudienceBoundary: typeof AudienceBoundary;
  readonly AppearsOn: typeof AppearsOn;
  readonly Audio: typeof Audio;
  readonly Aside: typeof Aside;
  readonly AuthorCard: typeof AuthorCard;
  readonly CallToAction: typeof CallToAction;
  readonly Callout: typeof Callout;
  readonly CardGrid: typeof CardGrid;
  readonly Carousel: typeof Carousel;
  readonly Chart: typeof Chart;
  readonly CodeBlock: typeof CodeBlock;
  readonly CodeGroup: typeof CodeGroup;
  readonly Comparison: typeof Comparison;
  readonly Diff: typeof Diff;
  readonly Figure: typeof Figure;
  readonly FileCard: typeof FileCard;
  readonly FileTree: typeof FileTree;
  readonly Disclosure: typeof Disclosure;
  readonly Gallery: typeof Gallery;
  readonly LinkPreview: typeof LinkPreview;
  readonly KeyTakeaway: typeof KeyTakeaway;
  readonly NewsletterSignup: typeof NewsletterSignup;
  readonly Poll: typeof Poll;
  readonly ProductCard: typeof ProductCard;
  readonly PullQuote: typeof PullQuote;
  readonly RelatedContent: typeof RelatedContent;
  readonly ShareActions: typeof ShareActions;
  readonly SeriesNavigation: typeof SeriesNavigation;
  readonly SocialPost: typeof SocialPost;
  readonly Steps: typeof Steps;
  readonly SponsorBlock: typeof SponsorBlock;
  readonly Stat: typeof Stat;
  readonly Tabs: typeof Tabs;
  readonly Terminal: typeof Terminal;
  readonly Video: typeof Video;
};

export const postkitMdxComponents: PostkitMdxComponents = Object.freeze({
  ...postkitProseComponents,
  AudienceBoundary: AudienceBoundary,
  AppearsOn: AppearsOn,
  Aside: Aside,
  Audio: Audio,
  AuthorCard: AuthorCard,
  CallToAction: CallToAction,
  Callout: Callout,
  CardGrid: CardGrid,
  Carousel: Carousel,
  Chart: Chart,
  CodeBlock: CodeBlock,
  CodeGroup: CodeGroup,
  Comparison: Comparison,
  Diff: Diff,
  Figure: Figure,
  FileCard: FileCard,
  FileTree: FileTree,
  Disclosure: Disclosure,
  Gallery: Gallery,
  LinkPreview: LinkPreview,
  KeyTakeaway: KeyTakeaway,
  NewsletterSignup: NewsletterSignup,
  Poll: Poll,
  ProductCard: ProductCard,
  PullQuote: PullQuote,
  RelatedContent: RelatedContent,
  ShareActions: ShareActions,
  SeriesNavigation: SeriesNavigation,
  SocialPost: SocialPost,
  Steps: Steps,
  SponsorBlock: SponsorBlock,
  Stat: Stat,
  Tabs: Tabs,
  Terminal: Terminal,
  Video: Video,
});

export interface CreatePostkitMdxComponentsOptions<
  TComponents extends object = object,
  TLinkProps extends object = PostkitLinkProps,
> {
  readonly components?: TComponents;
  readonly link?: PostkitLinkComponent | CreatePostkitLinkOptions<TLinkProps>;
}

export type PostkitMdxComponentMap<TComponents extends object = object> = Omit<
  PostkitMdxComponents,
  keyof TComponents
> &
  TComponents;

export function createPostkitMdxComponents<
  TComponents extends object = object,
  TLinkProps extends object = PostkitLinkProps,
>(
  options: CreatePostkitMdxComponentsOptions<TComponents, TLinkProps> = {},
): PostkitMdxComponentMap<TComponents> {
  const link =
    typeof options.link === 'function'
      ? options.link
      : createPostkitLink(options.link);

  return {
    ...postkitMdxComponents,
    a: createPostkitProseLink(link),
    ...options.components,
  } as unknown as PostkitMdxComponentMap<TComponents>;
}

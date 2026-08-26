import { AppearsOn } from './components/appears-on.js';
import { Audio } from './components/audio.js';
import { AuthorCard } from './components/author-card.js';
import { CallToAction } from './components/call-to-action.js';
import { Carousel } from './components/carousel.js';
import { Chart } from './components/chart.js';
import { Figure } from './components/figure.js';
import { LinkPreview } from './components/link-preview.js';
import { NewsletterSignup } from './components/newsletter-signup.js';
import {
  createPostkitProseLink,
  postkitProseComponents,
  type ProseComponents,
} from './components/prose.js';
import { ShareActions } from './components/share-actions.js';
import { SocialPost } from './components/social-post.js';
import { Video } from './components/video.js';
import {
  CodeBlock,
  CodeGroup,
  Diff,
  FileCard,
  FileTree,
  Terminal,
} from './components/technical-content.js';
import {
  AudienceBoundary,
  Comparison,
  KeyTakeaway,
  Poll,
  ProductCard,
  PullQuote,
  RelatedContent,
  SeriesNavigation,
  SponsorBlock,
  Stat,
} from './components/publication.js';
import {
  Aside,
  Callout,
  CardGrid,
  Disclosure,
  Gallery,
  Steps,
  Tabs,
} from './components/article-structure.js';
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

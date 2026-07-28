import { PostkitAppearsOn } from './components/appears-on.js';
import { PostkitAudio } from './components/audio.js';
import { PostkitAuthorCard } from './components/author-card.js';
import { PostkitCallToAction } from './components/call-to-action.js';
import { PostkitCarousel } from './components/carousel.js';
import { PostkitChart } from './components/chart.js';
import { PostkitFigure } from './components/figure.js';
import { PostkitLinkPreview } from './components/link-preview.js';
import { PostkitNewsletterSignup } from './components/newsletter-signup.js';
import {
  createPostkitProseLink,
  postkitProseComponents,
  type PostkitProseComponents,
} from './components/prose.js';
import { PostkitShareActions } from './components/share-actions.js';
import { PostkitSocialPost } from './components/social-post.js';
import { PostkitVideo } from './components/video.js';
import {
  PostkitCodeBlock,
  PostkitCodeGroup,
  PostkitDiff,
  PostkitFileCard,
  PostkitFileTree,
  PostkitTerminal,
} from './components/technical-content.js';
import {
  PostkitAudienceBoundary,
  PostkitComparison,
  PostkitKeyTakeaway,
  PostkitPoll,
  PostkitProductCard,
  PostkitPullQuote,
  PostkitRelatedContent,
  PostkitSeriesNavigation,
  PostkitSponsorBlock,
  PostkitStat,
} from './components/publication.js';
import {
  PostkitAside,
  PostkitCallout,
  PostkitCardGrid,
  PostkitDisclosure,
  PostkitGallery,
  PostkitSteps,
  PostkitTabs,
} from './components/article-structure.js';
import {
  createPostkitLink,
  type CreatePostkitLinkOptions,
  type PostkitLinkComponent,
  type PostkitLinkProps,
} from './link.js';

export type PostkitMdxComponents = PostkitProseComponents & {
  readonly AudienceBoundary: typeof PostkitAudienceBoundary;
  readonly AppearsOn: typeof PostkitAppearsOn;
  readonly Audio: typeof PostkitAudio;
  readonly Aside: typeof PostkitAside;
  readonly AuthorCard: typeof PostkitAuthorCard;
  readonly CallToAction: typeof PostkitCallToAction;
  readonly Callout: typeof PostkitCallout;
  readonly CardGrid: typeof PostkitCardGrid;
  readonly Carousel: typeof PostkitCarousel;
  readonly Chart: typeof PostkitChart;
  readonly CodeBlock: typeof PostkitCodeBlock;
  readonly CodeGroup: typeof PostkitCodeGroup;
  readonly Comparison: typeof PostkitComparison;
  readonly Diff: typeof PostkitDiff;
  readonly Figure: typeof PostkitFigure;
  readonly FileCard: typeof PostkitFileCard;
  readonly FileTree: typeof PostkitFileTree;
  readonly Disclosure: typeof PostkitDisclosure;
  readonly Gallery: typeof PostkitGallery;
  readonly LinkPreview: typeof PostkitLinkPreview;
  readonly KeyTakeaway: typeof PostkitKeyTakeaway;
  readonly NewsletterSignup: typeof PostkitNewsletterSignup;
  readonly Poll: typeof PostkitPoll;
  readonly ProductCard: typeof PostkitProductCard;
  readonly PullQuote: typeof PostkitPullQuote;
  readonly RelatedContent: typeof PostkitRelatedContent;
  readonly ShareActions: typeof PostkitShareActions;
  readonly SeriesNavigation: typeof PostkitSeriesNavigation;
  readonly SocialPost: typeof PostkitSocialPost;
  readonly Steps: typeof PostkitSteps;
  readonly SponsorBlock: typeof PostkitSponsorBlock;
  readonly Stat: typeof PostkitStat;
  readonly Tabs: typeof PostkitTabs;
  readonly Terminal: typeof PostkitTerminal;
  readonly Video: typeof PostkitVideo;
};

export const postkitMdxComponents: PostkitMdxComponents = Object.freeze({
  ...postkitProseComponents,
  AudienceBoundary: PostkitAudienceBoundary,
  AppearsOn: PostkitAppearsOn,
  Aside: PostkitAside,
  Audio: PostkitAudio,
  AuthorCard: PostkitAuthorCard,
  CallToAction: PostkitCallToAction,
  Callout: PostkitCallout,
  CardGrid: PostkitCardGrid,
  Carousel: PostkitCarousel,
  Chart: PostkitChart,
  CodeBlock: PostkitCodeBlock,
  CodeGroup: PostkitCodeGroup,
  Comparison: PostkitComparison,
  Diff: PostkitDiff,
  Figure: PostkitFigure,
  FileCard: PostkitFileCard,
  FileTree: PostkitFileTree,
  Disclosure: PostkitDisclosure,
  Gallery: PostkitGallery,
  LinkPreview: PostkitLinkPreview,
  KeyTakeaway: PostkitKeyTakeaway,
  NewsletterSignup: PostkitNewsletterSignup,
  Poll: PostkitPoll,
  ProductCard: PostkitProductCard,
  PullQuote: PostkitPullQuote,
  RelatedContent: PostkitRelatedContent,
  ShareActions: PostkitShareActions,
  SeriesNavigation: PostkitSeriesNavigation,
  SocialPost: PostkitSocialPost,
  Steps: PostkitSteps,
  SponsorBlock: PostkitSponsorBlock,
  Stat: PostkitStat,
  Tabs: PostkitTabs,
  Terminal: PostkitTerminal,
  Video: PostkitVideo,
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

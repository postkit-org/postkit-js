import AppearsOn from '../components/AppearsOn.astro';
import AudienceBoundary from '../components/AudienceBoundary.astro';
import Aside from '../components/Aside.astro';
import Audio from '../components/Audio.astro';
import AuthorCard from '../components/AuthorCard.astro';
import CallToAction from '../components/CallToAction.astro';
import Callout from '../components/Callout.astro';
import CardGrid from '../components/CardGrid.astro';
import Carousel from '../components/Carousel.astro';
import Chart from '../components/Chart.astro';
import CodeBlock from '../components/CodeBlock.astro';
import CodeGroup from '../components/CodeGroup.astro';
import Comparison from '../components/Comparison.astro';
import Diff from '../components/Diff.astro';
import Figure from '../components/Figure.astro';
import FileCard from '../components/FileCard.astro';
import FileTree from '../components/FileTree.astro';
import Disclosure from '../components/Disclosure.astro';
import Gallery from '../components/Gallery.astro';
import KeyTakeaway from '../components/KeyTakeaway.astro';
import LinkPreview from '../components/LinkPreview.astro';
import NewsletterSignup from '../components/NewsletterSignup.astro';
import Poll from '../components/Poll.astro';
import ProductCard from '../components/ProductCard.astro';
import PullQuote from '../components/PullQuote.astro';
import RelatedContent from '../components/RelatedContent.astro';
import ShareActions from '../components/ShareActions.astro';
import SeriesNavigation from '../components/SeriesNavigation.astro';
import SocialPost from '../components/SocialPost.astro';
import Steps from '../components/Steps.astro';
import SponsorBlock from '../components/SponsorBlock.astro';
import Stat from '../components/Stat.astro';
import Tabs from '../components/Tabs.astro';
import Terminal from '../components/Terminal.astro';
import Video from '../components/Video.astro';

export interface PostkitAstroComponents {
  readonly AppearsOn: typeof AppearsOn;
  readonly AudienceBoundary: typeof AudienceBoundary;
  readonly Aside: typeof Aside;
  readonly Audio: typeof Audio;
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
  readonly KeyTakeaway: typeof KeyTakeaway;
  readonly LinkPreview: typeof LinkPreview;
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
}

export const postkitAstroComponents: PostkitAstroComponents = Object.freeze({
  AppearsOn,
  AudienceBoundary,
  Aside,
  Audio,
  AuthorCard,
  CallToAction,
  Callout,
  CardGrid,
  Carousel,
  Chart,
  CodeBlock,
  CodeGroup,
  Comparison,
  Diff,
  Figure,
  FileCard,
  FileTree,
  Disclosure,
  Gallery,
  KeyTakeaway,
  LinkPreview,
  NewsletterSignup,
  Poll,
  ProductCard,
  PullQuote,
  RelatedContent,
  ShareActions,
  SeriesNavigation,
  SocialPost,
  Steps,
  SponsorBlock,
  Stat,
  Tabs,
  Terminal,
  Video,
});

export function createPostkitAstroComponents<
  TComponents extends object = object,
>(
  components: TComponents = {} as TComponents,
): PostkitAstroComponents & TComponents {
  return {
    ...postkitAstroComponents,
    ...components,
  };
}

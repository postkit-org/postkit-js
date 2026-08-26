import type { SystemContext } from '@chakra-ui/react';
import {
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
  PostkitProvider,
  ShareActions,
  SeriesNavigation,
  SocialPost,
  Steps,
  SponsorBlock,
  Stat,
  Tabs,
  Terminal,
  Video,
  type AppearsOnProps,
  type AudienceBoundaryProps,
  type AsideProps,
  type AudioProps,
  type AuthorCardProps,
  type CallToActionProps,
  type CalloutProps,
  type CardGridProps,
  type CarouselProps,
  type ChartProps,
  type CodeBlockProps,
  type CodeGroupProps,
  type ComparisonProps,
  type DiffProps,
  type FigureProps,
  type FileCardProps,
  type FileTreeProps,
  type DisclosureProps,
  type GalleryProps,
  type KeyTakeawayProps,
  type LinkPreviewProps,
  type NewsletterSignupProps,
  type PollProps,
  type ProductCardProps,
  type PullQuoteProps,
  type RelatedContentProps,
  type ShareActionsProps,
  type SeriesNavigationProps,
  type SocialPostProps,
  type StepsProps,
  type SponsorBlockProps,
  type StatProps,
  type TabsProps,
  type TerminalProps,
  type VideoProps,
} from '@postkit/react';
import system from 'virtual:postkit/chakra-system';
import type { ComponentType } from 'react';

function withPostkitAstroProvider<TProps extends object>(
  Component: ComponentType<TProps>,
) {
  function PostkitAstroBridge(props: TProps) {
    return (
      <PostkitProvider system={system as SystemContext}>
        <Component {...props} />
      </PostkitProvider>
    );
  }

  PostkitAstroBridge.displayName = `PostkitAstro${Component.displayName ?? Component.name}`;
  return PostkitAstroBridge;
}

export const PostkitAstroAudio =
  withPostkitAstroProvider<AudioProps>(Audio);
export const PostkitAstroAudienceBoundary =
  withPostkitAstroProvider<AudienceBoundaryProps>(
    AudienceBoundary,
  );
export const PostkitAstroAside =
  withPostkitAstroProvider<AsideProps>(Aside);
export const PostkitAstroAuthorCard =
  withPostkitAstroProvider<AuthorCardProps>(AuthorCard);
export const PostkitAstroCallToAction =
  withPostkitAstroProvider<CallToActionProps>(CallToAction);
export const PostkitAstroCallout =
  withPostkitAstroProvider<CalloutProps>(Callout);
export const PostkitAstroCardGrid =
  withPostkitAstroProvider<CardGridProps>(CardGrid);
export const PostkitAstroAppearsOn =
  withPostkitAstroProvider<AppearsOnProps>(AppearsOn);
export const PostkitAstroCarousel =
  withPostkitAstroProvider<CarouselProps>(Carousel);
export const PostkitAstroChart =
  withPostkitAstroProvider<ChartProps>(Chart);
export const PostkitAstroCodeBlock =
  withPostkitAstroProvider<CodeBlockProps>(CodeBlock);
export const PostkitAstroCodeGroup =
  withPostkitAstroProvider<CodeGroupProps>(CodeGroup);
export const PostkitAstroComparison =
  withPostkitAstroProvider<ComparisonProps>(Comparison);
export const PostkitAstroDiff =
  withPostkitAstroProvider<DiffProps>(Diff);
export const PostkitAstroFigure =
  withPostkitAstroProvider<FigureProps>(Figure);
export const PostkitAstroFileCard =
  withPostkitAstroProvider<FileCardProps>(FileCard);
export const PostkitAstroFileTree =
  withPostkitAstroProvider<FileTreeProps>(FileTree);
export const PostkitAstroDisclosure =
  withPostkitAstroProvider<DisclosureProps>(Disclosure);
export const PostkitAstroGallery =
  withPostkitAstroProvider<GalleryProps>(Gallery);
export const PostkitAstroKeyTakeaway =
  withPostkitAstroProvider<KeyTakeawayProps>(KeyTakeaway);
export const PostkitAstroLinkPreview =
  withPostkitAstroProvider<LinkPreviewProps>(LinkPreview);
export const PostkitAstroNewsletterSignup =
  withPostkitAstroProvider<NewsletterSignupProps>(
    NewsletterSignup,
  );
export const PostkitAstroPoll =
  withPostkitAstroProvider<PollProps>(Poll);
export const PostkitAstroProductCard =
  withPostkitAstroProvider<ProductCardProps>(ProductCard);
export const PostkitAstroPullQuote =
  withPostkitAstroProvider<PullQuoteProps>(PullQuote);
export const PostkitAstroRelatedContent =
  withPostkitAstroProvider<RelatedContentProps>(RelatedContent);
export const PostkitAstroShareActions =
  withPostkitAstroProvider<ShareActionsProps>(ShareActions);
export const PostkitAstroSeriesNavigation =
  withPostkitAstroProvider<SeriesNavigationProps>(
    SeriesNavigation,
  );
export const PostkitAstroSocialPost =
  withPostkitAstroProvider<SocialPostProps>(SocialPost);
export const PostkitAstroSteps =
  withPostkitAstroProvider<StepsProps>(Steps);
export const PostkitAstroSponsorBlock =
  withPostkitAstroProvider<SponsorBlockProps>(SponsorBlock);
export const PostkitAstroStat =
  withPostkitAstroProvider<StatProps>(Stat);
export const PostkitAstroTabs =
  withPostkitAstroProvider<TabsProps>(Tabs);
export const PostkitAstroTerminal =
  withPostkitAstroProvider<TerminalProps>(Terminal);
export const PostkitAstroVideo =
  withPostkitAstroProvider<VideoProps>(Video);

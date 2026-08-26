import type { SystemContext } from '@chakra-ui/react';
import {
  AppearsOn as ReactAppearsOn,
  AudienceBoundary as ReactAudienceBoundary,
  Aside as ReactAside,
  Audio as ReactAudio,
  AuthorCard as ReactAuthorCard,
  CallToAction as ReactCallToAction,
  Callout as ReactCallout,
  CardGrid as ReactCardGrid,
  Carousel as ReactCarousel,
  Chart as ReactChart,
  CodeBlock as ReactCodeBlock,
  CodeGroup as ReactCodeGroup,
  Comparison as ReactComparison,
  Diff as ReactDiff,
  Figure as ReactFigure,
  FileCard as ReactFileCard,
  FileTree as ReactFileTree,
  Disclosure as ReactDisclosure,
  Gallery as ReactGallery,
  KeyTakeaway as ReactKeyTakeaway,
  LinkPreview as ReactLinkPreview,
  NewsletterSignup as ReactNewsletterSignup,
  Poll as ReactPoll,
  ProductCard as ReactProductCard,
  PullQuote as ReactPullQuote,
  RelatedContent as ReactRelatedContent,
  PostkitProvider,
  ShareActions as ReactShareActions,
  SeriesNavigation as ReactSeriesNavigation,
  SocialPost as ReactSocialPost,
  Steps as ReactSteps,
  SponsorBlock as ReactSponsorBlock,
  Stat as ReactStat,
  Tabs as ReactTabs,
  Terminal as ReactTerminal,
  Video as ReactVideo,
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
  function AstroBridge(props: TProps) {
    return (
      <PostkitProvider system={system as SystemContext}>
        <Component {...props} />
      </PostkitProvider>
    );
  }

  AstroBridge.displayName = Component.displayName ?? Component.name;
  return AstroBridge;
}

export const Audio =
  withPostkitAstroProvider<AudioProps>(ReactAudio);
export const AudienceBoundary =
  withPostkitAstroProvider<AudienceBoundaryProps>(
    ReactAudienceBoundary,
  );
export const Aside =
  withPostkitAstroProvider<AsideProps>(ReactAside);
export const AuthorCard =
  withPostkitAstroProvider<AuthorCardProps>(ReactAuthorCard);
export const CallToAction =
  withPostkitAstroProvider<CallToActionProps>(ReactCallToAction);
export const Callout =
  withPostkitAstroProvider<CalloutProps>(ReactCallout);
export const CardGrid =
  withPostkitAstroProvider<CardGridProps>(ReactCardGrid);
export const AppearsOn =
  withPostkitAstroProvider<AppearsOnProps>(ReactAppearsOn);
export const Carousel =
  withPostkitAstroProvider<CarouselProps>(ReactCarousel);
export const Chart =
  withPostkitAstroProvider<ChartProps>(ReactChart);
export const CodeBlock =
  withPostkitAstroProvider<CodeBlockProps>(ReactCodeBlock);
export const CodeGroup =
  withPostkitAstroProvider<CodeGroupProps>(ReactCodeGroup);
export const Comparison =
  withPostkitAstroProvider<ComparisonProps>(ReactComparison);
export const Diff =
  withPostkitAstroProvider<DiffProps>(ReactDiff);
export const Figure =
  withPostkitAstroProvider<FigureProps>(ReactFigure);
export const FileCard =
  withPostkitAstroProvider<FileCardProps>(ReactFileCard);
export const FileTree =
  withPostkitAstroProvider<FileTreeProps>(ReactFileTree);
export const Disclosure =
  withPostkitAstroProvider<DisclosureProps>(ReactDisclosure);
export const Gallery =
  withPostkitAstroProvider<GalleryProps>(ReactGallery);
export const KeyTakeaway =
  withPostkitAstroProvider<KeyTakeawayProps>(ReactKeyTakeaway);
export const LinkPreview =
  withPostkitAstroProvider<LinkPreviewProps>(ReactLinkPreview);
export const NewsletterSignup =
  withPostkitAstroProvider<NewsletterSignupProps>(
    ReactNewsletterSignup,
  );
export const Poll =
  withPostkitAstroProvider<PollProps>(ReactPoll);
export const ProductCard =
  withPostkitAstroProvider<ProductCardProps>(ReactProductCard);
export const PullQuote =
  withPostkitAstroProvider<PullQuoteProps>(ReactPullQuote);
export const RelatedContent =
  withPostkitAstroProvider<RelatedContentProps>(ReactRelatedContent);
export const ShareActions =
  withPostkitAstroProvider<ShareActionsProps>(ReactShareActions);
export const SeriesNavigation =
  withPostkitAstroProvider<SeriesNavigationProps>(
    ReactSeriesNavigation,
  );
export const SocialPost =
  withPostkitAstroProvider<SocialPostProps>(ReactSocialPost);
export const Steps =
  withPostkitAstroProvider<StepsProps>(ReactSteps);
export const SponsorBlock =
  withPostkitAstroProvider<SponsorBlockProps>(ReactSponsorBlock);
export const Stat =
  withPostkitAstroProvider<StatProps>(ReactStat);
export const Tabs =
  withPostkitAstroProvider<TabsProps>(ReactTabs);
export const Terminal =
  withPostkitAstroProvider<TerminalProps>(ReactTerminal);
export const Video =
  withPostkitAstroProvider<VideoProps>(ReactVideo);

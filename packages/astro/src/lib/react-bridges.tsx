import type { SystemContext } from '@chakra-ui/react';
import {
  PostkitAppearsOn,
  PostkitAudienceBoundary,
  PostkitAside,
  PostkitAudio,
  PostkitAuthorCard,
  PostkitCallToAction,
  PostkitCallout,
  PostkitCardGrid,
  PostkitCarousel,
  PostkitChart,
  PostkitCodeBlock,
  PostkitCodeGroup,
  PostkitComparison,
  PostkitDiff,
  PostkitFigure,
  PostkitFileCard,
  PostkitFileTree,
  PostkitDisclosure,
  PostkitGallery,
  PostkitKeyTakeaway,
  PostkitLinkPreview,
  PostkitNewsletterSignup,
  PostkitPoll,
  PostkitProductCard,
  PostkitPullQuote,
  PostkitRelatedContent,
  PostkitProvider,
  PostkitShareActions,
  PostkitSeriesNavigation,
  PostkitSocialPost,
  PostkitSteps,
  PostkitSponsorBlock,
  PostkitStat,
  PostkitTabs,
  PostkitTerminal,
  PostkitVideo,
  type PostkitAppearsOnProps,
  type PostkitAudienceBoundaryProps,
  type PostkitAsideProps,
  type PostkitAudioProps,
  type PostkitAuthorCardProps,
  type PostkitCallToActionProps,
  type PostkitCalloutProps,
  type PostkitCardGridProps,
  type PostkitCarouselProps,
  type PostkitChartProps,
  type PostkitCodeBlockProps,
  type PostkitCodeGroupProps,
  type PostkitComparisonProps,
  type PostkitDiffProps,
  type PostkitFigureProps,
  type PostkitFileCardProps,
  type PostkitFileTreeProps,
  type PostkitDisclosureProps,
  type PostkitGalleryProps,
  type PostkitKeyTakeawayProps,
  type PostkitLinkPreviewProps,
  type PostkitNewsletterSignupProps,
  type PostkitPollProps,
  type PostkitProductCardProps,
  type PostkitPullQuoteProps,
  type PostkitRelatedContentProps,
  type PostkitShareActionsProps,
  type PostkitSeriesNavigationProps,
  type PostkitSocialPostProps,
  type PostkitStepsProps,
  type PostkitSponsorBlockProps,
  type PostkitStatProps,
  type PostkitTabsProps,
  type PostkitTerminalProps,
  type PostkitVideoProps,
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
  withPostkitAstroProvider<PostkitAudioProps>(PostkitAudio);
export const PostkitAstroAudienceBoundary =
  withPostkitAstroProvider<PostkitAudienceBoundaryProps>(
    PostkitAudienceBoundary,
  );
export const PostkitAstroAside =
  withPostkitAstroProvider<PostkitAsideProps>(PostkitAside);
export const PostkitAstroAuthorCard =
  withPostkitAstroProvider<PostkitAuthorCardProps>(PostkitAuthorCard);
export const PostkitAstroCallToAction =
  withPostkitAstroProvider<PostkitCallToActionProps>(PostkitCallToAction);
export const PostkitAstroCallout =
  withPostkitAstroProvider<PostkitCalloutProps>(PostkitCallout);
export const PostkitAstroCardGrid =
  withPostkitAstroProvider<PostkitCardGridProps>(PostkitCardGrid);
export const PostkitAstroAppearsOn =
  withPostkitAstroProvider<PostkitAppearsOnProps>(PostkitAppearsOn);
export const PostkitAstroCarousel =
  withPostkitAstroProvider<PostkitCarouselProps>(PostkitCarousel);
export const PostkitAstroChart =
  withPostkitAstroProvider<PostkitChartProps>(PostkitChart);
export const PostkitAstroCodeBlock =
  withPostkitAstroProvider<PostkitCodeBlockProps>(PostkitCodeBlock);
export const PostkitAstroCodeGroup =
  withPostkitAstroProvider<PostkitCodeGroupProps>(PostkitCodeGroup);
export const PostkitAstroComparison =
  withPostkitAstroProvider<PostkitComparisonProps>(PostkitComparison);
export const PostkitAstroDiff =
  withPostkitAstroProvider<PostkitDiffProps>(PostkitDiff);
export const PostkitAstroFigure =
  withPostkitAstroProvider<PostkitFigureProps>(PostkitFigure);
export const PostkitAstroFileCard =
  withPostkitAstroProvider<PostkitFileCardProps>(PostkitFileCard);
export const PostkitAstroFileTree =
  withPostkitAstroProvider<PostkitFileTreeProps>(PostkitFileTree);
export const PostkitAstroDisclosure =
  withPostkitAstroProvider<PostkitDisclosureProps>(PostkitDisclosure);
export const PostkitAstroGallery =
  withPostkitAstroProvider<PostkitGalleryProps>(PostkitGallery);
export const PostkitAstroKeyTakeaway =
  withPostkitAstroProvider<PostkitKeyTakeawayProps>(PostkitKeyTakeaway);
export const PostkitAstroLinkPreview =
  withPostkitAstroProvider<PostkitLinkPreviewProps>(PostkitLinkPreview);
export const PostkitAstroNewsletterSignup =
  withPostkitAstroProvider<PostkitNewsletterSignupProps>(
    PostkitNewsletterSignup,
  );
export const PostkitAstroPoll =
  withPostkitAstroProvider<PostkitPollProps>(PostkitPoll);
export const PostkitAstroProductCard =
  withPostkitAstroProvider<PostkitProductCardProps>(PostkitProductCard);
export const PostkitAstroPullQuote =
  withPostkitAstroProvider<PostkitPullQuoteProps>(PostkitPullQuote);
export const PostkitAstroRelatedContent =
  withPostkitAstroProvider<PostkitRelatedContentProps>(PostkitRelatedContent);
export const PostkitAstroShareActions =
  withPostkitAstroProvider<PostkitShareActionsProps>(PostkitShareActions);
export const PostkitAstroSeriesNavigation =
  withPostkitAstroProvider<PostkitSeriesNavigationProps>(
    PostkitSeriesNavigation,
  );
export const PostkitAstroSocialPost =
  withPostkitAstroProvider<PostkitSocialPostProps>(PostkitSocialPost);
export const PostkitAstroSteps =
  withPostkitAstroProvider<PostkitStepsProps>(PostkitSteps);
export const PostkitAstroSponsorBlock =
  withPostkitAstroProvider<PostkitSponsorBlockProps>(PostkitSponsorBlock);
export const PostkitAstroStat =
  withPostkitAstroProvider<PostkitStatProps>(PostkitStat);
export const PostkitAstroTabs =
  withPostkitAstroProvider<PostkitTabsProps>(PostkitTabs);
export const PostkitAstroTerminal =
  withPostkitAstroProvider<PostkitTerminalProps>(PostkitTerminal);
export const PostkitAstroVideo =
  withPostkitAstroProvider<PostkitVideoProps>(PostkitVideo);

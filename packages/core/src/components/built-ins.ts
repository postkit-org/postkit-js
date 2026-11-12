import { appearsOnDefinition } from './appears-on/appears-on.definition.js';
import { asideDefinition } from './aside/aside.definition.js';
import { audienceBoundaryDefinition } from './audience-boundary/audience-boundary.definition.js';
import { audioDefinition } from './audio/audio.definition.js';
import { authorCardDefinition } from './author-card/author-card.definition.js';
import { callToActionDefinition } from './call-to-action/call-to-action.definition.js';
import { calloutDefinition } from './callout/callout.definition.js';
import { cardGridDefinition } from './card-grid/card-grid.definition.js';
import { carouselDefinition } from './carousel/carousel.definition.js';
import { chartDefinition } from './chart/chart.definition.js';
import { codeBlockDefinition } from './code-block/code-block.definition.js';
import { codeGroupDefinition } from './code-group/code-group.definition.js';
import { comparisonDefinition } from './comparison/comparison.definition.js';
import { diffDefinition } from './diff/diff.definition.js';
import { disclosureDefinition } from './disclosure/disclosure.definition.js';
import { figureDefinition } from './figure/figure.definition.js';
import { fileCardDefinition } from './file-card/file-card.definition.js';
import { fileTreeDefinition } from './file-tree/file-tree.definition.js';
import { galleryDefinition } from './gallery/gallery.definition.js';
import { keyTakeawayDefinition } from './key-takeaway/key-takeaway.definition.js';
import { linkPreviewDefinition } from './link-preview/link-preview.definition.js';
import { newsletterSignupDefinition } from './newsletter-signup/newsletter-signup.definition.js';
import { pollDefinition } from './poll/poll.definition.js';
import { productCardDefinition } from './product-card/product-card.definition.js';
import { pullQuoteDefinition } from './pull-quote/pull-quote.definition.js';
import { relatedContentDefinition } from './related-content/related-content.definition.js';
import { seriesNavigationDefinition } from './series-navigation/series-navigation.definition.js';
import { shareActionsDefinition } from './share-actions/share-actions.definition.js';
import { socialPostDefinition } from './social-post/social-post.definition.js';
import { sponsorBlockDefinition } from './sponsor-block/sponsor-block.definition.js';
import { statDefinition } from './stat/stat.definition.js';
import { stepsDefinition } from './steps/steps.definition.js';
import { tabsDefinition } from './tabs/tabs.definition.js';
import { terminalDefinition } from './terminal/terminal.definition.js';
import { videoDefinition } from './video/video.definition.js';
import { deviceDefinition } from './device/device.definition.js';
import { footnoteDefinition } from './footnote/footnote.definition.js';
import { footnotesDefinition } from './footnotes/footnotes.definition.js';

/**
 * Postkit's built-in component definitions, keyed by name. The key order is
 * the 0.2 catalog order, which the v1 manifest keeps; components added since
 * (Device, 0.3) follow it.
 */
export const postkitBuiltInDefinitions = /* @__PURE__ */ Object.freeze({
  Aside: asideDefinition,
  Callout: calloutDefinition,
  CardGrid: cardGridDefinition,
  Disclosure: disclosureDefinition,
  Gallery: galleryDefinition,
  Steps: stepsDefinition,
  Tabs: tabsDefinition,
  CodeBlock: codeBlockDefinition,
  CodeGroup: codeGroupDefinition,
  Diff: diffDefinition,
  FileCard: fileCardDefinition,
  FileTree: fileTreeDefinition,
  Terminal: terminalDefinition,
  AudienceBoundary: audienceBoundaryDefinition,
  Comparison: comparisonDefinition,
  KeyTakeaway: keyTakeawayDefinition,
  Poll: pollDefinition,
  ProductCard: productCardDefinition,
  PullQuote: pullQuoteDefinition,
  RelatedContent: relatedContentDefinition,
  SeriesNavigation: seriesNavigationDefinition,
  SponsorBlock: sponsorBlockDefinition,
  Stat: statDefinition,
  AppearsOn: appearsOnDefinition,
  Audio: audioDefinition,
  AuthorCard: authorCardDefinition,
  CallToAction: callToActionDefinition,
  Carousel: carouselDefinition,
  Chart: chartDefinition,
  Figure: figureDefinition,
  LinkPreview: linkPreviewDefinition,
  NewsletterSignup: newsletterSignupDefinition,
  ShareActions: shareActionsDefinition,
  SocialPost: socialPostDefinition,
  Video: videoDefinition,
  Device: deviceDefinition,
  Footnote: footnoteDefinition,
  Footnotes: footnotesDefinition,
});

/** The name of a built-in Postkit component. */
export type PostkitBuiltInComponentName =
  keyof typeof postkitBuiltInDefinitions;

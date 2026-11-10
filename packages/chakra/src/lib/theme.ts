import {
  createSystem,
  defaultSystem,
  defineConfig,
  type SlotRecipeConfig,
  type SystemConfig,
  type SystemContext,
  type SystemStyleObject,
} from '@chakra-ui/react';

import type {
  PostkitFontFamily,
  PostkitThemeOverrides,
} from './theme-contract.js';
export type {
  PostkitFontFamily,
  PostkitRecipeOverride,
  PostkitThemeCompoundVariant,
  PostkitThemeOverrides,
  PostkitThemeSlotMap,
  PostkitThemeSlotStyles,
  PostkitThemeStyleObject,
  PostkitThemeVariantSelection,
  PostkitThemeVariantMap,
  PostkitThemeVariantStyles,
  PostkitTypography,
} from './theme-contract.js';

import {
  postkitAudioRecipe,
  postkitAudioSlots,
} from './recipes/audio.recipe.js';
import {
  postkitAppearsOnRecipe,
  postkitAppearsOnSlots,
} from './recipes/appears-on.recipe.js';
import {
  postkitCarouselRecipe,
  postkitCarouselSlots,
} from './recipes/carousel.recipe.js';
import {
  postkitAuthorCardRecipe,
  postkitAuthorCardSlots,
} from './recipes/author-card.recipe.js';
import {
  postkitCallToActionRecipe,
  postkitCallToActionSlots,
} from './recipes/call-to-action.recipe.js';
import {
  postkitCalloutRecipe,
  postkitCalloutSlots,
  postkitCardGridRecipe,
  postkitCardGridSlots,
  postkitDisclosureRecipe,
  postkitDisclosureSlots,
  postkitGalleryRecipe,
  postkitGallerySlots,
  postkitStepsRecipe,
  postkitStepsSlots,
  postkitTabsRecipe,
  postkitTabsSlots,
} from './recipes/article-structure.recipe.js';
import {
  postkitChartRecipe,
  postkitChartSlots,
} from './recipes/chart.recipe.js';
import {
  postkitFigureRecipe,
  postkitFigureSlots,
} from './recipes/figure.recipe.js';
import {
  postkitLinkPreviewRecipe,
  postkitLinkPreviewSlots,
} from './recipes/link-preview.recipe.js';
import {
  postkitNewsletterSignupRecipe,
  postkitNewsletterSignupSlots,
} from './recipes/newsletter-signup.recipe.js';
import {
  postkitProseRecipe,
  postkitProseSlots,
} from './recipes/prose.recipe.js';
import {
  postkitShareActionsRecipe,
  postkitShareActionsSlots,
} from './recipes/share-actions.recipe.js';
import {
  postkitSocialPostRecipe,
  postkitSocialPostSlots,
} from './recipes/social-post.recipe.js';
import {
  postkitVideoRecipe,
  postkitVideoSlots,
} from './recipes/video.recipe.js';
import {
  postkitCodeBlockSlots,
  postkitCodeGroupSlots,
  postkitDiffRecipe,
  postkitDiffSlots,
  postkitFileCardRecipe,
  postkitFileCardSlots,
  postkitFileTreeRecipe,
  postkitFileTreeSlots,
  postkitTerminalSlots,
  postkitStandaloneCodeBlockRecipe,
  postkitStandaloneCodeGroupRecipe,
  postkitStandaloneTerminalRecipe,
} from './recipes/technical-content.recipe.js';
import {
  postkitAudienceBoundaryRecipe,
  postkitAudienceBoundarySlots,
  postkitComparisonRecipe,
  postkitComparisonSlots,
  postkitKeyTakeawayRecipe,
  postkitKeyTakeawaySlots,
  postkitPollRecipe,
  postkitPollSlots,
  postkitProductCardRecipe,
  postkitProductCardSlots,
  postkitPullQuoteRecipe,
  postkitPullQuoteSlots,
  postkitRelatedContentRecipe,
  postkitRelatedContentSlots,
  postkitSeriesNavigationRecipe,
  postkitSeriesNavigationSlots,
  postkitSponsorBlockRecipe,
  postkitSponsorBlockSlots,
  postkitStatRecipe,
  postkitStatSlots,
} from './recipes/publication.recipe.js';

export const postkitRecipeKeys = Object.freeze({
  audienceBoundary: 'postkitAudienceBoundary',
  appearsOn: 'postkitAppearsOn',
  audio: 'postkitAudio',
  authorCard: 'postkitAuthorCard',
  callout: 'postkitCallout',
  callToAction: 'postkitCallToAction',
  cardGrid: 'postkitCardGrid',
  carousel: 'postkitCarousel',
  chart: 'postkitChart',
  codeBlock: 'postkitCodeBlock',
  codeGroup: 'postkitCodeGroup',
  comparison: 'postkitComparison',
  diff: 'postkitDiff',
  figure: 'postkitFigure',
  fileCard: 'postkitFileCard',
  fileTree: 'postkitFileTree',
  disclosure: 'postkitDisclosure',
  gallery: 'postkitGallery',
  keyTakeaway: 'postkitKeyTakeaway',
  linkPreview: 'postkitLinkPreview',
  newsletterSignup: 'postkitNewsletterSignup',
  poll: 'postkitPoll',
  productCard: 'postkitProductCard',
  prose: 'postkitProse',
  pullQuote: 'postkitPullQuote',
  relatedContent: 'postkitRelatedContent',
  shareActions: 'postkitShareActions',
  seriesNavigation: 'postkitSeriesNavigation',
  socialPost: 'postkitSocialPost',
  steps: 'postkitSteps',
  sponsorBlock: 'postkitSponsorBlock',
  stat: 'postkitStat',
  tabs: 'postkitTabs',
  terminal: 'postkitTerminal',
  video: 'postkitVideo',
} as const);

export type PostkitRecipeKey =
  (typeof postkitRecipeKeys)[keyof typeof postkitRecipeKeys];

export interface PostkitSystemOptions {
  /** The site's Chakra system. Its configuration is layered over the preset. */
  readonly system?: SystemContext;
  /** Optional Postkit visual defaults layered beneath the site's system. */
  readonly preset?: SystemConfig;
  /** Deliberate contextual overrides layered after the site's system. */
  readonly theme?: SystemConfig;
}

function withPostkitTypographyDefaults(
  recipes: Record<string, SlotRecipeConfig>,
): Record<string, SlotRecipeConfig> {
  return Object.fromEntries(
    Object.entries(recipes).map(([key, recipe]) => {
      const base = { ...recipe.base } as Record<string, SystemStyleObject>;

      for (const slot of recipe.slots) {
        const styles = base[slot] ?? {};
        const defaultFontFamily = slot === 'root' ? 'body' : undefined;

        if (defaultFontFamily) {
          base[slot] = { ...styles, fontFamily: defaultFontFamily };
        }
      }

      return [key, { ...recipe, base }];
    }),
  );
}

// `_light` / `_dark`, the same keys Chakra's own semantic tokens use. Chakra emits colour-mode
// blocks in the order it first meets each condition, so a preset that used `base` + `_dark`
// put the `.dark` block before `:root, .light` and light mode won everywhere.
type PostkitColorValue = { readonly _light: string; readonly _dark: string };

/** A colour that stays the same in both modes, stated as such on purpose. */
function bothModes(value: string): { readonly value: PostkitColorValue } {
  return { value: { _light: value, _dark: value } };
}

/**
 * A callout tone. Light is Chakra's `<palette>.fg` step; dark is the palette's
 * lifted step, so tones stay legible over a dark page.
 */
function tone(palette: string): { readonly value: PostkitColorValue } {
  return {
    value: {
      _light: `{colors.${palette}.700}`,
      _dark: `{colors.${palette}.300}`,
    },
  };
}

/**
 * A tone's tint: the tone mixed over the page, 12% in light and 22% in dark.
 * It references the tone and `bg` rather than a palette step, so a host that
 * sets its own `tone.*` or `bg` still gets matching tints in both modes.
 */
function tint(name: string): { readonly value: PostkitColorValue } {
  return {
    value: {
      _light: `color-mix(in srgb, {colors.tone.${name}} 12%, {colors.bg})`,
      _dark: `color-mix(in srgb, {colors.tone.${name}} 22%, {colors.bg})`,
    },
  };
}

/**
 * Semantic colours used by Postkit's default recipes. Every colour has a
 * `_light` and a `_dark` value so components follow the host's colour mode.
 * Hosts override any of them by defining the same semantic token.
 */
const postkitSemanticColors = {
  bg: {
    // CodeBlock, CodeGroup and Terminal keep their own dark surface in both
    // modes (03-component-system §5.5), so these are dark in light mode too.
    code: bothModes('{colors.gray.950}'),
    codeMuted: bothModes('{colors.gray.900}'),
    codeSelected: bothModes('{colors.whiteAlpha.200}'),
    // Video letterboxing is black in both modes, like any media player.
    letterbox: bothModes('{colors.black}'),
  },
  fg: {
    onCode: bothModes('{colors.gray.100}'),
    onCodeEmphasized: bothModes('{colors.white}'),
    onCodeMuted: bothModes('{colors.gray.400}'),
    onCodeSubtle: bothModes('{colors.gray.500}'),
    onCodeFaint: bothModes('{colors.gray.600}'),
    onCodeSuccess: bothModes('{colors.green.300}'),
    onLetterbox: bothModes('{colors.white}'),
  },
  border: {
    code: bothModes('{colors.gray.800}'),
    codeDivider: bothModes('{colors.whiteAlpha.300}'),
  },
  tone: {
    note: tone('blue'),
    tip: tone('green'),
    important: tone('purple'),
    warning: tone('orange'),
    caution: tone('red'),
  },
  tint: {
    note: tint('note'),
    tip: tint('tip'),
    important: tint('important'),
    warning: tint('warning'),
    caution: tint('caution'),
  },
};

/**
 * Postkit's component-scoped Chakra defaults. The stable slot-recipe keys let
 * a host override Postkit without changing unrelated Chakra components.
 */
export const postkitDefaultTheme = defineConfig({
  theme: {
    semanticTokens: { colors: postkitSemanticColors },
    slotRecipes: withPostkitTypographyDefaults({
      [postkitRecipeKeys.audienceBoundary]: postkitAudienceBoundaryRecipe,
      [postkitRecipeKeys.appearsOn]: postkitAppearsOnRecipe,
      [postkitRecipeKeys.audio]: postkitAudioRecipe,
      [postkitRecipeKeys.authorCard]: postkitAuthorCardRecipe,
      [postkitRecipeKeys.callout]: postkitCalloutRecipe,
      [postkitRecipeKeys.callToAction]: postkitCallToActionRecipe,
      [postkitRecipeKeys.cardGrid]: postkitCardGridRecipe,
      [postkitRecipeKeys.carousel]: postkitCarouselRecipe,
      [postkitRecipeKeys.chart]: postkitChartRecipe,
      [postkitRecipeKeys.codeBlock]: postkitStandaloneCodeBlockRecipe,
      [postkitRecipeKeys.codeGroup]: postkitStandaloneCodeGroupRecipe,
      [postkitRecipeKeys.comparison]: postkitComparisonRecipe,
      [postkitRecipeKeys.diff]: postkitDiffRecipe,
      [postkitRecipeKeys.figure]: postkitFigureRecipe,
      [postkitRecipeKeys.fileCard]: postkitFileCardRecipe,
      [postkitRecipeKeys.fileTree]: postkitFileTreeRecipe,
      [postkitRecipeKeys.disclosure]: postkitDisclosureRecipe,
      [postkitRecipeKeys.gallery]: postkitGalleryRecipe,
      [postkitRecipeKeys.keyTakeaway]: postkitKeyTakeawayRecipe,
      [postkitRecipeKeys.linkPreview]: postkitLinkPreviewRecipe,
      [postkitRecipeKeys.newsletterSignup]: postkitNewsletterSignupRecipe,
      [postkitRecipeKeys.poll]: postkitPollRecipe,
      [postkitRecipeKeys.productCard]: postkitProductCardRecipe,
      [postkitRecipeKeys.prose]: postkitProseRecipe,
      [postkitRecipeKeys.pullQuote]: postkitPullQuoteRecipe,
      [postkitRecipeKeys.relatedContent]: postkitRelatedContentRecipe,
      [postkitRecipeKeys.shareActions]: postkitShareActionsRecipe,
      [postkitRecipeKeys.seriesNavigation]: postkitSeriesNavigationRecipe,
      [postkitRecipeKeys.socialPost]: postkitSocialPostRecipe,
      [postkitRecipeKeys.steps]: postkitStepsRecipe,
      [postkitRecipeKeys.sponsorBlock]: postkitSponsorBlockRecipe,
      [postkitRecipeKeys.stat]: postkitStatRecipe,
      [postkitRecipeKeys.tabs]: postkitTabsRecipe,
      [postkitRecipeKeys.terminal]: postkitStandaloneTerminalRecipe,
      [postkitRecipeKeys.video]: postkitVideoRecipe,
    }),
  },
});

function overrideRecipe(
  slots: readonly string[],
  override: object,
): SlotRecipeConfig {
  return { slots, ...override } as SlotRecipeConfig;
}

/**
 * Creates a Chakra config containing only component-scoped Postkit overrides.
 * It is intended for the `theme` prop on PostkitProvider.
 */
export function createPostkitTheme(
  overrides: PostkitThemeOverrides,
): SystemConfig {
  const slotRecipes: Record<string, SlotRecipeConfig> = {};
  const fonts: Record<string, { value: string }> = {};

  const fontFamilyValue = (value: PostkitFontFamily): string =>
    typeof value === 'string' ? value : value.join(', ');

  if (overrides.typography?.body) {
    fonts.body = { value: fontFamilyValue(overrides.typography.body) };
  }
  if (overrides.typography?.heading) {
    fonts.heading = { value: fontFamilyValue(overrides.typography.heading) };
  }
  if (overrides.typography?.mono) {
    fonts.mono = { value: fontFamilyValue(overrides.typography.mono) };
  }

  if (overrides.audienceBoundary) {
    slotRecipes[postkitRecipeKeys.audienceBoundary] = overrideRecipe(
      postkitAudienceBoundarySlots,
      overrides.audienceBoundary,
    );
  }
  if (overrides.appearsOn) {
    slotRecipes[postkitRecipeKeys.appearsOn] = overrideRecipe(
      postkitAppearsOnSlots,
      overrides.appearsOn,
    );
  }
  if (overrides.audio) {
    slotRecipes[postkitRecipeKeys.audio] = overrideRecipe(
      postkitAudioSlots,
      overrides.audio,
    );
  }
  if (overrides.authorCard) {
    slotRecipes[postkitRecipeKeys.authorCard] = overrideRecipe(
      postkitAuthorCardSlots,
      overrides.authorCard,
    );
  }
  if (overrides.callout) {
    slotRecipes[postkitRecipeKeys.callout] = overrideRecipe(
      postkitCalloutSlots,
      overrides.callout,
    );
  }
  if (overrides.callToAction) {
    slotRecipes[postkitRecipeKeys.callToAction] = overrideRecipe(
      postkitCallToActionSlots,
      overrides.callToAction,
    );
  }
  if (overrides.carousel) {
    slotRecipes[postkitRecipeKeys.carousel] = overrideRecipe(
      postkitCarouselSlots,
      overrides.carousel,
    );
  }
  if (overrides.cardGrid) {
    slotRecipes[postkitRecipeKeys.cardGrid] = overrideRecipe(
      postkitCardGridSlots,
      overrides.cardGrid,
    );
  }
  if (overrides.chart) {
    slotRecipes[postkitRecipeKeys.chart] = overrideRecipe(
      postkitChartSlots,
      overrides.chart,
    );
  }
  if (overrides.codeBlock) {
    slotRecipes[postkitRecipeKeys.codeBlock] = overrideRecipe(
      postkitCodeBlockSlots,
      overrides.codeBlock,
    );
  }
  if (overrides.codeGroup) {
    slotRecipes[postkitRecipeKeys.codeGroup] = overrideRecipe(
      postkitCodeGroupSlots,
      overrides.codeGroup,
    );
  }
  if (overrides.comparison) {
    slotRecipes[postkitRecipeKeys.comparison] = overrideRecipe(
      postkitComparisonSlots,
      overrides.comparison,
    );
  }
  if (overrides.diff) {
    slotRecipes[postkitRecipeKeys.diff] = overrideRecipe(
      postkitDiffSlots,
      overrides.diff,
    );
  }
  if (overrides.figure) {
    slotRecipes[postkitRecipeKeys.figure] = overrideRecipe(
      postkitFigureSlots,
      overrides.figure,
    );
  }
  if (overrides.fileCard) {
    slotRecipes[postkitRecipeKeys.fileCard] = overrideRecipe(
      postkitFileCardSlots,
      overrides.fileCard,
    );
  }
  if (overrides.fileTree) {
    slotRecipes[postkitRecipeKeys.fileTree] = overrideRecipe(
      postkitFileTreeSlots,
      overrides.fileTree,
    );
  }
  if (overrides.disclosure) {
    slotRecipes[postkitRecipeKeys.disclosure] = overrideRecipe(
      postkitDisclosureSlots,
      overrides.disclosure,
    );
  }
  if (overrides.gallery) {
    slotRecipes[postkitRecipeKeys.gallery] = overrideRecipe(
      postkitGallerySlots,
      overrides.gallery,
    );
  }
  if (overrides.keyTakeaway) {
    slotRecipes[postkitRecipeKeys.keyTakeaway] = overrideRecipe(
      postkitKeyTakeawaySlots,
      overrides.keyTakeaway,
    );
  }
  if (overrides.linkPreview) {
    slotRecipes[postkitRecipeKeys.linkPreview] = overrideRecipe(
      postkitLinkPreviewSlots,
      overrides.linkPreview,
    );
  }
  if (overrides.newsletterSignup) {
    slotRecipes[postkitRecipeKeys.newsletterSignup] = overrideRecipe(
      postkitNewsletterSignupSlots,
      overrides.newsletterSignup,
    );
  }
  if (overrides.poll) {
    slotRecipes[postkitRecipeKeys.poll] = overrideRecipe(
      postkitPollSlots,
      overrides.poll,
    );
  }
  if (overrides.productCard) {
    slotRecipes[postkitRecipeKeys.productCard] = overrideRecipe(
      postkitProductCardSlots,
      overrides.productCard,
    );
  }
  if (overrides.prose) {
    slotRecipes[postkitRecipeKeys.prose] = overrideRecipe(
      postkitProseSlots,
      overrides.prose,
    );
  }
  if (overrides.pullQuote) {
    slotRecipes[postkitRecipeKeys.pullQuote] = overrideRecipe(
      postkitPullQuoteSlots,
      overrides.pullQuote,
    );
  }
  if (overrides.relatedContent) {
    slotRecipes[postkitRecipeKeys.relatedContent] = overrideRecipe(
      postkitRelatedContentSlots,
      overrides.relatedContent,
    );
  }
  if (overrides.shareActions) {
    slotRecipes[postkitRecipeKeys.shareActions] = overrideRecipe(
      postkitShareActionsSlots,
      overrides.shareActions,
    );
  }
  if (overrides.seriesNavigation) {
    slotRecipes[postkitRecipeKeys.seriesNavigation] = overrideRecipe(
      postkitSeriesNavigationSlots,
      overrides.seriesNavigation,
    );
  }
  if (overrides.socialPost) {
    slotRecipes[postkitRecipeKeys.socialPost] = overrideRecipe(
      postkitSocialPostSlots,
      overrides.socialPost,
    );
  }
  if (overrides.steps) {
    slotRecipes[postkitRecipeKeys.steps] = overrideRecipe(
      postkitStepsSlots,
      overrides.steps,
    );
  }
  if (overrides.sponsorBlock) {
    slotRecipes[postkitRecipeKeys.sponsorBlock] = overrideRecipe(
      postkitSponsorBlockSlots,
      overrides.sponsorBlock,
    );
  }
  if (overrides.stat) {
    slotRecipes[postkitRecipeKeys.stat] = overrideRecipe(
      postkitStatSlots,
      overrides.stat,
    );
  }
  if (overrides.tabs) {
    slotRecipes[postkitRecipeKeys.tabs] = overrideRecipe(
      postkitTabsSlots,
      overrides.tabs,
    );
  }
  if (overrides.terminal) {
    slotRecipes[postkitRecipeKeys.terminal] = overrideRecipe(
      postkitTerminalSlots,
      overrides.terminal,
    );
  }
  if (overrides.video) {
    slotRecipes[postkitRecipeKeys.video] = overrideRecipe(
      postkitVideoSlots,
      overrides.video,
    );
  }

  return defineConfig({
    theme: {
      ...(Object.keys(fonts).length ? { tokens: { fonts } } : {}),
      slotRecipes,
    },
  });
}

/**
 * Composes an optional Postkit visual preset, a host Chakra system, and
 * contextual Postkit overrides. Postkit is host-native by default; pass
 * `postkitDefaultTheme` as `preset` to opt into its standalone appearance.
 */
export function createPostkitSystem(
  options?: PostkitSystemOptions,
): SystemContext;
/** @deprecated Prefer the options-object overload. */
export function createPostkitSystem(
  system?: SystemContext,
  theme?: SystemConfig,
): SystemContext;
export function createPostkitSystem(
  optionsOrSystem: PostkitSystemOptions | SystemContext = {},
  legacyTheme?: SystemConfig,
): SystemContext {
  const options: PostkitSystemOptions =
    '_config' in optionsOrSystem
      ? { system: optionsOrSystem, theme: legacyTheme }
      : optionsOrSystem;
  const system = options.system ?? defaultSystem;

  return createSystem(
    ...(options.preset ? [options.preset] : []),
    system._config,
    ...(options.theme ? [options.theme] : []),
  );
}

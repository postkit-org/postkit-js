import {
  appearsOnDefinition,
  audienceBoundaryDefinition,
  audioDefinition,
  authorCardDefinition,
  calloutDefinition,
  callToActionDefinition,
  cardGridDefinition,
  carouselDefinition,
  chartDefinition,
  codeBlockDefinition,
  codeGroupDefinition,
  comparisonDefinition,
  diffDefinition,
  disclosureDefinition,
  figureDefinition,
  fileCardDefinition,
  fileTreeDefinition,
  galleryDefinition,
  keyTakeawayDefinition,
  linkPreviewDefinition,
  newsletterSignupDefinition,
  pollDefinition,
  productCardDefinition,
  pullQuoteDefinition,
  relatedContentDefinition,
  seriesNavigationDefinition,
  shareActionsDefinition,
  socialPostDefinition,
  sponsorBlockDefinition,
  statDefinition,
  stepsDefinition,
  tabsDefinition,
  terminalDefinition,
  videoDefinition,
  deviceDefinition,
} from '@postkit/core/components';

/**
 * A deliberately shallow style object for Postkit theme overrides.
 *
 * Chakra validates and resolves these values when the theme is composed. Keeping
 * the public input type shallow prevents consumers from instantiating Chakra's
 * recursive SystemStyleObject once for every Postkit recipe slot.
 */
export type PostkitThemeStyleObject = Readonly<Record<string, unknown>>;

export type PostkitThemeSlotStyles<Slot extends string> = Partial<
  Readonly<Record<Slot, PostkitThemeStyleObject>>
>;

export type PostkitThemeVariantSelection =
  string | boolean | readonly (string | boolean)[];

export type PostkitThemeVariantStyles<
  Slot extends string,
  Variant extends string,
> = Partial<
  Readonly<
    Record<Variant, Readonly<Record<string, PostkitThemeSlotStyles<Slot>>>>
  >
>;

export type PostkitThemeCompoundVariant<
  Slot extends string,
  Variant extends string,
> = Partial<Readonly<Record<Variant, PostkitThemeVariantSelection>>> & {
  readonly css?: PostkitThemeSlotStyles<Slot>;
};

/** A lightweight public recipe override that is independent of recipe inference. */
export type PostkitRecipeOverride<
  Slot extends string,
  Variant extends string = never,
> = {
  readonly base?: PostkitThemeSlotStyles<Slot>;
  readonly variants?: [Variant] extends [never]
    ? never
    : PostkitThemeVariantStyles<Slot, Variant>;
  readonly defaultVariants?: [Variant] extends [never]
    ? never
    : Partial<Readonly<Record<Variant, string | boolean>>>;
  readonly compoundVariants?: [Variant] extends [never]
    ? never
    : readonly PostkitThemeCompoundVariant<Slot, Variant>[];
};

export type PostkitFontFamily = string | readonly string[];

export interface PostkitTypography {
  /** The font for prose, descriptions, controls, and component copy. */
  readonly body?: PostkitFontFamily;
  /** The font for titles and heading-like rich-component slots. */
  readonly heading?: PostkitFontFamily;
  /** The font for inline code and other technical content. */
  readonly mono?: PostkitFontFamily;
}

/*
 * The theme maps are derived from the definitions in `@postkit/core/components`.
 *
 * They read each definition's type-only `$slot` and `$themeVariant` unions in
 * value position, so the types below are inferred. Declaration emit writes
 * inferred types out as resolved literal unions: theme consumers never load
 * the definitions' declarations and pay no more type instantiations than for
 * written-out maps (`npm run types:performance:check`). Indexing the
 * definitions in type position instead (`PostkitSlotOf<typeof …>`) would cost
 * every consumer an instantiation per component. The objects are only read
 * with `typeof`; their runtime values are `undefined`.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- read only with `typeof`
const postkitThemeSlots = {
  audienceBoundary: audienceBoundaryDefinition.$slot,
  appearsOn: appearsOnDefinition.$slot,
  audio: audioDefinition.$slot,
  authorCard: authorCardDefinition.$slot,
  callout: calloutDefinition.$slot,
  callToAction: callToActionDefinition.$slot,
  cardGrid: cardGridDefinition.$slot,
  carousel: carouselDefinition.$slot,
  chart: chartDefinition.$slot,
  codeBlock: codeBlockDefinition.$slot,
  codeGroup: codeGroupDefinition.$slot,
  comparison: comparisonDefinition.$slot,
  diff: diffDefinition.$slot,
  disclosure: disclosureDefinition.$slot,
  figure: figureDefinition.$slot,
  fileCard: fileCardDefinition.$slot,
  fileTree: fileTreeDefinition.$slot,
  gallery: galleryDefinition.$slot,
  keyTakeaway: keyTakeawayDefinition.$slot,
  linkPreview: linkPreviewDefinition.$slot,
  newsletterSignup: newsletterSignupDefinition.$slot,
  poll: pollDefinition.$slot,
  productCard: productCardDefinition.$slot,
  pullQuote: pullQuoteDefinition.$slot,
  relatedContent: relatedContentDefinition.$slot,
  seriesNavigation: seriesNavigationDefinition.$slot,
  shareActions: shareActionsDefinition.$slot,
  socialPost: socialPostDefinition.$slot,
  sponsorBlock: sponsorBlockDefinition.$slot,
  stat: statDefinition.$slot,
  steps: stepsDefinition.$slot,
  tabs: tabsDefinition.$slot,
  terminal: terminalDefinition.$slot,
  video: videoDefinition.$slot,
  device: deviceDefinition.$slot,
} as const;

/** `LinkPreview`'s theme variants plus its recipe-only `compact` variant. */
function withCompactVariant<Variant extends string>(
  variant: Variant,
): Variant | 'compact' {
  return variant;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- read only with `typeof`
const postkitThemeVariants = {
  audienceBoundary: audienceBoundaryDefinition.$themeVariant,
  appearsOn: appearsOnDefinition.$themeVariant,
  audio: audioDefinition.$themeVariant,
  authorCard: authorCardDefinition.$themeVariant,
  callout: calloutDefinition.$themeVariant,
  callToAction: callToActionDefinition.$themeVariant,
  cardGrid: cardGridDefinition.$themeVariant,
  carousel: carouselDefinition.$themeVariant,
  chart: chartDefinition.$themeVariant,
  codeBlock: codeBlockDefinition.$themeVariant,
  codeGroup: codeGroupDefinition.$themeVariant,
  comparison: comparisonDefinition.$themeVariant,
  diff: diffDefinition.$themeVariant,
  disclosure: disclosureDefinition.$themeVariant,
  figure: figureDefinition.$themeVariant,
  fileCard: fileCardDefinition.$themeVariant,
  fileTree: fileTreeDefinition.$themeVariant,
  gallery: galleryDefinition.$themeVariant,
  keyTakeaway: keyTakeawayDefinition.$themeVariant,
  linkPreview: withCompactVariant(linkPreviewDefinition.$themeVariant),
  newsletterSignup: newsletterSignupDefinition.$themeVariant,
  poll: pollDefinition.$themeVariant,
  productCard: productCardDefinition.$themeVariant,
  pullQuote: pullQuoteDefinition.$themeVariant,
  relatedContent: relatedContentDefinition.$themeVariant,
  seriesNavigation: seriesNavigationDefinition.$themeVariant,
  shareActions: shareActionsDefinition.$themeVariant,
  socialPost: socialPostDefinition.$themeVariant,
  sponsorBlock: sponsorBlockDefinition.$themeVariant,
  stat: statDefinition.$themeVariant,
  steps: stepsDefinition.$themeVariant,
  tabs: tabsDefinition.$themeVariant,
  terminal: terminalDefinition.$themeVariant,
  video: videoDefinition.$themeVariant,
  device: deviceDefinition.$themeVariant,
} as const;

type PostkitDefinitionThemeSlots = typeof postkitThemeSlots;
type PostkitDefinitionThemeVariants = typeof postkitThemeVariants;

/**
 * The anatomy slots of every themed component, keyed by theme key: each
 * definition's `slots`, plus `prose`, which has no definition.
 */
export interface PostkitThemeSlotMap {
  readonly audienceBoundary: PostkitDefinitionThemeSlots['audienceBoundary'];
  readonly appearsOn: PostkitDefinitionThemeSlots['appearsOn'];
  readonly audio: PostkitDefinitionThemeSlots['audio'];
  readonly authorCard: PostkitDefinitionThemeSlots['authorCard'];
  readonly callout: PostkitDefinitionThemeSlots['callout'];
  readonly callToAction: PostkitDefinitionThemeSlots['callToAction'];
  readonly cardGrid: PostkitDefinitionThemeSlots['cardGrid'];
  readonly carousel: PostkitDefinitionThemeSlots['carousel'];
  readonly chart: PostkitDefinitionThemeSlots['chart'];
  readonly codeBlock: PostkitDefinitionThemeSlots['codeBlock'];
  readonly codeGroup: PostkitDefinitionThemeSlots['codeGroup'];
  readonly comparison: PostkitDefinitionThemeSlots['comparison'];
  readonly diff: PostkitDefinitionThemeSlots['diff'];
  readonly disclosure: PostkitDefinitionThemeSlots['disclosure'];
  readonly figure: PostkitDefinitionThemeSlots['figure'];
  readonly fileCard: PostkitDefinitionThemeSlots['fileCard'];
  readonly fileTree: PostkitDefinitionThemeSlots['fileTree'];
  readonly gallery: PostkitDefinitionThemeSlots['gallery'];
  readonly keyTakeaway: PostkitDefinitionThemeSlots['keyTakeaway'];
  readonly linkPreview: PostkitDefinitionThemeSlots['linkPreview'];
  readonly newsletterSignup: PostkitDefinitionThemeSlots['newsletterSignup'];
  readonly poll: PostkitDefinitionThemeSlots['poll'];
  readonly productCard: PostkitDefinitionThemeSlots['productCard'];
  readonly pullQuote: PostkitDefinitionThemeSlots['pullQuote'];
  readonly relatedContent: PostkitDefinitionThemeSlots['relatedContent'];
  readonly seriesNavigation: PostkitDefinitionThemeSlots['seriesNavigation'];
  readonly shareActions: PostkitDefinitionThemeSlots['shareActions'];
  readonly socialPost: PostkitDefinitionThemeSlots['socialPost'];
  readonly sponsorBlock: PostkitDefinitionThemeSlots['sponsorBlock'];
  readonly stat: PostkitDefinitionThemeSlots['stat'];
  readonly steps: PostkitDefinitionThemeSlots['steps'];
  readonly tabs: PostkitDefinitionThemeSlots['tabs'];
  readonly terminal: PostkitDefinitionThemeSlots['terminal'];
  readonly video: PostkitDefinitionThemeSlots['video'];
  readonly device: PostkitDefinitionThemeSlots['device'];
  readonly prose:
    | 'root'
    | 'h1'
    | 'h2'
    | 'h3'
    | 'h4'
    | 'h5'
    | 'h6'
    | 'p'
    | 'a'
    | 'blockquote'
    | 'ul'
    | 'ol'
    | 'li'
    | 'hr'
    | 'pre'
    | 'code'
    | 'strong'
    | 'em'
    | 'del'
    | 'table'
    | 'thead'
    | 'tbody'
    | 'tr'
    | 'th'
    | 'td'
    | 'img'
    | 'figure'
    | 'figcaption'
    | 'sup'
    | 'sub'
    | 'section'
    | 'dl'
    | 'dt'
    | 'dd'
    | 'kbd'
    | 'mark'
    | 'small'
    | 'details'
    | 'summary'
    | 'input'
    | 'br';
}

/**
 * The recipe variants of every themed component: the props marked
 * `themeVariant` in its definition, plus the recipe-only
 * `linkPreview.compact`.
 */
export interface PostkitThemeVariantMap {
  readonly audienceBoundary: PostkitDefinitionThemeVariants['audienceBoundary'];
  readonly appearsOn: PostkitDefinitionThemeVariants['appearsOn'];
  readonly audio: PostkitDefinitionThemeVariants['audio'];
  readonly authorCard: PostkitDefinitionThemeVariants['authorCard'];
  readonly callout: PostkitDefinitionThemeVariants['callout'];
  readonly callToAction: PostkitDefinitionThemeVariants['callToAction'];
  readonly cardGrid: PostkitDefinitionThemeVariants['cardGrid'];
  readonly carousel: PostkitDefinitionThemeVariants['carousel'];
  readonly chart: PostkitDefinitionThemeVariants['chart'];
  readonly codeBlock: PostkitDefinitionThemeVariants['codeBlock'];
  readonly codeGroup: PostkitDefinitionThemeVariants['codeGroup'];
  readonly comparison: PostkitDefinitionThemeVariants['comparison'];
  readonly diff: PostkitDefinitionThemeVariants['diff'];
  readonly disclosure: PostkitDefinitionThemeVariants['disclosure'];
  readonly figure: PostkitDefinitionThemeVariants['figure'];
  readonly fileCard: PostkitDefinitionThemeVariants['fileCard'];
  readonly fileTree: PostkitDefinitionThemeVariants['fileTree'];
  readonly gallery: PostkitDefinitionThemeVariants['gallery'];
  readonly keyTakeaway: PostkitDefinitionThemeVariants['keyTakeaway'];
  readonly linkPreview: PostkitDefinitionThemeVariants['linkPreview'];
  readonly newsletterSignup: PostkitDefinitionThemeVariants['newsletterSignup'];
  readonly poll: PostkitDefinitionThemeVariants['poll'];
  readonly productCard: PostkitDefinitionThemeVariants['productCard'];
  readonly pullQuote: PostkitDefinitionThemeVariants['pullQuote'];
  readonly relatedContent: PostkitDefinitionThemeVariants['relatedContent'];
  readonly seriesNavigation: PostkitDefinitionThemeVariants['seriesNavigation'];
  readonly shareActions: PostkitDefinitionThemeVariants['shareActions'];
  readonly socialPost: PostkitDefinitionThemeVariants['socialPost'];
  readonly sponsorBlock: PostkitDefinitionThemeVariants['sponsorBlock'];
  readonly stat: PostkitDefinitionThemeVariants['stat'];
  readonly steps: PostkitDefinitionThemeVariants['steps'];
  readonly tabs: PostkitDefinitionThemeVariants['tabs'];
  readonly terminal: PostkitDefinitionThemeVariants['terminal'];
  readonly video: PostkitDefinitionThemeVariants['video'];
  readonly device: PostkitDefinitionThemeVariants['device'];
  readonly prose: never;
}

type PostkitOverrideFor<Name extends keyof PostkitThemeSlotMap> =
  PostkitRecipeOverride<
    PostkitThemeSlotMap[Name],
    PostkitThemeVariantMap[Name]
  >;

export interface PostkitThemeOverrides {
  /** Optional font stacks for Postkit's three independent typography roles. */
  readonly typography?: PostkitTypography;
  readonly audienceBoundary?: PostkitOverrideFor<'audienceBoundary'>;
  readonly appearsOn?: PostkitOverrideFor<'appearsOn'>;
  readonly audio?: PostkitOverrideFor<'audio'>;
  readonly authorCard?: PostkitOverrideFor<'authorCard'>;
  readonly callout?: PostkitOverrideFor<'callout'>;
  readonly callToAction?: PostkitOverrideFor<'callToAction'>;
  readonly carousel?: PostkitOverrideFor<'carousel'>;
  readonly cardGrid?: PostkitOverrideFor<'cardGrid'>;
  readonly chart?: PostkitOverrideFor<'chart'>;
  readonly codeBlock?: PostkitOverrideFor<'codeBlock'>;
  readonly codeGroup?: PostkitOverrideFor<'codeGroup'>;
  readonly comparison?: PostkitOverrideFor<'comparison'>;
  readonly diff?: PostkitOverrideFor<'diff'>;
  readonly figure?: PostkitOverrideFor<'figure'>;
  readonly fileCard?: PostkitOverrideFor<'fileCard'>;
  readonly fileTree?: PostkitOverrideFor<'fileTree'>;
  readonly disclosure?: PostkitOverrideFor<'disclosure'>;
  readonly gallery?: PostkitOverrideFor<'gallery'>;
  readonly keyTakeaway?: PostkitOverrideFor<'keyTakeaway'>;
  readonly linkPreview?: PostkitOverrideFor<'linkPreview'>;
  readonly newsletterSignup?: PostkitOverrideFor<'newsletterSignup'>;
  readonly poll?: PostkitOverrideFor<'poll'>;
  readonly productCard?: PostkitOverrideFor<'productCard'>;
  readonly prose?: PostkitOverrideFor<'prose'>;
  readonly pullQuote?: PostkitOverrideFor<'pullQuote'>;
  readonly relatedContent?: PostkitOverrideFor<'relatedContent'>;
  readonly shareActions?: PostkitOverrideFor<'shareActions'>;
  readonly seriesNavigation?: PostkitOverrideFor<'seriesNavigation'>;
  readonly socialPost?: PostkitOverrideFor<'socialPost'>;
  readonly steps?: PostkitOverrideFor<'steps'>;
  readonly sponsorBlock?: PostkitOverrideFor<'sponsorBlock'>;
  readonly stat?: PostkitOverrideFor<'stat'>;
  readonly tabs?: PostkitOverrideFor<'tabs'>;
  readonly terminal?: PostkitOverrideFor<'terminal'>;
  readonly video?: PostkitOverrideFor<'video'>;
  readonly device?: PostkitOverrideFor<'device'>;
}

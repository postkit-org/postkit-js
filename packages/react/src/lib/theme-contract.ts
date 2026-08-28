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

export interface PostkitThemeSlotMap {
  readonly audienceBoundary: 'root' | 'label' | 'content' | 'fallback';
  readonly appearsOn:
    'root' | 'label' | 'list' | 'item' | 'link' | 'icon' | 'date' | 'status';
  readonly audio: 'root' | 'title' | 'player' | 'caption' | 'fallback';
  readonly authorCard:
    | 'root'
    | 'avatar'
    | 'content'
    | 'header'
    | 'name'
    | 'nameLink'
    | 'role'
    | 'bio'
    | 'links'
    | 'link';
  readonly callout: 'root' | 'icon' | 'content' | 'title' | 'body';
  readonly callToAction:
    | 'root'
    | 'content'
    | 'eyebrow'
    | 'title'
    | 'body'
    | 'actions'
    | 'primaryAction'
    | 'secondaryAction';
  readonly cardGrid:
    | 'root'
    | 'header'
    | 'title'
    | 'description'
    | 'grid'
    | 'card'
    | 'image'
    | 'cardBody'
    | 'cardTitle'
    | 'cardDescription'
    | 'meta'
    | 'link';
  readonly carousel:
    | 'root'
    | 'slide'
    | 'media'
    | 'content'
    | 'title'
    | 'description'
    | 'link'
    | 'controls'
    | 'previousTrigger'
    | 'status'
    | 'nextTrigger'
    | 'emptyState';
  readonly chart:
    | 'root'
    | 'title'
    | 'description'
    | 'legend'
    | 'legendItem'
    | 'legendSwatch'
    | 'plot'
    | 'svg'
    | 'gridLine'
    | 'axisLabel'
    | 'seriesMark'
    | 'emptyState'
    | 'tableContainer'
    | 'table'
    | 'headerCell'
    | 'rowHeader'
    | 'dataCell';
  readonly codeBlock:
    | 'root'
    | 'header'
    | 'title'
    | 'filename'
    | 'language'
    | 'control'
    | 'actions'
    | 'copyTrigger'
    | 'button'
    | 'copyIndicator'
    | 'content'
    | 'scroller'
    | 'code'
    | 'codeText'
    | 'lineContent'
    | 'line'
    | 'lineNumber';
  readonly codeGroup: 'root' | 'tabs' | 'tab' | 'panel';
  readonly comparison:
    | 'root'
    | 'title'
    | 'description'
    | 'scroller'
    | 'table'
    | 'head'
    | 'header'
    | 'row'
    | 'label'
    | 'value';
  readonly diff:
    'root' | 'header' | 'title' | 'code' | 'line' | 'marker' | 'content';
  readonly disclosure: 'root' | 'summary' | 'indicator' | 'content';
  readonly figure:
    | 'root'
    | 'mediaLink'
    | 'media'
    | 'image'
    | 'figcaption'
    | 'caption'
    | 'credit'
    | 'creditLink';
  readonly fileCard:
    'root' | 'icon' | 'content' | 'name' | 'description' | 'meta' | 'action';
  readonly fileTree:
    'root' | 'title' | 'list' | 'item' | 'icon' | 'path' | 'meta';
  readonly gallery:
    | 'root'
    | 'header'
    | 'title'
    | 'description'
    | 'grid'
    | 'item'
    | 'imageLink'
    | 'image'
    | 'caption';
  readonly keyTakeaway: 'root' | 'eyebrow' | 'title' | 'body' | 'list' | 'item';
  readonly linkPreview:
    | 'root'
    | 'anchor'
    | 'media'
    | 'image'
    | 'carousel'
    | 'content'
    | 'siteRow'
    | 'favicon'
    | 'siteName'
    | 'title'
    | 'description'
    | 'domain'
    | 'embedFrame'
    | 'embed'
    | 'consent'
    | 'consentButton'
    | 'mediaPlayer';
  readonly newsletterSignup:
    | 'root'
    | 'content'
    | 'title'
    | 'description'
    | 'form'
    | 'label'
    | 'fields'
    | 'input'
    | 'submit'
    | 'status'
    | 'privacy';
  readonly poll:
    | 'root'
    | 'question'
    | 'description'
    | 'options'
    | 'option'
    | 'optionLabel'
    | 'result'
    | 'bar'
    | 'status';
  readonly productCard:
    | 'root'
    | 'image'
    | 'content'
    | 'badge'
    | 'title'
    | 'description'
    | 'rating'
    | 'footer'
    | 'price'
    | 'action';
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
  readonly pullQuote: 'root' | 'mark' | 'quote' | 'attribution' | 'cite';
  readonly relatedContent:
    | 'root'
    | 'title'
    | 'list'
    | 'item'
    | 'link'
    | 'itemTitle'
    | 'description'
    | 'meta';
  readonly seriesNavigation:
    | 'root'
    | 'header'
    | 'title'
    | 'position'
    | 'links'
    | 'link'
    | 'direction'
    | 'linkTitle';
  readonly shareActions:
    'root' | 'label' | 'actions' | 'action' | 'icon' | 'status';
  readonly socialPost:
    | 'root'
    | 'serviceRow'
    | 'serviceBadge'
    | 'serviceIcon'
    | 'authorRow'
    | 'avatar'
    | 'author'
    | 'authorName'
    | 'handle'
    | 'timestamp'
    | 'content'
    | 'media'
    | 'image'
    | 'metrics'
    | 'metric'
    | 'quote'
    | 'quoteAuthor'
    | 'quoteContent'
    | 'footer'
    | 'originalLink'
    | 'snapshotInfo'
    | 'snapshotLabel'
    | 'snapshotTime'
    | 'embedFrame'
    | 'embed'
    | 'consent'
    | 'consentButton';
  readonly sponsorBlock:
    'root' | 'disclosure' | 'logo' | 'content' | 'name' | 'message' | 'action';
  readonly stat: 'root' | 'value' | 'label' | 'trend' | 'description';
  readonly steps:
    'root' | 'item' | 'marker' | 'content' | 'title' | 'description';
  readonly tabs: 'root' | 'list' | 'tab' | 'panels' | 'panel';
  readonly terminal:
    | 'root'
    | 'header'
    | 'dots'
    | 'title'
    | 'body'
    | 'prompt'
    | 'command'
    | 'output';
  readonly video: 'root' | 'frame' | 'player' | 'caption' | 'fallback';
}

export interface PostkitThemeVariantMap {
  readonly audienceBoundary: 'size' | 'variant';
  readonly appearsOn: 'size' | 'variant' | 'presentation';
  readonly audio: 'size' | 'variant';
  readonly authorCard: 'size' | 'variant' | 'presentation';
  readonly callout: 'size' | 'variant' | 'tone';
  readonly callToAction: 'size' | 'variant' | 'alignment';
  readonly cardGrid: 'size' | 'variant';
  readonly carousel: 'size' | 'variant';
  readonly chart: 'size' | 'variant';
  readonly codeBlock: 'size' | 'variant';
  readonly codeGroup: 'size' | 'variant';
  readonly comparison: 'size' | 'variant';
  readonly diff: 'size' | 'variant';
  readonly disclosure: 'size' | 'variant';
  readonly figure: 'size' | 'variant' | 'layout';
  readonly fileCard: 'size' | 'variant';
  readonly fileTree: 'size' | 'variant';
  readonly gallery: 'size' | 'variant';
  readonly keyTakeaway: 'size' | 'variant';
  readonly linkPreview: 'size' | 'variant' | 'presentation' | 'compact';
  readonly newsletterSignup: 'size' | 'variant' | 'alignment';
  readonly poll: 'size' | 'variant';
  readonly productCard: 'size' | 'variant';
  readonly prose: never;
  readonly pullQuote: 'size' | 'variant';
  readonly relatedContent: 'size' | 'variant';
  readonly seriesNavigation: 'size' | 'variant';
  readonly shareActions: 'size' | 'variant' | 'layout';
  readonly socialPost: 'size' | 'variant' | 'branding' | 'presentation';
  readonly sponsorBlock: 'size' | 'variant';
  readonly stat: 'size' | 'variant';
  readonly steps: 'size' | 'variant';
  readonly tabs: 'size' | 'variant';
  readonly terminal: 'size' | 'variant';
  readonly video: 'size' | 'variant';
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
}

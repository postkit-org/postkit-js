import {
  linkPreviewDefinition,
  postkitTitleElement,
  type PostkitHeadingLevelInput,
  type PostkitSlotOf,
} from '@postkit/core/components';
import type {
  LinkResolverCallback,
  ResolvedLinkImage,
  ResolvedLinkMedia,
  ResolvedLinkPreview,
} from '@postkit/unfurl';
import { useMemo, type CSSProperties, type ReactNode } from 'react';

import { useEmbedConsent } from '../../hooks/use-embed-consent.js';
import { postkitEmbedAspectRatio } from '../../lib/embed-aspect-ratio.js';
import { usePostkitLinkResolution } from '../../lib/link-resolution.js';
import { mergePostkitPartProps } from '../../lib/merge-part.js';
import type { PostkitSocialServiceLabels } from '../../lib/social-service-labels.js';
import { postkitView, type PostkitViewProps } from '../../lib/view.js';
import { Audio } from '../audio/audio.js';
import { Carousel } from '../carousel/carousel.js';
import { SocialPost } from '../social-post/social-post.js';
import { Video } from '../video/video.js';

export type LinkPreviewSlot = PostkitSlotOf<typeof linkPreviewDefinition>;

export type LinkPreviewPresentation =
  'auto' | 'card' | 'embed' | 'inline' | 'media';

export type LinkPreviewProps = Omit<
  PostkitViewProps<typeof linkPreviewDefinition>,
  'metadata' | 'headingLevel'
> & {
  /**
   * Renders the card title as `h2` to `h6`. Unset, the title is a `p`, so
   * the preview never breaks the page's heading outline.
   */
  readonly headingLevel?: PostkitHeadingLevelInput;
  /** A normalized `@postkit/unfurl` result, or its JSON text. */
  readonly metadata?: string | ResolvedLinkPreview;
  /** The inline presentation's link text. */
  readonly children?: ReactNode;
  /**
   * Resolves `href` at runtime when no `metadata` is supplied, as
   * `PostkitProvider`'s resolver does for `@postkit/chakra`. `provider` is
   * passed along as the resolver hint.
   */
  readonly resolveLink?: LinkResolverCallback;
  /** Service labels for a social post this preview renders. */
  readonly socialServices?: PostkitSocialServiceLabels;
  /** The embed iframe's `sandbox`. */
  readonly iframeSandbox?: string;
};

const defaultSandbox =
  'allow-scripts allow-same-origin allow-presentation allow-popups';

function parseMetadata(
  value: string | ResolvedLinkPreview | undefined,
): ResolvedLinkPreview | undefined {
  if (!value) return undefined;
  if (typeof value !== 'string') return value;
  try {
    const parsed: unknown = JSON.parse(value);
    if (typeof parsed !== 'object' || parsed === null) throw new TypeError();
    return parsed as ResolvedLinkPreview;
  } catch {
    throw new TypeError(
      'Postkit LinkPreview metadata must contain valid JSON.',
    );
  }
}

function displayDomain(href: string): string {
  try {
    return new URL(href).hostname.replace(/^www\./, '');
  } catch {
    return href;
  }
}

function withImageOverride(
  images: readonly ResolvedLinkImage[],
  src: string | undefined,
  alt: string | undefined,
): readonly ResolvedLinkImage[] {
  return src
    ? [{ src, alt }, ...images.filter((item) => item.src !== src)]
    : images;
}

function requestedPresentation(
  presentation: LinkPreviewPresentation,
  metadata: ResolvedLinkPreview | undefined,
): Exclude<LinkPreviewPresentation, 'auto'> {
  if (presentation !== 'auto') return presentation;
  if (
    (metadata?.video?.length ?? 0) > 0 ||
    (metadata?.audio?.length ?? 0) > 0
  ) {
    return 'media';
  }
  if (metadata?.embed?.src) return 'embed';
  return 'card';
}

function selectedMedia(
  metadata: ResolvedLinkPreview | undefined,
  preference: 'audio' | 'auto' | 'video',
): { kind: 'audio' | 'video'; item: ResolvedLinkMedia } | undefined {
  if (preference !== 'audio' && metadata?.video?.[0]) {
    return { kind: 'video', item: metadata.video[0] };
  }
  if (preference !== 'video' && metadata?.audio?.[0]) {
    return { kind: 'audio', item: metadata.audio[0] };
  }
  return undefined;
}

/**
 * A link as inline text, a metadata card, a native media player or an
 * isolated embed: headless markup only. With the default `activation:
 * 'click'`, an embed's iframe, and anything else from its origin, enters the
 * page only after the reader presses "Load embed".
 *
 * The consent prompt carries the preview image, when there is one, as the
 * `--postkit-consent-image` custom property for your stylesheet.
 */
export const LinkPreview = postkitView<
  typeof linkPreviewDefinition,
  LinkPreviewProps
>(linkPreviewDefinition, ({ props, part }) => {
  const {
    href,
    children,
    provider,
    imageAlt,
    iframeTitle,
    iframeSandbox = defaultSandbox,
    resolveLink,
    size,
    variant,
  } = props;
  // `unstyled` is consumed by `postkitView`; a delegated SocialPost keeps it.
  const unstyled = part('root')['data-postkit-unstyled'] !== undefined;
  const presentation = props.presentation ?? 'card';
  const imageMode = props.images ?? 'first';
  const mediaPreference = props.media ?? 'auto';
  const suppliedMetadata = useMemo(
    () => parseMetadata(props.metadata),
    [props.metadata],
  );
  const resolution = usePostkitLinkResolution(
    href,
    provider,
    resolveLink,
    !suppliedMetadata,
  );
  const consent = useEmbedConsent({ activation: props.activation });
  const metadata = suppliedMetadata ?? resolution.metadata;
  const resolutionStatus = suppliedMetadata ? 'provided' : resolution.status;
  const resolvedPresentation = requestedPresentation(presentation, metadata);
  const title = props.title ?? metadata?.title;
  const Title = postkitTitleElement(props.headingLevel);
  const description = props.description ?? metadata?.description;
  const siteName = props.siteName ?? metadata?.siteName ?? displayDomain(href);
  const favicon = props.favicon ?? metadata?.favicon;
  const embed = metadata?.embed;
  const resolvedImages =
    metadata?.images.length || !embed?.thumbnail
      ? (metadata?.images ?? [])
      : [embed.thumbnail];
  const availableImages = withImageOverride(
    resolvedImages,
    props.image,
    imageAlt,
  );
  const domain = displayDomain(metadata?.url ?? href);
  const mediaItem = selectedMedia(metadata, mediaPreference);

  if (presentation === 'auto' && metadata?.social) {
    return (
      <SocialPost
        href={href}
        metadata={metadata}
        provider={provider}
        service={metadata.social.service}
        presentation="card"
        size={size}
        variant={variant}
        unstyled={unstyled}
        socialServices={props.socialServices}
      />
    );
  }

  if (resolvedPresentation === 'inline') {
    return (
      <span
        data-postkit-provider={provider ?? metadata?.provider?.id}
        data-postkit-resolution={resolutionStatus}
        {...part('root')}
      >
        <a href={href} {...part('anchor')}>
          {children ?? title ?? href}
        </a>
      </span>
    );
  }

  // The title leads the source so the card link's accessible name, taken
  // from its content, starts with the visible title (WCAG 2.5.3). Styles
  // show the site row above it.
  const siteContent = (
    <div {...part('content')}>
      <Title {...part('title')}>{title ?? domain}</Title>
      <div {...part('siteRow')}>
        {favicon ? (
          <img src={favicon} alt="" loading="lazy" {...part('favicon')} />
        ) : null}
        <span {...part('siteName')}>{siteName}</span>
      </div>
      {description ? <p {...part('description')}>{description}</p> : null}
      <p {...part('domain')}>{domain}</p>
    </div>
  );

  let primaryContent: ReactNode;
  if (resolvedPresentation === 'media' && mediaItem) {
    primaryContent = (
      <div {...part('mediaPlayer')}>
        {mediaItem.kind === 'video' ? (
          <Video
            src={mediaItem.item.src}
            title={title ?? `Video from ${siteName}`}
            poster={mediaItem.item.poster ?? availableImages[0]?.src}
            aspectRatio={
              mediaItem.item.width && mediaItem.item.height
                ? `${mediaItem.item.width} / ${mediaItem.item.height}`
                : undefined
            }
            size={size}
            variant={variant}
          />
        ) : (
          <Audio
            src={mediaItem.item.src}
            title={title ?? `Audio from ${siteName}`}
            size={size}
            variant={variant}
          />
        )}
      </div>
    );
  } else if (
    (resolvedPresentation === 'embed' ||
      (resolvedPresentation === 'media' && !mediaItem)) &&
    embed?.src &&
    embed.type !== 'photo'
  ) {
    const consentImage = availableImages[0];
    primaryContent = (
      <div
        {...mergePostkitPartProps(
          consent.getRootProps(),
          part('embedFrame', {
            style: { aspectRatio: postkitEmbedAspectRatio(embed.aspectRatio) },
          }),
        )}
      >
        {consent.shouldRenderFrame ? (
          <iframe
            {...mergePostkitPartProps(consent.getFrameProps(), part('embed'))}
            src={embed.src}
            title={
              iframeTitle ?? embed.title ?? title ?? `Embed from ${siteName}`
            }
            sandbox={iframeSandbox}
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            allow="accelerometer; autoplay; encrypted-media; fullscreen; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div
            {...mergePostkitPartProps(
              consent.getPromptProps(),
              part('consent', {
                style: consentImage
                  ? ({
                      '--postkit-consent-image': `url("${consentImage.src.replaceAll('"', '\\"')}")`,
                    } as CSSProperties)
                  : undefined,
              }),
            )}
          >
            <p>Load interactive content from {siteName}?</p>
            <button
              {...mergePostkitPartProps(
                consent.getRequestTriggerProps(),
                part('consentButton'),
              )}
            >
              Load embed
            </button>
          </div>
        )}
      </div>
    );
  } else {
    const shownImages =
      imageMode === 'none'
        ? []
        : imageMode === 'carousel'
          ? availableImages
          : availableImages.slice(0, 1);
    primaryContent =
      shownImages.length > 1 ? (
        <div {...part('carousel')}>
          <Carousel
            label={`${title ?? siteName} images`}
            size={size}
            variant="plain"
            items={shownImages.map((item, index) => ({
              id: `${index}-${item.src}`,
              image: { src: item.src, alt: item.alt ?? '' },
              href,
            }))}
          />
        </div>
      ) : shownImages[0] ? (
        <a
          href={href}
          aria-label={`Open ${title ?? domain}`}
          {...part('media')}
        >
          <img
            src={shownImages[0].src}
            alt={shownImages[0].alt ?? ''}
            width={shownImages[0].width}
            height={shownImages[0].height}
            loading="lazy"
            {...part('image')}
          />
        </a>
      ) : null;
  }

  return (
    <article
      data-postkit-presentation={resolvedPresentation}
      data-postkit-provider={provider ?? metadata?.provider?.id}
      data-postkit-resolution={resolutionStatus}
      {...part('root')}
    >
      {primaryContent}
      <a href={href} {...part('anchor')}>
        {siteContent}
      </a>
    </article>
  );
});

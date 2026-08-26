'use client';

import type {
  ResolvedLinkImage,
  ResolvedLinkMedia,
  ResolvedLinkPreview,
} from '@postkit/unfurl';
import {
  Box,
  Button,
  chakra,
  Flex,
  Image,
  Link,
  Text,
  type BoxProps,
  type RecipeVariantProps,
  type UnstyledProp,
} from '@chakra-ui/react';
import { type ReactNode, useEffect, useMemo, useState } from 'react';

import { usePostkit } from '../provider.js';
import { Audio } from './audio.js';
import { Carousel } from './carousel.js';
import { SocialPost } from './social-post.js';
import { Video } from './video.js';
import {
  postkitLinkPreviewRecipe,
  type PostkitLinkPreviewSlot,
} from '../recipes/link-preview.recipe.js';
import {
  postkitSlotClassName,
  type PostkitSlotStyles,
  usePostkitSlotRecipe,
} from '../recipes/types.js';
import { postkitRecipeKeys } from '../theme.js';

const LinkPreviewIframe = chakra('iframe');

export type LinkPreviewPresentation =
  'auto' | 'card' | 'embed' | 'inline' | 'media';

export type LinkPreviewProps = {
  readonly href: string;
  readonly metadata?: string | ResolvedLinkPreview;
  readonly children?: ReactNode;
  readonly presentation?: LinkPreviewPresentation;
  readonly images?: 'carousel' | 'first' | 'none';
  readonly media?: 'audio' | 'auto' | 'video';
  readonly activation?: 'click' | 'immediate';
  /**
   * Selects a registered resolver. Build/editor integrations may consume this
   * as a hint, and PostkitProvider passes it to its configured resolver.
   */
  readonly provider?: string;
  readonly title?: string;
  readonly description?: string;
  readonly siteName?: string;
  readonly image?: string;
  readonly imageAlt?: string;
  readonly favicon?: string;
  readonly iframeTitle?: string;
  readonly iframeSandbox?: string;
  readonly rootProps?: BoxProps;
  readonly slotStyles?: PostkitSlotStyles<PostkitLinkPreviewSlot>;
} & RecipeVariantProps<typeof postkitLinkPreviewRecipe> &
  UnstyledProp;

function parseMetadata(
  value: string | ResolvedLinkPreview | undefined,
): ResolvedLinkPreview | undefined {
  if (!value) return undefined;
  if (typeof value !== 'string') return value;
  try {
    const parsed: unknown = JSON.parse(value);
    if (typeof parsed !== 'object' || parsed === null) {
      throw new TypeError();
    }
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

export function LinkPreview({
  href,
  metadata: metadataValue,
  children,
  presentation = 'card',
  images: imageMode = 'first',
  media: mediaPreference = 'auto',
  activation = 'click',
  provider,
  title: titleOverride,
  description: descriptionOverride,
  siteName: siteNameOverride,
  image: imageOverride,
  imageAlt,
  favicon: faviconOverride,
  iframeTitle,
  iframeSandbox = 'allow-scripts allow-same-origin allow-presentation allow-popups',
  rootProps,
  slotStyles,
  size,
  variant,
  unstyled,
}: LinkPreviewProps) {
  const suppliedMetadata = useMemo(
    () => parseMetadata(metadataValue),
    [metadataValue],
  );
  const { resolveLink } = usePostkit();
  const resolutionKey = `${provider ?? ''}\u0000${href}`;
  const [resolution, setResolution] = useState<{
    readonly key: string;
    readonly status: 'error' | 'idle' | 'loading' | 'resolved';
    readonly metadata?: ResolvedLinkPreview;
  }>({
    key: resolutionKey,
    status: 'idle',
  });
  const runtimeMetadata =
    resolution.key === resolutionKey ? resolution.metadata : undefined;
  const metadata = suppliedMetadata ?? runtimeMetadata;
  const resolutionStatus = suppliedMetadata
    ? 'provided'
    : resolution.key === resolutionKey
      ? resolution.status
      : 'idle';

  useEffect(() => {
    if (suppliedMetadata || !resolveLink) {
      return;
    }

    const controller = new AbortController();
    let active = true;
    setResolution({ key: resolutionKey, status: 'loading' });

    void resolveLink(href, {
      provider,
      signal: controller.signal,
    }).then(
      (resolved) => {
        if (active) {
          setResolution({
            key: resolutionKey,
            status: 'resolved',
            metadata: resolved,
          });
        }
      },
      () => {
        if (active && !controller.signal.aborted) {
          setResolution({ key: resolutionKey, status: 'error' });
        }
      },
    );

    return () => {
      active = false;
      controller.abort();
    };
  }, [href, provider, resolutionKey, resolveLink, suppliedMetadata]);

  const resolvedPresentation = requestedPresentation(presentation, metadata);
  const recipe = usePostkitSlotRecipe(
    postkitRecipeKeys.linkPreview,
    postkitLinkPreviewRecipe,
  );
  const compact = resolvedPresentation === 'card' && size === 'sm';
  const styles: PostkitSlotStyles<PostkitLinkPreviewSlot> = unstyled
    ? {}
    : recipe({
        size,
        variant,
        presentation: resolvedPresentation,
        compact,
      });
  const {
    css: rootCss,
    className: rootClassName,
    ...restRootProps
  } = rootProps ?? {};
  const [embedActive, setEmbedActive] = useState(activation === 'immediate');
  const title = titleOverride ?? metadata?.title;
  const description = descriptionOverride ?? metadata?.description;
  const siteName =
    siteNameOverride ?? metadata?.siteName ?? displayDomain(href);
  const favicon = faviconOverride ?? metadata?.favicon;
  const embed = metadata?.embed;
  const resolvedImages =
    metadata?.images.length || !embed?.thumbnail
      ? (metadata?.images ?? [])
      : [embed.thumbnail];
  const availableImages = withImageOverride(
    resolvedImages,
    imageOverride,
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
      />
    );
  }

  if (resolvedPresentation === 'inline') {
    return (
      <Box
        as="span"
        data-postkit-component="LinkPreview"
        data-postkit-provider={provider ?? metadata?.provider?.id}
        data-postkit-resolution={resolutionStatus}
        {...restRootProps}
        className={postkitSlotClassName(
          recipe.classNameMap.root,
          rootClassName,
        )}
        css={[styles.root, slotStyles?.root, rootCss]}
      >
        <Link
          href={href}
          className={recipe.classNameMap.anchor}
          css={[styles.anchor, slotStyles?.anchor]}
        >
          {children ?? title ?? href}
        </Link>
      </Box>
    );
  }

  const siteContent = (
    <Box
      className={recipe.classNameMap.content}
      css={[styles.content, slotStyles?.content]}
    >
      <Flex
        className={recipe.classNameMap.siteRow}
        css={[styles.siteRow, slotStyles?.siteRow]}
      >
        {favicon ? (
          <Image
            src={favicon}
            alt=""
            loading="lazy"
            className={recipe.classNameMap.favicon}
            css={[styles.favicon, slotStyles?.favicon]}
          />
        ) : null}
        <Text
          as="span"
          className={recipe.classNameMap.siteName}
          css={[styles.siteName, slotStyles?.siteName]}
        >
          {siteName}
        </Text>
      </Flex>
      <Text
        as="h3"
        className={recipe.classNameMap.title}
        css={[styles.title, slotStyles?.title]}
      >
        {title ?? domain}
      </Text>
      {description ? (
        <Text
          className={recipe.classNameMap.description}
          css={[styles.description, slotStyles?.description]}
        >
          {description}
        </Text>
      ) : null}
      <Text
        className={recipe.classNameMap.domain}
        css={[styles.domain, slotStyles?.domain]}
      >
        {domain}
      </Text>
    </Box>
  );

  let primaryContent: ReactNode;
  if (resolvedPresentation === 'media' && mediaItem) {
    primaryContent = (
      <Box
        className={recipe.classNameMap.mediaPlayer}
        css={[styles.mediaPlayer, slotStyles?.mediaPlayer]}
      >
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
      </Box>
    );
  } else if (
    (resolvedPresentation === 'embed' ||
      (resolvedPresentation === 'media' && !mediaItem)) &&
    embed?.src &&
    embed.type !== 'photo'
  ) {
    primaryContent = (
      <Box
        className={recipe.classNameMap.embedFrame}
        css={[
          styles.embedFrame,
          embed.aspectRatio
            ? { aspectRatio: String(embed.aspectRatio) }
            : undefined,
          slotStyles?.embedFrame,
        ]}
      >
        {embedActive ? (
          <LinkPreviewIframe
            src={embed.src}
            title={
              iframeTitle ?? embed.title ?? title ?? `Embed from ${siteName}`
            }
            sandbox={iframeSandbox}
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            allow="accelerometer; autoplay; encrypted-media; fullscreen; picture-in-picture"
            allowFullScreen
            className={recipe.classNameMap.embed}
            css={[styles.embed, slotStyles?.embed]}
          />
        ) : (
          <Box
            className={recipe.classNameMap.consent}
            css={[
              styles.consent,
              availableImages[0]
                ? {
                    backgroundImage: `linear-gradient(rgba(0,0,0,.62), rgba(0,0,0,.62)), url("${availableImages[0].src.replaceAll('"', '\\"')}")`,
                    backgroundPosition: 'center',
                    backgroundSize: 'cover',
                    color: 'white',
                  }
                : undefined,
              slotStyles?.consent,
            ]}
          >
            <Text>Load interactive content from {siteName}?</Text>
            <Button
              type="button"
              onClick={() => setEmbedActive(true)}
              className={recipe.classNameMap.consentButton}
              css={[styles.consentButton, slotStyles?.consentButton]}
            >
              Load embed
            </Button>
          </Box>
        )}
      </Box>
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
        <Box
          className={recipe.classNameMap.carousel}
          css={[styles.carousel, slotStyles?.carousel]}
        >
          <Carousel
            label={`${title ?? siteName} images`}
            size={size}
            variant="plain"
            items={shownImages.map((item, index) => ({
              id: `${index}-${item.src}`,
              image: {
                src: item.src,
                alt: item.alt ?? '',
              },
              href,
            }))}
          />
        </Box>
      ) : shownImages[0] ? (
        <Link
          href={href}
          aria-label={`Open ${title ?? domain}`}
          className={recipe.classNameMap.media}
          css={[styles.media, slotStyles?.media]}
        >
          <Image
            src={shownImages[0].src}
            alt={shownImages[0].alt ?? ''}
            htmlWidth={shownImages[0].width}
            htmlHeight={shownImages[0].height}
            loading="lazy"
            className={recipe.classNameMap.image}
            css={[styles.image, slotStyles?.image]}
          />
        </Link>
      ) : null;
  }

  return (
    <Box
      as="article"
      data-postkit-component="LinkPreview"
      data-postkit-presentation={resolvedPresentation}
      data-postkit-provider={provider ?? metadata?.provider?.id}
      data-postkit-resolution={resolutionStatus}
      {...restRootProps}
      className={postkitSlotClassName(recipe.classNameMap.root, rootClassName)}
      css={[styles.root, slotStyles?.root, rootCss]}
    >
      {primaryContent}
      <Link
        href={href}
        aria-label={`Open ${title ?? domain}`}
        className={recipe.classNameMap.anchor}
        css={[styles.anchor, slotStyles?.anchor]}
      >
        {siteContent}
      </Link>
    </Box>
  );
}

'use client';

import {
  isPostkitSocialPostSnapshot,
  type PostkitSocialPostSnapshot,
  type ResolvedLinkPreview,
  type ResolvedSocialPost,
} from '@postkit/unfurl';
import {
  AspectRatio,
  Box,
  Button,
  Card,
  chakra,
  Flex,
  Image,
  Link,
  Text,
  type BoxProps,
  type RecipeVariantProps,
  type UnstyledProp,
} from '@chakra-ui/react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';

import { usePostkit } from '../provider.js';
import {
  postkitSocialPostRecipe,
  type PostkitSocialPostSlot,
} from '../recipes/social-post.recipe.js';
import {
  postkitSlotClassName,
  type PostkitSlotStyles,
  usePostkitSlotRecipe,
} from '../recipes/types.js';
import { postkitRecipeKeys } from '../theme.js';
import { numericAspectRatio } from './aspect-ratio.js';

const SocialPostIframe = chakra('iframe');
const SocialPostQuote = chakra('blockquote');
const SocialPostTime = chakra('time');

export type SocialPostResolution = 'live' | 'snapshot' | 'snapshot-fallback';

export type SocialPostSnapshotInfo = 'auto' | 'visible' | 'hidden';

export type SocialPostProps = {
  readonly href: string;
  readonly metadata?:
    | string
    | PostkitSocialPostSnapshot
    | ResolvedLinkPreview
    | ResolvedSocialPost;
  readonly resolution?: SocialPostResolution;
  readonly snapshotInfo?: SocialPostSnapshotInfo;
  readonly provider?: string;
  readonly service?: string;
  readonly authorName?: string;
  readonly authorHandle?: string;
  readonly authorAvatar?: string;
  readonly text?: string;
  readonly publishedAt?: string;
  readonly showMetrics?: boolean | string;
  readonly activation?: 'click' | 'immediate';
  readonly iframeTitle?: string;
  readonly iframeSandbox?: string;
  readonly rootProps?: BoxProps;
  readonly slotStyles?: PostkitSlotStyles<PostkitSocialPostSlot>;
} & RecipeVariantProps<typeof postkitSocialPostRecipe> &
  UnstyledProp;

function parsedMetadata(value: SocialPostProps['metadata']): {
  readonly metadata?: ResolvedLinkPreview | ResolvedSocialPost;
  readonly snapshot?: PostkitSocialPostSnapshot;
} {
  if (!value) return {};
  let parsed: unknown = value;
  try {
    if (typeof value === 'string') parsed = JSON.parse(value);
    if (!parsed || typeof parsed !== 'object') throw new TypeError();
    if (isPostkitSocialPostSnapshot(parsed)) {
      return { metadata: parsed.metadata, snapshot: parsed };
    }
    return { metadata: parsed as ResolvedLinkPreview | ResolvedSocialPost };
  } catch {
    throw new TypeError(
      'Postkit SocialPost metadata must contain valid metadata or a versioned snapshot.',
    );
  }
}

function isPreview(
  value: ResolvedLinkPreview | ResolvedSocialPost | undefined,
): value is ResolvedLinkPreview {
  return Boolean(value && 'requestedUrl' in value);
}

function enabled(value: boolean | string | undefined, fallback: boolean) {
  if (value === undefined) return fallback;
  return typeof value === 'boolean' ? value : value === 'true';
}

function readableDate(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.valueOf())
    ? value
    : new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(date);
}

function metricLabel(value: number | undefined, label: string) {
  return value === undefined ? undefined : `${value} ${label}`;
}

export function SocialPost({
  href,
  metadata: metadataValue,
  resolution: resolutionMode = 'snapshot-fallback',
  snapshotInfo = 'auto',
  provider,
  service: serviceOverride,
  authorName,
  authorHandle,
  authorAvatar,
  text: textOverride,
  publishedAt,
  showMetrics = false,
  activation = 'click',
  iframeTitle,
  iframeSandbox = 'allow-scripts allow-same-origin allow-presentation allow-popups',
  rootProps,
  slotStyles,
  branding,
  presentation = 'auto',
  size,
  variant,
  unstyled,
}: SocialPostProps) {
  const parsed = useMemo(() => parsedMetadata(metadataValue), [metadataValue]);
  const supplied = resolutionMode === 'live' ? undefined : parsed.metadata;
  const snapshot = resolutionMode === 'live' ? undefined : parsed.snapshot;
  const { resolveLink, socialServices } = usePostkit();
  const resolutionKey = `${provider ?? ''}\u0000${href}`;
  const [resolution, setResolution] = useState<{
    readonly key: string;
    readonly status: 'error' | 'idle' | 'loading' | 'resolved';
    readonly metadata?: ResolvedLinkPreview;
  }>({ key: resolutionKey, status: 'idle' });
  const runtimePreview =
    resolutionMode !== 'snapshot' && resolution.key === resolutionKey
      ? resolution.metadata
      : undefined;
  const preview = isPreview(supplied)
    ? supplied
    : supplied
      ? undefined
      : runtimePreview;
  const social = isPreview(supplied) ? supplied.social : supplied;
  const resolvedSocial = social ?? preview?.social;
  const serviceId =
    serviceOverride ?? resolvedSocial?.service ?? preview?.siteName ?? 'social';
  const service = socialServices[serviceId];
  const resolvedPresentation =
    presentation === 'auto'
      ? resolvedSocial
        ? 'card'
        : preview?.embed?.src
          ? 'embed'
          : 'card'
      : presentation;
  const resolutionStatus = supplied
    ? snapshot
      ? 'snapshot'
      : 'provided'
    : resolution.key === resolutionKey
      ? resolution.status
      : 'idle';
  const recipe = usePostkitSlotRecipe(
    postkitRecipeKeys.socialPost,
    postkitSocialPostRecipe,
  );
  const styles: PostkitSlotStyles<PostkitSocialPostSlot> = unstyled
    ? {}
    : recipe({
        branding,
        presentation: resolvedPresentation,
        size,
        variant,
      });
  const {
    css: rootCss,
    className: rootClassName,
    ...restRootProps
  } = rootProps ?? {};
  const [embedActive, setEmbedActive] = useState(activation === 'immediate');

  useEffect(() => {
    if (supplied || !resolveLink || resolutionMode === 'snapshot') return;
    const controller = new AbortController();
    let active = true;
    setResolution({ key: resolutionKey, status: 'loading' });
    void resolveLink(href, {
      provider,
      signal: controller.signal,
    }).then(
      (metadata) => {
        if (active) {
          setResolution({
            key: resolutionKey,
            status: 'resolved',
            metadata,
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
  }, [href, provider, resolutionKey, resolutionMode, resolveLink, supplied]);

  const author = resolvedSocial?.author;
  const displayedAuthor = authorName ?? author?.name ?? preview?.author;
  const displayedHandle = authorHandle ?? author?.handle;
  const avatar = authorAvatar ?? author?.avatar;
  const postText = textOverride ?? resolvedSocial?.text ?? preview?.description;
  const timestamp = publishedAt ?? resolvedSocial?.publishedAt;
  const formattedTimestamp = readableDate(timestamp);
  const formattedCaptureTime = readableDate(snapshot?.capturedAt);
  const formattedResolvedTime =
    snapshot?.resolvedAt && snapshot.resolvedAt !== snapshot.capturedAt
      ? readableDate(snapshot.resolvedAt)
      : undefined;
  const cacheProvenance = snapshot
    ? [
        snapshot.cacheResult ? `cache ${snapshot.cacheResult}` : undefined,
        snapshot.cacheStrategy && snapshot.cacheStrategy !== 'use'
          ? `${snapshot.cacheStrategy} strategy`
          : undefined,
      ]
        .filter(Boolean)
        .join(' · ')
    : '';
  const snapshotVisible =
    Boolean(snapshot) &&
    (snapshotInfo === 'visible' || snapshotInfo === 'auto');
  const postUrl = resolvedSocial?.url ?? preview?.url ?? href;
  const embed = preview?.embed;
  const metrics = enabled(showMetrics, false)
    ? [
        metricLabel(resolvedSocial?.metrics?.replies, 'replies'),
        metricLabel(resolvedSocial?.metrics?.reposts, 'reposts'),
        metricLabel(resolvedSocial?.metrics?.likes, 'likes'),
        metricLabel(resolvedSocial?.metrics?.shares, 'shares'),
      ].filter((metric): metric is string => Boolean(metric))
    : [];
  const snapshotProvenance =
    snapshotVisible && snapshot ? (
      <Box
        data-postkit-snapshot-captured-at={snapshot.capturedAt}
        className={recipe.classNameMap.snapshotInfo}
        css={[styles.snapshotInfo, slotStyles?.snapshotInfo]}
      >
        <Text
          className={recipe.classNameMap.snapshotLabel}
          css={[styles.snapshotLabel, slotStyles?.snapshotLabel]}
        >
          Snapshot captured{' '}
          <SocialPostTime
            dateTime={snapshot.capturedAt}
            className={recipe.classNameMap.snapshotTime}
            css={[styles.snapshotTime, slotStyles?.snapshotTime]}
          >
            {formattedCaptureTime ?? snapshot.capturedAt}
          </SocialPostTime>{' '}
          via {snapshot.resolver.id}
        </Text>
        {formattedResolvedTime ? (
          <Text
            className={recipe.classNameMap.snapshotLabel}
            css={[styles.snapshotLabel, slotStyles?.snapshotLabel]}
          >
            Resolver data fetched{' '}
            <SocialPostTime
              dateTime={snapshot.resolvedAt}
              className={recipe.classNameMap.snapshotTime}
              css={[styles.snapshotTime, slotStyles?.snapshotTime]}
            >
              {formattedResolvedTime}
            </SocialPostTime>
            {cacheProvenance ? ` · ${cacheProvenance}` : ''}
          </Text>
        ) : null}
      </Box>
    ) : null;

  let primaryContent: ReactNode;
  if (resolvedPresentation === 'embed' && embed?.src) {
    primaryContent = (
      <AspectRatio
        ratio={numericAspectRatio(embed.aspectRatio)}
        className={recipe.classNameMap.embedFrame}
        css={[styles.embedFrame, slotStyles?.embedFrame]}
      >
        {embedActive ? (
          <SocialPostIframe
            src={embed.src}
            title={
              iframeTitle ??
              embed.title ??
              `Post from ${service?.label ?? serviceId}`
            }
            sandbox={iframeSandbox}
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            allow="encrypted-media; fullscreen; picture-in-picture"
            allowFullScreen
            className={recipe.classNameMap.embed}
            css={[styles.embed, slotStyles?.embed]}
          />
        ) : (
          <Box
            className={recipe.classNameMap.consent}
            css={[styles.consent, slotStyles?.consent]}
          >
            <Text>
              Load interactive content from {service?.label ?? serviceId}?
            </Text>
            <Button
              type="button"
              onClick={() => setEmbedActive(true)}
              className={recipe.classNameMap.consentButton}
              css={[styles.consentButton, slotStyles?.consentButton]}
            >
              Load post
            </Button>
          </Box>
        )}
      </AspectRatio>
    );
  } else {
    primaryContent = (
      <>
        <Flex
          className={recipe.classNameMap.serviceRow}
          css={[styles.serviceRow, slotStyles?.serviceRow]}
        >
          <Box
            as="span"
            data-postkit-service={serviceId}
            className={recipe.classNameMap.serviceBadge}
            css={[
              styles.serviceBadge,
              service?.accent ? { color: service.accent } : undefined,
              slotStyles?.serviceBadge,
            ]}
          >
            <Box
              as="span"
              aria-hidden={service?.icon ? undefined : true}
              className={recipe.classNameMap.serviceIcon}
              css={[styles.serviceIcon, slotStyles?.serviceIcon]}
            >
              {service?.icon ??
                (service?.label ?? serviceId).slice(0, 1).toUpperCase()}
            </Box>
            {service?.label ?? serviceId}
          </Box>
          {formattedTimestamp ? (
            <SocialPostTime
              dateTime={timestamp}
              className={recipe.classNameMap.timestamp}
              css={[styles.timestamp, slotStyles?.timestamp]}
            >
              {formattedTimestamp}
            </SocialPostTime>
          ) : null}
        </Flex>
        {displayedAuthor || displayedHandle || avatar ? (
          <Flex
            className={recipe.classNameMap.authorRow}
            css={[styles.authorRow, slotStyles?.authorRow]}
          >
            {avatar ? (
              <Image
                src={avatar}
                alt=""
                loading="lazy"
                className={recipe.classNameMap.avatar}
                css={[styles.avatar, slotStyles?.avatar]}
              />
            ) : null}
            <Box
              className={recipe.classNameMap.author}
              css={[styles.author, slotStyles?.author]}
            >
              {displayedAuthor ? (
                <Text
                  className={recipe.classNameMap.authorName}
                  css={[styles.authorName, slotStyles?.authorName]}
                >
                  {displayedAuthor}
                </Text>
              ) : null}
              {displayedHandle ? (
                <Text
                  className={recipe.classNameMap.handle}
                  css={[styles.handle, slotStyles?.handle]}
                >
                  {displayedHandle}
                </Text>
              ) : null}
            </Box>
          </Flex>
        ) : null}
        {postText ? (
          <SocialPostQuote
            cite={postUrl}
            className={recipe.classNameMap.content}
            css={[styles.content, slotStyles?.content]}
          >
            {postText}
          </SocialPostQuote>
        ) : null}
        {resolvedSocial?.images[0] ? (
          <Box
            className={recipe.classNameMap.media}
            css={[styles.media, slotStyles?.media]}
          >
            <Image
              src={resolvedSocial.images[0].src}
              alt={resolvedSocial.images[0].alt ?? ''}
              loading="lazy"
              className={recipe.classNameMap.image}
              css={[styles.image, slotStyles?.image]}
            />
          </Box>
        ) : null}
        {resolvedSocial?.quotedPost ? (
          <Box
            className={recipe.classNameMap.quote}
            css={[styles.quote, slotStyles?.quote]}
          >
            <Text
              className={recipe.classNameMap.quoteAuthor}
              css={[styles.quoteAuthor, slotStyles?.quoteAuthor]}
            >
              {resolvedSocial.quotedPost.author?.name ??
                resolvedSocial.quotedPost.author?.handle ??
                socialServices[resolvedSocial.quotedPost.service]?.label ??
                resolvedSocial.quotedPost.service}
            </Text>
            {resolvedSocial.quotedPost.text ? (
              <Text
                className={recipe.classNameMap.quoteContent}
                css={[styles.quoteContent, slotStyles?.quoteContent]}
              >
                {resolvedSocial.quotedPost.text}
              </Text>
            ) : null}
          </Box>
        ) : null}
        {metrics.length ? (
          <Flex
            aria-label="Post engagement"
            className={recipe.classNameMap.metrics}
            css={[styles.metrics, slotStyles?.metrics]}
          >
            {metrics.map((metric) => (
              <Text
                as="span"
                key={metric}
                className={recipe.classNameMap.metric}
                css={[styles.metric, slotStyles?.metric]}
              >
                {metric}
              </Text>
            ))}
          </Flex>
        ) : null}
        <Flex
          className={recipe.classNameMap.footer}
          css={[styles.footer, slotStyles?.footer]}
        >
          <Link
            href={postUrl}
            className={recipe.classNameMap.originalLink}
            css={[styles.originalLink, slotStyles?.originalLink]}
          >
            View original
          </Link>
        </Flex>
      </>
    );
  }

  return (
    <Card.Root
      as="article"
      data-postkit-component="SocialPost"
      data-postkit-provider={provider ?? preview?.provider.id}
      data-postkit-service={serviceId}
      data-postkit-resolution={resolutionStatus}
      data-postkit-resolution-mode={resolutionMode}
      {...restRootProps}
      className={postkitSlotClassName(recipe.classNameMap.root, rootClassName)}
      css={[styles.root, slotStyles?.root, rootCss]}
    >
      {primaryContent}
      {snapshotProvenance}
    </Card.Root>
  );
}

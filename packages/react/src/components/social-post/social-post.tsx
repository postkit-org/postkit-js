import {
  socialPostDefinition,
  type PostkitSlotOf,
} from '@postkit/core/components';
import {
  isPostkitSocialPostSnapshot,
  type LinkResolverCallback,
  type PostkitSocialPostSnapshot,
  type ResolvedLinkPreview,
  type ResolvedSocialPost,
} from '@postkit/unfurl';
import { useMemo, type ReactNode } from 'react';

import { useEmbedConsent } from '../../hooks/use-embed-consent.js';
import { postkitEmbedAspectRatio } from '../../lib/embed-aspect-ratio.js';
import { usePostkitLinkResolution } from '../../lib/link-resolution.js';
import { mergePostkitPartProps } from '../../lib/merge-part.js';
import {
  postkitSocialServiceLabels,
  type PostkitSocialServiceLabels,
} from '../../lib/social-service-labels.js';
import { postkitView, type PostkitViewProps } from '../../lib/view.js';

export type SocialPostSlot = PostkitSlotOf<typeof socialPostDefinition>;

/** SocialPost `metadata`: a snapshot, an unfurl result, a post, or JSON. */
export type SocialPostMetadata =
  string | PostkitSocialPostSnapshot | ResolvedLinkPreview | ResolvedSocialPost;

export type SocialPostProps = Omit<
  PostkitViewProps<typeof socialPostDefinition>,
  'metadata' | 'showMetrics'
> & {
  readonly metadata?: SocialPostMetadata;
  readonly showMetrics?: boolean | string;
  /**
   * Resolves the post at runtime when no metadata is supplied (and
   * `resolution` isn't `snapshot`), as `PostkitProvider`'s resolver does for
   * `@postkit/chakra`.
   */
  readonly resolveLink?: LinkResolverCallback;
  /** Service labels and icons, layered over Postkit's defaults. */
  readonly socialServices?: PostkitSocialServiceLabels;
  /** The provider iframe's `sandbox`. */
  readonly iframeSandbox?: string;
};

const defaultSandbox =
  'allow-scripts allow-same-origin allow-presentation allow-popups';

function parsedMetadata(value: SocialPostMetadata | undefined): {
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

/**
 * A social post as a native card, or the provider's embed behind a consent
 * prompt: headless markup only. With the default `activation: 'click'`,
 * nothing from the embed's origin is in the page until the reader presses
 * "Load post".
 */
export const SocialPost = postkitView<
  typeof socialPostDefinition,
  SocialPostProps
>(socialPostDefinition, ({ props, part }) => {
  const {
    href,
    provider,
    authorName,
    authorHandle,
    authorAvatar,
    text: textOverride,
    publishedAt,
    iframeTitle,
    iframeSandbox = defaultSandbox,
    resolveLink,
  } = props;
  const resolutionMode = props.resolution ?? 'snapshot-fallback';
  const snapshotInfo = props.snapshotInfo ?? 'auto';
  const presentation = props.presentation ?? 'auto';
  const parsed = useMemo(
    () => parsedMetadata(props.metadata),
    [props.metadata],
  );
  const supplied = resolutionMode === 'live' ? undefined : parsed.metadata;
  const snapshot = resolutionMode === 'live' ? undefined : parsed.snapshot;
  const socialServices = useMemo(
    () => postkitSocialServiceLabels(props.socialServices),
    [props.socialServices],
  );
  const resolution = usePostkitLinkResolution(
    href,
    provider,
    resolveLink,
    !supplied && resolutionMode !== 'snapshot',
  );
  const consent = useEmbedConsent({ activation: props.activation });

  const runtimePreview =
    resolutionMode !== 'snapshot' ? resolution.metadata : undefined;
  const preview = isPreview(supplied)
    ? supplied
    : supplied
      ? undefined
      : runtimePreview;
  const social = isPreview(supplied) ? supplied.social : supplied;
  const resolvedSocial = social ?? preview?.social;
  const serviceId =
    props.service ?? resolvedSocial?.service ?? preview?.siteName ?? 'social';
  const service = socialServices[serviceId];
  const serviceLabel = service?.label ?? serviceId;
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
    : resolution.status;

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
  const metrics = enabled(props.showMetrics, false)
    ? [
        metricLabel(resolvedSocial?.metrics?.replies, 'replies'),
        metricLabel(resolvedSocial?.metrics?.reposts, 'reposts'),
        metricLabel(resolvedSocial?.metrics?.likes, 'likes'),
        metricLabel(resolvedSocial?.metrics?.shares, 'shares'),
      ].filter((metric): metric is string => Boolean(metric))
    : [];

  const snapshotProvenance =
    snapshotVisible && snapshot ? (
      <div
        data-postkit-snapshot-captured-at={snapshot.capturedAt}
        {...part('snapshotInfo')}
      >
        <p {...part('snapshotLabel')}>
          Snapshot captured{' '}
          <time dateTime={snapshot.capturedAt} {...part('snapshotTime')}>
            {formattedCaptureTime ?? snapshot.capturedAt}
          </time>{' '}
          via {snapshot.resolver.id}
        </p>
        {formattedResolvedTime ? (
          <p {...part('snapshotLabel')}>
            Resolver data fetched{' '}
            <time dateTime={snapshot.resolvedAt} {...part('snapshotTime')}>
              {formattedResolvedTime}
            </time>
            {cacheProvenance ? ` · ${cacheProvenance}` : ''}
          </p>
        ) : null}
      </div>
    ) : null;

  let primaryContent: ReactNode;
  if (resolvedPresentation === 'embed' && embed?.src) {
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
            title={iframeTitle ?? embed.title ?? `Post from ${serviceLabel}`}
            sandbox={iframeSandbox}
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            allow="encrypted-media; fullscreen; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div
            {...mergePostkitPartProps(
              consent.getPromptProps(),
              part('consent'),
            )}
          >
            <p>Load interactive content from {serviceLabel}?</p>
            <button
              {...mergePostkitPartProps(
                consent.getRequestTriggerProps(),
                part('consentButton'),
              )}
            >
              Load post
            </button>
          </div>
        )}
      </div>
    );
  } else {
    primaryContent = (
      <>
        <div {...part('serviceRow')}>
          <span data-postkit-service={serviceId} {...part('serviceBadge')}>
            <span
              aria-hidden={service?.icon ? undefined : true}
              {...part('serviceIcon')}
            >
              {service?.icon ?? serviceLabel.slice(0, 1).toUpperCase()}
            </span>
            {serviceLabel}
          </span>
          {formattedTimestamp ? (
            <time dateTime={timestamp} {...part('timestamp')}>
              {formattedTimestamp}
            </time>
          ) : null}
        </div>
        {displayedAuthor || displayedHandle || avatar ? (
          <div {...part('authorRow')}>
            {avatar ? (
              <img src={avatar} alt="" loading="lazy" {...part('avatar')} />
            ) : null}
            <div {...part('author')}>
              {displayedAuthor ? (
                <p {...part('authorName')}>{displayedAuthor}</p>
              ) : null}
              {displayedHandle ? (
                <p {...part('handle')}>{displayedHandle}</p>
              ) : null}
            </div>
          </div>
        ) : null}
        {postText ? (
          <blockquote cite={postUrl} {...part('content')}>
            {postText}
          </blockquote>
        ) : null}
        {resolvedSocial?.images[0] ? (
          <div {...part('media')}>
            <img
              src={resolvedSocial.images[0].src}
              alt={resolvedSocial.images[0].alt ?? ''}
              loading="lazy"
              {...part('image')}
            />
          </div>
        ) : null}
        {resolvedSocial?.quotedPost ? (
          <div {...part('quote')}>
            <p {...part('quoteAuthor')}>
              {resolvedSocial.quotedPost.author?.name ??
                resolvedSocial.quotedPost.author?.handle ??
                socialServices[resolvedSocial.quotedPost.service]?.label ??
                resolvedSocial.quotedPost.service}
            </p>
            {resolvedSocial.quotedPost.text ? (
              <p {...part('quoteContent')}>{resolvedSocial.quotedPost.text}</p>
            ) : null}
          </div>
        ) : null}
        {metrics.length ? (
          <div aria-label="Post engagement" {...part('metrics')}>
            {metrics.map((metric) => (
              <span key={metric} {...part('metric')}>
                {metric}
              </span>
            ))}
          </div>
        ) : null}
        <div {...part('footer')}>
          <a href={postUrl} {...part('originalLink')}>
            View original
          </a>
        </div>
      </>
    );
  }

  return (
    <article
      data-postkit-provider={provider ?? preview?.provider.id}
      data-postkit-service={serviceId}
      data-postkit-resolution={resolutionStatus}
      data-postkit-resolution-mode={resolutionMode}
      {...part('root')}
    >
      {primaryContent}
      {snapshotProvenance}
    </article>
  );
});

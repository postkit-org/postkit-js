import {
  asArray,
  asRecord,
  assertPublicHttpUrl,
  finiteNumber,
  iframeSrcFromHtml,
  queryUrl,
  requestJson,
  safeHttpUrl,
} from '../http.js';
import type {
  LinkResolver,
  ProviderResolverOptions,
  ResolvedLinkEmbed,
  ResolvedLinkImage,
  ResolvedLinkMedia,
  ResolvedLinkPreview,
  ResolvedLinkProvider,
  ResolvedLinkRequesterFamily,
  ResolvedLinkResolution,
  ResolvedSocialMetrics,
  ResolvedSocialPost,
} from '../types.js';

export interface OpenGraphsResolverOptions extends ProviderResolverOptions {
  readonly apiKey?: string;
}

export type OpenGraphsISODateTime = string;
export type OpenGraphsUrl = string;
export type OpenGraphsRequesterFamily = ResolvedLinkRequesterFamily;

export interface OpenGraphsImage {
  readonly url: OpenGraphsUrl;
  readonly alt: string | null;
  readonly type: string | null;
  readonly width: number | null;
  readonly height: number | null;
}

export interface OpenGraphsAudio {
  readonly url: OpenGraphsUrl;
  readonly type: string | null;
  readonly durationSeconds: number | null;
}

export interface OpenGraphsVideo {
  readonly url: OpenGraphsUrl;
  readonly type: string | null;
  readonly width: number | null;
  readonly height: number | null;
  readonly poster: OpenGraphsUrl | null;
}

export interface OpenGraphsEmbed {
  readonly type: 'link' | 'photo' | 'rich' | 'video';
  readonly src: OpenGraphsUrl | null;
  readonly rawHtml: string | null;
  readonly thumbnail: OpenGraphsImage | null;
  readonly width: number | null;
  readonly height: number | null;
  readonly aspectRatio: number | null;
  readonly title: string | null;
}

export interface OpenGraphsProvider {
  readonly id: string;
  readonly name: string;
  readonly url: OpenGraphsUrl;
}

export interface OpenGraphsSocialAuthor {
  readonly name: string | null;
  readonly handle: string | null;
  readonly url: OpenGraphsUrl | null;
  readonly avatar: OpenGraphsUrl | null;
}

export interface OpenGraphsSocialMetrics {
  readonly replies: number | null;
  readonly reposts: number | null;
  readonly likes: number | null;
  readonly shares: number | null;
}

export interface OpenGraphsQuotedPost {
  readonly service: string;
  readonly url: OpenGraphsUrl;
  readonly author: OpenGraphsSocialAuthor | null;
  readonly text: string | null;
  readonly publishedAt: OpenGraphsISODateTime | null;
  readonly images: readonly OpenGraphsImage[];
  readonly video: readonly OpenGraphsVideo[];
  readonly metrics: OpenGraphsSocialMetrics | null;
}

export interface OpenGraphsSocialPost extends OpenGraphsQuotedPost {
  readonly quotedPost: OpenGraphsQuotedPost | null;
}

export interface OpenGraphsResponse {
  readonly schemaVersion: 1;
  readonly requestId: string;
  readonly resolver: {
    readonly id: 'opengraphs';
    readonly name: 'OpenGraphs';
    readonly url: 'https://opengraphs.com/';
  };
  readonly data: {
    readonly canonicalUrl: OpenGraphsUrl;
    readonly title: string;
    readonly description: string | null;
    readonly siteName: string | null;
    readonly author: string | null;
    readonly authorUrl: OpenGraphsUrl | null;
    readonly favicon: OpenGraphsUrl | null;
    readonly images: readonly OpenGraphsImage[];
    readonly audio: readonly OpenGraphsAudio[];
    readonly video: readonly OpenGraphsVideo[];
    readonly embed: OpenGraphsEmbed | null;
    readonly provider: OpenGraphsProvider;
    readonly social: OpenGraphsSocialPost | null;
  };
  readonly cache: {
    readonly strategy: 'bypass' | 'refresh' | 'use';
    readonly result: 'hit' | 'miss' | 'stale' | 'unavailable';
    readonly fetchedAt: OpenGraphsISODateTime;
    readonly expiresAt: OpenGraphsISODateTime | null;
    readonly maxAgeSeconds: number;
  };
  readonly resolution: {
    readonly kind: 'fallback' | 'metadata' | 'oembed';
    readonly requestedMode: 'auto' | 'metadata' | 'oembed';
    readonly requestedUrl: OpenGraphsUrl;
    readonly requester: OpenGraphsRequesterFamily;
    readonly upstreamError: {
      readonly code: string;
      readonly statusCode: number | null;
    } | null;
  };
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function nonNegativeNumber(value: unknown): number | undefined {
  const result =
    typeof value === 'string' ? Number.parseFloat(value) : Number(value);
  return Number.isFinite(result) && result >= 0 ? result : undefined;
}

function imageFrom(value: unknown): ResolvedLinkImage | undefined {
  if (typeof value === 'string') {
    const src = safeHttpUrl(value);
    return src ? { src } : undefined;
  }
  const item = asRecord(value);
  const src = safeHttpUrl(item?.src ?? item?.url);
  return src
    ? {
        src,
        alt: stringValue(item?.alt),
        type: stringValue(item?.type),
        width: finiteNumber(item?.width),
        height: finiteNumber(item?.height),
      }
    : undefined;
}

function mediaFrom(value: unknown): ResolvedLinkMedia | undefined {
  if (typeof value === 'string') {
    const src = safeHttpUrl(value);
    return src ? { src } : undefined;
  }
  const item = asRecord(value);
  const src = safeHttpUrl(item?.src ?? item?.url);
  return src
    ? {
        src,
        type: stringValue(item?.type),
        width: finiteNumber(item?.width),
        height: finiteNumber(item?.height),
        durationSeconds: nonNegativeNumber(
          item?.durationSeconds ?? item?.duration,
        ),
        poster: safeHttpUrl(item?.poster),
      }
    : undefined;
}

function embedFrom(value: unknown): ResolvedLinkEmbed | undefined {
  const item = asRecord(value);
  if (!item) return undefined;
  const typeValue = stringValue(item.type);
  const type: ResolvedLinkEmbed['type'] =
    typeValue === 'photo' ||
    typeValue === 'video' ||
    typeValue === 'rich' ||
    typeValue === 'link'
      ? typeValue
      : 'rich';
  const rawHtml = stringValue(item.rawHtml ?? item.html);
  const width = finiteNumber(item.width);
  const height = finiteNumber(item.height);
  return {
    type,
    src: safeHttpUrl(item.src ?? item.url) ?? iframeSrcFromHtml(rawHtml),
    width,
    height,
    aspectRatio:
      finiteNumber(item.aspectRatio) ??
      (width && height ? width / height : undefined),
    title: stringValue(item.title),
    thumbnail: imageFrom(item.thumbnail),
    rawHtml,
  };
}

function metricValue(value: unknown): number | undefined {
  return nonNegativeNumber(value);
}

function providerFrom(value: unknown): ResolvedLinkProvider | undefined {
  const provider = asRecord(value);
  const id = stringValue(provider?.id);
  if (!provider || !id) return undefined;
  return {
    id,
    name: stringValue(provider.name),
    url: safeHttpUrl(provider.url),
  };
}

function requesterFrom(
  value: unknown,
): ResolvedLinkRequesterFamily | undefined {
  return value === 'GENERIC' ||
    value === 'SLACK' ||
    value === 'LINKEDIN' ||
    value === 'X' ||
    value === 'FACEBOOK' ||
    value === 'DISCORD' ||
    value === 'MICROSOFT_TEAMS' ||
    value === 'WHATSAPP' ||
    value === 'TELEGRAM' ||
    value === 'IMESSAGE' ||
    value === 'GOOGLE' ||
    value === 'OTHER'
    ? value
    : undefined;
}

function resolutionFrom(value: unknown): ResolvedLinkResolution | undefined {
  const resolution = asRecord(value);
  const kind =
    resolution?.kind === 'metadata' ||
    resolution?.kind === 'oembed' ||
    resolution?.kind === 'fallback'
      ? resolution.kind
      : undefined;
  const requestedMode =
    resolution?.requestedMode === 'auto' ||
    resolution?.requestedMode === 'metadata' ||
    resolution?.requestedMode === 'oembed'
      ? resolution.requestedMode
      : undefined;
  const requestedUrl = safeHttpUrl(resolution?.requestedUrl);
  const requester = requesterFrom(resolution?.requester);
  if (!kind || !requestedMode || !requestedUrl || !requester) return undefined;

  const upstream = asRecord(resolution?.upstreamError);
  const upstreamCode = stringValue(upstream?.code);
  const upstreamStatusCode = nonNegativeNumber(upstream?.statusCode);
  return {
    kind,
    requestedMode,
    requestedUrl,
    requester,
    upstreamError: upstreamCode
      ? {
          code: upstreamCode,
          ...(upstreamStatusCode !== undefined
            ? { statusCode: upstreamStatusCode }
            : {}),
        }
      : undefined,
  };
}

function socialFrom(
  value: unknown,
  fallbackUrl: string,
  depth = 0,
): ResolvedSocialPost | undefined {
  const item = asRecord(value);
  const service = stringValue(item?.service ?? item?.network);
  if (!item || !service || depth > 1) return undefined;

  const author = asRecord(item.author);
  const metricsValue = asRecord(item.metrics);
  const metrics: ResolvedSocialMetrics | undefined = metricsValue
    ? {
        replies: metricValue(metricsValue.replies),
        reposts: metricValue(metricsValue.reposts),
        likes: metricValue(metricsValue.likes),
        shares: metricValue(metricsValue.shares),
      }
    : undefined;
  const images = asArray(item.images ?? item.image)
    .map(imageFrom)
    .filter((image): image is ResolvedLinkImage => Boolean(image));
  const video = asArray(item.video)
    .map(mediaFrom)
    .filter((media): media is ResolvedLinkMedia => Boolean(media));

  return {
    service,
    url: safeHttpUrl(item.url ?? item.postUrl) ?? fallbackUrl,
    author: author
      ? {
          name: stringValue(author.name),
          handle: stringValue(author.handle ?? author.username),
          url: safeHttpUrl(author.url),
          avatar: safeHttpUrl(author.avatar ?? author.image),
        }
      : undefined,
    text: stringValue(item.text ?? item.content),
    publishedAt: stringValue(item.publishedAt ?? item.published_at),
    images,
    video,
    metrics:
      metrics && Object.values(metrics).some((metric) => metric !== undefined)
        ? metrics
        : undefined,
    quotedPost:
      depth === 0
        ? socialFrom(
            item.quotedPost ?? item.quoted_post,
            fallbackUrl,
            depth + 1,
          )
        : undefined,
  };
}

export function normalizeOpenGraphsResponse(
  value: unknown,
  requestedUrl: string,
): ResolvedLinkPreview {
  const envelope = asRecord(value);
  const data = asRecord(envelope?.data) ?? envelope;
  if (!data) {
    throw new TypeError('OpenGraphs returned an invalid response.');
  }
  if (envelope?.schemaVersion !== undefined && envelope.schemaVersion !== 1) {
    throw new TypeError(
      `OpenGraphs returned unsupported schema version ${String(envelope.schemaVersion)}.`,
    );
  }
  const resolver = asRecord(envelope?.resolver);
  const resolverId = stringValue(resolver?.id);
  if (
    (envelope?.schemaVersion === 1 && resolverId !== 'opengraphs') ||
    (resolverId !== undefined && resolverId !== 'opengraphs')
  ) {
    throw new TypeError(
      `OpenGraphs returned an unexpected resolver "${resolverId ?? 'missing'}".`,
    );
  }

  const images = asArray(data.images ?? data.image)
    .map(imageFrom)
    .filter((item): item is ResolvedLinkImage => Boolean(item));
  const audio = asArray(data.audio)
    .map(mediaFrom)
    .filter((item): item is ResolvedLinkMedia => Boolean(item));
  const video = asArray(data.video)
    .map(mediaFrom)
    .filter((item): item is ResolvedLinkMedia => Boolean(item));
  const faviconValue = data.favicon ?? data.logo;
  const favicon =
    safeHttpUrl(faviconValue) ?? imageFrom(faviconValue)?.src ?? undefined;
  const cache = asRecord(data.cache ?? envelope?.cache);
  const sourceProvider = providerFrom(data.provider);
  const canonicalUrl =
    safeHttpUrl(data.canonicalUrl ?? data.canonical ?? data.url) ??
    requestedUrl;
  const cacheStrategy =
    cache?.strategy === 'use' ||
    cache?.strategy === 'refresh' ||
    cache?.strategy === 'bypass'
      ? cache.strategy
      : undefined;
  const cacheResult =
    cache?.result === 'hit' ||
    cache?.result === 'miss' ||
    cache?.result === 'stale' ||
    cache?.result === 'unavailable'
      ? cache.result
      : cache?.status === 'hit' ||
          cache?.status === 'miss' ||
          cache?.status === 'stale'
        ? cache.status
        : undefined;

  return {
    requestedUrl,
    url: canonicalUrl,
    title: stringValue(data.title),
    description: stringValue(data.description),
    siteName: stringValue(data.siteName ?? data.site),
    author: stringValue(data.author),
    authorUrl: safeHttpUrl(data.authorUrl ?? data.author_url),
    favicon,
    images,
    audio,
    video,
    embed: embedFrom(data.embed ?? data.oembed),
    social: socialFrom(data.social, canonicalUrl),
    provider: {
      id: 'opengraphs',
      name: stringValue(resolver?.name) ?? 'OpenGraphs',
      url: safeHttpUrl(resolver?.url) ?? 'https://opengraphs.com/',
    },
    sourceProvider,
    cache: cache
      ? {
          strategy: cacheStrategy,
          result: cacheResult,
          fetchedAt: stringValue(cache.fetchedAt),
          expiresAt: stringValue(cache.expiresAt),
          maxAgeSeconds: nonNegativeNumber(cache.maxAgeSeconds ?? cache.maxAge),
        }
      : undefined,
    resolution: resolutionFrom(envelope?.resolution),
    requestId: stringValue(envelope?.requestId),
  };
}

export function createOpenGraphsResolver(
  options: OpenGraphsResolverOptions = {},
): LinkResolver {
  const endpoint =
    options.endpoint ?? 'https://unfurl.opengraphs.com/v1/resolve';
  const headers = {
    ...options.headers,
    ...(options.apiKey
      ? { authorization: `Bearer ${options.apiKey}` }
      : undefined),
  };

  return {
    id: 'opengraphs',
    async resolve(url, resolveOptions = {}) {
      const requestedUrl = assertPublicHttpUrl(url).toString();
      const requestUrl = queryUrl(endpoint, {
        url: requestedUrl,
        maxwidth: resolveOptions.maxWidth,
        maxheight: resolveOptions.maxHeight,
        force: resolveOptions.force || undefined,
      });
      const result = await requestJson(
        'OpenGraphs',
        requestUrl,
        { ...options, headers },
        resolveOptions,
      );
      return normalizeOpenGraphsResponse(result, requestedUrl);
    },
  };
}

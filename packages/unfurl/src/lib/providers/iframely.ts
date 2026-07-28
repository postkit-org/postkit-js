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
  ResolvedLinkImage,
  ResolvedLinkMedia,
  ResolvedLinkPreview,
} from '../types.js';

export interface IframelyResolverOptions extends ProviderResolverOptions {
  readonly apiKey: string;
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

interface IframelyLink {
  readonly href?: unknown;
  readonly type?: unknown;
  readonly media?: unknown;
  readonly html?: unknown;
}

function linksFor(
  links: Readonly<Record<string, unknown>> | undefined,
  name: string,
): readonly IframelyLink[] {
  return asArray(links?.[name])
    .map(asRecord)
    .filter((item): item is Readonly<Record<string, unknown>> => Boolean(item));
}

function imageFrom(link: IframelyLink): ResolvedLinkImage | undefined {
  const src = safeHttpUrl(link.href);
  const media = asRecord(link.media);
  return src
    ? {
        src,
        type: stringValue(link.type),
        width: finiteNumber(media?.width),
        height: finiteNumber(media?.height),
      }
    : undefined;
}

function mediaFrom(link: IframelyLink): ResolvedLinkMedia | undefined {
  const src = safeHttpUrl(link.href);
  const media = asRecord(link.media);
  return src
    ? {
        src,
        type: stringValue(link.type),
        width: finiteNumber(media?.width),
        height: finiteNumber(media?.height),
      }
    : undefined;
}

export function normalizeIframelyResponse(
  value: unknown,
  requestedUrl: string,
): ResolvedLinkPreview {
  const data = asRecord(value);
  if (!data) {
    throw new TypeError('Iframely returned an invalid response.');
  }

  const meta = asRecord(data.meta);
  const links = asRecord(data.links);
  const images = [...linksFor(links, 'image'), ...linksFor(links, 'thumbnail')]
    .map(imageFrom)
    .filter((item): item is ResolvedLinkImage => Boolean(item))
    .filter(
      (item, index, all) =>
        all.findIndex((candidate) => candidate.src === item.src) === index,
    );
  const audio = linksFor(links, 'audio')
    .map(mediaFrom)
    .filter((item): item is ResolvedLinkMedia => Boolean(item));
  const video = linksFor(links, 'video')
    .map(mediaFrom)
    .filter((item): item is ResolvedLinkMedia => Boolean(item));
  const player = linksFor(links, 'player')[0];
  const playerMedia = asRecord(player?.media);
  const rawHtml =
    stringValue(player?.html) ?? stringValue(data.html) ?? undefined;
  const embedSrc =
    safeHttpUrl(player?.href) ?? iframeSrcFromHtml(rawHtml) ?? undefined;
  const medium = stringValue(meta?.medium);
  const icon =
    linksFor(links, 'icon')[0] ?? linksFor(links, 'logo')[0] ?? undefined;

  return {
    requestedUrl,
    url:
      safeHttpUrl(meta?.canonical ?? data.url) ??
      assertPublicHttpUrl(requestedUrl).toString(),
    title: stringValue(meta?.title),
    description: stringValue(meta?.description),
    siteName: stringValue(meta?.site),
    author: stringValue(meta?.author),
    authorUrl: safeHttpUrl(meta?.author_url),
    favicon: safeHttpUrl(icon?.href),
    images,
    audio,
    video,
    embed:
      embedSrc || rawHtml
        ? {
            type:
              medium === 'video'
                ? 'video'
                : medium === 'image'
                  ? 'photo'
                  : 'rich',
            src: embedSrc,
            aspectRatio: finiteNumber(playerMedia?.['aspect-ratio']),
            title: stringValue(meta?.title),
            rawHtml,
          }
        : undefined,
    provider: {
      id: 'iframely',
      name: 'Iframely',
      url: 'https://iframely.com/',
    },
  };
}

export function createIframelyResolver(
  options: IframelyResolverOptions,
): LinkResolver {
  if (!options.apiKey) {
    throw new TypeError('Iframely requires an API key.');
  }
  const endpoint = options.endpoint ?? 'https://iframe.ly/api/iframely';

  return {
    id: 'iframely',
    async resolve(url, resolveOptions = {}) {
      const requestedUrl = assertPublicHttpUrl(url).toString();
      const requestUrl = queryUrl(endpoint, {
        url: requestedUrl,
        api_key: options.apiKey,
        omit_script: 1,
        import: 0,
        ssl: 1,
        maxwidth: resolveOptions.maxWidth,
        maxheight: resolveOptions.maxHeight,
      });
      const result = await requestJson(
        'Iframely',
        requestUrl,
        options,
        resolveOptions,
      );
      return normalizeIframelyResponse(result, requestedUrl);
    },
  };
}

import { assertPublicHttpUrl, queryUrl, requestJson } from '../http.js';
import { normalizeOEmbed } from '../oembed.js';
import type { LinkResolver, ProviderResolverOptions } from '../types.js';

export interface EmbedlyResolverOptions extends ProviderResolverOptions {
  readonly apiKey: string;
}

export function createEmbedlyResolver(
  options: EmbedlyResolverOptions,
): LinkResolver {
  if (!options.apiKey) {
    throw new TypeError('Embedly requires an API key.');
  }
  const endpoint = options.endpoint ?? 'https://api.embedly.com/1/oembed';

  return {
    id: 'embedly',
    async resolve(url, resolveOptions = {}) {
      const requestedUrl = assertPublicHttpUrl(url).toString();
      const requestUrl = queryUrl(endpoint, {
        url: requestedUrl,
        key: options.apiKey,
        format: 'json',
        secure: true,
        title: 'og',
        description: 'og',
        maxwidth: resolveOptions.maxWidth,
        maxheight: resolveOptions.maxHeight,
      });
      const result = await requestJson(
        'Embedly',
        requestUrl,
        options,
        resolveOptions,
      );
      return normalizeOEmbed(result, {
        providerId: 'embedly',
        requestedUrl,
        fallbackUrl: requestedUrl,
      });
    },
  };
}

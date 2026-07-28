import type {
  LinkResolver,
  LinkResolverId,
  ResolveLinkOptions,
  ResolvedLinkPreview,
} from './types.js';

export interface CreateLinkResolverRegistryOptions {
  readonly resolvers: readonly LinkResolver[];
  /**
   * OpenGraphs is the conventional default. A different provider can be
   * selected globally here or per request through `ResolveLinkOptions`.
   */
  readonly defaultProvider?: LinkResolverId;
  /**
   * Providers attempted after the selected provider fails. This is opt-in so
   * applications do not unexpectedly spend credits with another service.
   */
  readonly fallbackProviders?: readonly LinkResolverId[];
}

export interface LinkResolverRegistry extends LinkResolver {
  readonly defaultProvider: LinkResolverId;
  readonly providers: readonly LinkResolverId[];
}

export function createLinkResolverRegistry({
  resolvers,
  defaultProvider = 'opengraphs',
  fallbackProviders = [],
}: CreateLinkResolverRegistryOptions): LinkResolverRegistry {
  const byId = new Map(resolvers.map((resolver) => [resolver.id, resolver]));
  if (!byId.has(defaultProvider)) {
    throw new TypeError(
      `Default link resolver "${defaultProvider}" is not registered.`,
    );
  }

  return {
    id: 'postkit',
    defaultProvider,
    providers: [...byId.keys()],
    async resolve(
      url: string,
      options: ResolveLinkOptions = {},
    ): Promise<ResolvedLinkPreview> {
      const selectedProvider = options.provider ?? defaultProvider;
      const attempts = [
        selectedProvider,
        ...fallbackProviders.filter((id) => id !== selectedProvider),
      ];
      let lastError: unknown;

      for (const providerId of attempts) {
        const resolver = byId.get(providerId);
        if (!resolver) {
          lastError = new TypeError(
            `Link resolver "${providerId}" is not registered.`,
          );
          continue;
        }

        try {
          return await resolver.resolve(url, options);
        } catch (error) {
          if (options.signal?.aborted) {
            throw error;
          }
          lastError = error;
        }
      }

      throw (
        lastError ??
        new TypeError(
          `No link resolver is registered for "${selectedProvider}".`,
        )
      );
    },
  };
}

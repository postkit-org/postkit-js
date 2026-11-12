# Link previews and unfurling

Resolve URLs behind a server boundary with @postkit/unfurl and render normalized link or social metadata.

Remote content is normalized before rendering. `@postkit/unfurl` returns a
provider-neutral snapshot; `LinkPreview` and `SocialPost` render that snapshot.
This keeps remote requests, credentials, and provider-specific response formats
out of presentation components.

`@postkit/unfurl` normalizes metadata from Open Graph, oEmbed, OpenGraphs, and
custom resolvers. It is designed for a server or build process, not direct use
in a browser component.

## Resolution flow

1. The application receives or loads a URL.
2. A trusted server validates it against the application's URL policy.
3. `@postkit/unfurl` calls the configured provider.
4. The application caches the normalized result.
5. A Postkit component renders the normalized snapshot.

Provider credentials remain at the resolver boundary.

## Create a resolver

Adapters are included for OpenGraphs, Iframely, Embedly, and Microlink. Every
adapter normalizes its response into `ResolvedLinkPreview`. OpenGraphs is the
default provider when a registry is created:

```ts
import {
  createIframelyResolver,
  createLinkResolverRegistry,
  createOpenGraphsResolver,
} from '@postkit/unfurl';

export const linkResolver = createLinkResolverRegistry({
  resolvers: [
    createOpenGraphsResolver({
      apiKey: process.env.OPENGRAPHS_API_KEY,
    }),
    createIframelyResolver({
      apiKey: process.env.IFRAMELY_API_KEY!,
    }),
  ],
  fallbackProviders: ['iframely'],
});

const metadata = await linkResolver.resolve('https://example.com/article');
```

Fallback providers are opt-in, so an outage or malformed response does not
unexpectedly consume credits with another service. Use
`createCallbackResolver` to wrap an application's own resolution function.

## Rendering

`LinkPreview` can consume a normalized link result through its `metadata`
prop, either as an object or as a JSON string from a saved snapshot:

```tsx
<LinkPreview href="https://example.com/article" metadata={metadata} />
```

The card's title is a paragraph, because a preview can't know where it sits
in your page's outline. When it should be a heading, say which one with
`headingLevel` (`2` to `6`), so it follows the heading above it. `Chart` and
`Carousel` take the same prop for their titles.

```tsx
<LinkPreview href="https://example.com/article" headingLevel={3} />
```

`SocialPost` can render a captured social snapshot or use an application
callback to resolve one at runtime.

Live embeds should remain an explicit application choice because they can add
third-party scripts, tracking, consent requirements, and layout instability.
Provider markup is retained as `embed.rawHtml`, but Postkit's React renderer
never injects it. See [Security](/docs/security) for the full trust boundary.

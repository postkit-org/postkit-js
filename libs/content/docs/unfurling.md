---
title: Unfurling and oEmbed
summary: Resolve URLs behind a server boundary and render normalized link or social metadata.
category: Services
order: 80
---

# Unfurling and oEmbed

`@postkit/unfurl` normalizes metadata from Open Graph, oEmbed, OpenGraphs, and
custom resolvers. It is designed for a server or build process, not direct use
in a browser component.

## Resolution flow

1. The application receives or loads a URL.
2. A trusted server validates it against the application's URL policy.
3. `@postkit/unfurl` calls the configured provider.
4. The application caches the normalized result.
5. A PostKit component renders the normalized snapshot.

Provider credentials remain at the resolver boundary.

## Rendering

`LinkPreview` can consume a normalized link result. `SocialPost` can render a
captured social snapshot or use an application callback to resolve one at
runtime.

Live embeds should remain an explicit application choice because they can add
third-party scripts, tracking, consent requirements, and layout instability.

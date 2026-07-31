---
title: Framework guides
summary: Connect the portable component map to Next.js, React Router, TanStack Router, or Astro.
category: Integration
order: 70
---

# Framework guides

Framework adapters keep internal links native to the host router while
preserving normal anchors for external URLs, protocol links, hashes, downloads,
and explicit non-default targets.

## Next.js

Create the native MDX component map in `mdx-components.tsx`:

```tsx
import { createPostkitNextComponents } from '@postkit/next';

export function useMDXComponents() {
  return createPostkitNextComponents();
}
```

## React Router and TanStack Router

Create the adapter's component map and render the article beneath the
application router provider. Both adapters accept a link-prop mapper for
application-specific route behavior.

TanStack Router applications can translate portable string URLs into a typed
route, params, search, mask, or preload configuration at this boundary.

## Astro

Install the Astro React and MDX integrations, add `postkitAstro()` to the Astro
configuration, and render imported MDX with `postkitAstroComponents`. Static
components remain server-rendered while interactive components hydrate at an
appropriate boundary.

Each npm package README contains the exact peer dependencies and complete
adapter API.

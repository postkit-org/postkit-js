# Postkit for Astro

`@postkit/astro` renders Postkit declarations through Astro MDX,
provides Chakra context for every isolated React rendering boundary, and
hydrates only components that require a React runtime.

## When to use it

Use this adapter when an Astro site needs the PostKit component contract in
imported MDX or content collections. It owns the Astro-to-React bridge and
selective hydration policy while leaving content loading, layouts, and asset
handling to the site.

## Install

```sh
npm install @postkit/astro @postkit/react
```

Enable Astro's React and MDX integrations:

```sh
npx astro add react mdx
npm install @astrojs/markdown-remark
```

Add the Postkit integration and its unified Markdown processor:

```ts
// astro.config.ts
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import { defineConfig } from 'astro/config';
import { createPostkitAstroMdxOptions, postkitAstro } from '@postkit/astro';

export default defineConfig({
  integrations: [postkitAstro(), react(), mdx(createPostkitAstroMdxOptions())],
});
```

`createPostkitAstroMdxOptions()` selects Astro's unified processor because
Postkit's base Markdown lifecycle uses Remark plugins. Additional Remark
plugins belong in the Postkit preset's `before` or `after` lists, while Rehype
configuration can be passed alongside it:

```ts
mdx(
  createPostkitAstroMdxOptions({
    postkit: {
      after: [remarkReadingTime],
    },
    rehypePlugins: [rehypeSlug],
  }),
);
```

`postkitAstro()` uses Chakra's `defaultSystem` unless the site provides a
module that default-exports its own `SystemContext`:

```ts
postkitAstro({
  chakraSystem: './src/styles/postkit-system.ts',
});
```

The relative path resolves from the Astro project root and is imported by both
the server renderer and hydrated islands. This avoids trying to serialize a
Chakra system through Astro island props.

## Render MDX

Pass the component map to imported MDX:

```astro
---
import Article from '../content/article.mdx';
import { postkitAstroComponents } from '@postkit/astro/components';
---

<Article components={postkitAstroComponents} />
```

Content collections use the same map:

```astro
---
import { render } from 'astro:content';
import { postkitAstroComponents } from '@postkit/astro/components';

const { Content } = await render(Astro.props.entry);
---

<Content components={postkitAstroComponents} />
```

Use Postkit's JSX declarations in Astro MDX:

```mdx
<Audio src="/episode.mp3" title="Episode 12" />

<Carousel items={[{ title: 'First slide' }, { title: 'Second slide' }]} />

<ShareActions
  url="https://example.com/posts/launch"
  services={['native', 'copy', 'bluesky']}
/>

<SocialPost
  href="https://bsky.app/profile/ada.example/post/abc"
  service="bluesky"
/>
```

MDX treats braces as JavaScript expressions, which conflicts with the
brace-attribute syntax used by Remark directives. Reserve
`::postkit-*{...}` declarations for plain Markdown pipelines and use the
equivalent JSX declaration in `.mdx` files.

Site components take final precedence:

```ts
import { createPostkitAstroComponents } from '@postkit/astro/components';

export const articleComponents = createPostkitAstroComponents({
  h2: ArticleHeading,
  Callout,
});
```

## Hydration policy

Audio and Video use native browser controls, while AppearsOn, Figure, and the
current Chart renderer are static, so Astro emits them without a client
runtime. Carousel, LinkPreview, NewsletterSignup, ShareActions, and SocialPost
use `client:visible` and hydrate only when they approach the viewport. This
keeps forms, sharing, runtime link resolution, and consent-gated embeds
interactive without shipping a page-wide React root.

Prefer the `items` declaration for carousels in portable Markdown. Rich MDX
children cross an Astro-to-React slot boundary and should be reserved for
site-owned wrappers that control their hydration behavior.

## Public API

- `postkitAstro(options?)`
- `createPostkitAstroMdxOptions(options?)`
- `postkitAstroComponents`
- `createPostkitAstroComponents(overrides?)`
- Individual Astro components from `@postkit/astro/components/*`
- React bridges from `@postkit/astro/react`

## Troubleshooting

- Missing components: pass `postkitAstroComponents` to the rendered MDX or
  content collection.
- Missing directive transforms: create MDX options with
  `createPostkitAstroMdxOptions()`.
- Chakra context errors in islands: configure `chakraSystem` with a module that
  default-exports the site's `SystemContext`.
- Unexpected client JavaScript: check the hydration policy before wrapping
  static components in a site-owned client island.

See the [`@postkit/react`](../react) guide for the shared component,
declaration, and theming APIs. The complete
[Astro example](../../examples/astro) is built and inspected in CI.

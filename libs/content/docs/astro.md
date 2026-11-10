---
title: Astro
summary: Render Postkit declarations in Astro MDX with server-rendered components and selective React hydration.
category: Frameworks
order: 4
---

# Astro

`@postkit/astro` renders Postkit declarations through Astro MDX, provides
Chakra context for every isolated React rendering boundary, and hydrates only
components that require a React runtime.

## Install

```sh
npm install @postkit/astro @postkit/chakra
npx astro add react mdx
npm install @astrojs/markdown-remark
```

It supports Astro `>=6.4 <8`.

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
configuration can be passed alongside it.

## Use a custom Chakra system

`postkitAstro()` uses Chakra's host-native `defaultSystem` unless the site
provides a module that default-exports its own `SystemContext`:

```ts
postkitAstro({
  chakraSystem: './src/styles/postkit-system.ts',
});
```

Opt into Postkit's standalone preset from that module when desired:

```ts
import { createPostkitSystem, postkitDefaultTheme } from '@postkit/chakra';

export default createPostkitSystem({ preset: postkitDefaultTheme });
```

The relative path resolves from the Astro project root and is imported by both
the server renderer and hydrated islands. This avoids trying to serialize a
Chakra system through Astro island props.

## Render MDX

Pass the component map to imported MDX or to content collections:

```astro
---
import { render } from 'astro:content';
import { postkitAstroComponents } from '@postkit/astro/components';

const { Content } = await render(Astro.props.entry);
---

<Content components={postkitAstroComponents} />
```

Site components take final precedence:

```ts
import { createPostkitAstroComponents } from '@postkit/astro/components';

export const articleComponents = createPostkitAstroComponents({
  h2: ArticleHeading,
  Callout,
});
```

Use Postkit's JSX declarations in Astro MDX. Reserve `::postkit-*{...}`
directives for plain Markdown pipelines.

## Hydration policy

Audio and Video use native browser controls, while AppearsOn, Figure, and the
current Chart renderer are static, so Astro emits them without a client
runtime. Disclosure also works natively without hydration. Carousel, CodeBlock,
CodeGroup, LinkPreview, NewsletterSignup, Poll, ShareActions, SocialPost, and
Tabs use `client:visible` and hydrate only when they approach the viewport.

Poll selections are local unless the host supplies persistence. Host callbacks
such as `onVote` belong inside a hydrated React wrapper; functions cannot be
serialized as props across an Astro island boundary.

The package README and the repository's `examples/astro` directory, which is
built and inspected in CI, contain the complete API.

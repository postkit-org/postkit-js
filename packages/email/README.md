# `@postkit/email`

Email-safe Postkit renderers built with `@chakra-email/core`. The package keeps
portable Postkit content recognizable while deliberately adapting interactive
web components to the constraints of delivered HTML email.

## Install

```sh
npm install @postkit/email @chakra-email/core react react-dom
```

## Render an email

```tsx
import { render } from '@chakra-email/core';
import { Callout, CallToAction, PostkitEmailProvider } from '@postkit/email';

const html = await render(
  <PostkitEmailProvider>
    <Callout title="Before you publish" tone="warning">
      Review the destination and audience.
    </Callout>
    <CallToAction
      title="Read the field guide"
      primaryLabel="Read now"
      primaryHref="https://example.com/guide"
    />
  </PostkitEmailProvider>,
);
```

The same integration is compiled in CI from
[`examples/email/render-newsletter.tsx`](../../examples/email/render-newsletter.tsx).

`PostkitEmailProvider` accepts Chakra Email theme overrides. It does not load
Chakra UI or install a client-side runtime.

## Supported components

| Portable component | Email behavior                                         |
| ------------------ | ------------------------------------------------------ |
| `Aside`            | Expanded callout                                       |
| `Callout`          | Expanded, tone-aware callout                           |
| `CallToAction`     | Text plus email-safe button and secondary link         |
| `Figure`           | Sanitized image, optional destination, caption/credit  |
| `Audio`            | Title, caption, and a link to listen                   |
| `Video`            | Optional linked poster, title, caption, and watch link |

Audio and video never emit native media elements because major email clients
do not support them consistently. Chakra Email sanitizes authored link and
image destinations when the HTML is rendered.

## MDX mapping

Use the explicit supported-subset map when an email build compiles trusted MDX:

```ts
import { createPostkitEmailMdxComponents } from '@postkit/email';

export const components = createPostkitEmailMdxComponents();
```

This package does not evaluate MDX, fetch remote metadata, or accept provider
credentials. Compile authored content and resolve link metadata in a trusted
server or build step before rendering.

## Architecture boundary

The renderer-specific JSX intentionally lives here rather than substituting
Chakra Email for Chakra UI at compile time. Small normalization functions in
the package are framework-neutral and are candidates for a future shared
`@postkit/core` package as the email support matrix expands.

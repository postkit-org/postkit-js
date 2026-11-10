---
title: Manifest
summary: The machine-readable catalog of a site's components, for editors, agents and tooling.
category: Reference
order: 3
since: '0.3.0'
status: draft
---

The manifest is the machine-readable catalog of components: each one's
name, directive, props, parts and renderer support. Editors such as Prismark
read it to offer writers the components a site renders, and agents and other
tooling read it instead of importing a renderer.

Its id is `postkit.component-catalog`. Version 2 ships with 0.3.0.

## Get the manifest

For the set your site enabled, call `manifest()` on your Postkit:

```ts
import { postkit } from './lib/postkit';

const manifest = postkit.manifest();
```

Or write it to a file from the terminal, for editors that read it from your
repo:

```sh
npx postkit manifest
```

Each package that ships components publishes a `component-manifest.json`. A
host merges the manifests for exactly the components it enabled, so the result
describes your site, not everything installed.

## What v2 adds

Version 2 keeps every v1 field and adds:

| Field          | Level     | Description                                                                                      |
| -------------- | --------- | ------------------------------------------------------------------------------------------------ |
| `package`      | Component | The package that defines it.                                                                     |
| `kit`          | Component | The [kit](/docs/kits) it belongs to.                                                             |
| `stability`    | Component | `initial`, `experimental`, `stable` or `deprecated`. Editors can hide experimental components.   |
| `support`      | Component | Which renderers support it, computed from what each package exports rather than written by hand. |
| `slots`        | Component | The anatomy: the named parts every renderer emits.                                               |
| `variants`     | Component | The props that are theme variants.                                                               |
| `default`      | Prop      | The value when the author doesn't set one.                                                       |
| `themeVariant` | Prop      | Whether the prop is a recipe variant.                                                            |

A v2 component entry, shortened to one prop:

```json
{
  "name": "Callout",
  "directive": "postkit-callout",
  "description": "A highlighted note, tip, warning, or caution.",
  "childMode": "mdx",
  "directiveRemarkPlugins": ["directives", "postkit"],
  "props": {
    "tone": {
      "kind": "enum",
      "values": ["note", "tip", "important", "warning", "caution"],
      "description": "The semantic emphasis of the aside.",
      "default": "note",
      "themeVariant": true
    }
  },
  "slots": ["root", "icon", "content", "title", "body"],
  "variants": ["size", "variant", "tone"],
  "category": "Article structure",
  "kit": "article",
  "package": "@postkit/core",
  "keywords": [
    "callout",
    "article",
    "structure",
    "size",
    "variant",
    "title",
    "tone"
  ],
  "example": { "props": {}, "jsx": "…", "directive": "…" },
  "preview": { "kind": "live", "label": "Callout component preview" },
  "runtime": "static",
  "stability": "initial",
  "support": {
    "react": "supported",
    "headless": "supported",
    "chakra": "supported",
    "astro": "static",
    "email": "not-defined"
  }
}
```

`kit` is `null` and `package` is what you pass (or `null`) for your own
components.

## Support

The `support` field is computed from what each renderer package exports:

| Field      | Values                                      | Meaning                                                                                          |
| ---------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `react`    | `supported`, `not-supported`                | v1's field: some React renderer has a view.                                                      |
| `headless` | `supported`, `chakra-only`, `not-supported` | `@postkit/react`. `chakra-only` is an interactive component still waiting for its headless view. |
| `chakra`   | `supported`, `not-supported`                | `@postkit/chakra`.                                                                               |
| `astro`    | `static`, `hydrated`                        | Whether Astro hydrates it.                                                                       |
| `email`    | `not-defined`                               | Computed from `@postkit/email` in a later 0.3.0 step.                                            |

A renderer the manifest's producer doesn't know is left out: a headless
site's `manifest()` has no `chakra` field. Email support is next: a component
will be supported in email when `@postkit/email` exports a view for its
definition, and otherwise the email renderer applies the fallback the
definition declares, `link`, `text` or `omit`. Component pages show the same
data, so they can't drift from the packages.

## Version 1

v1 stays readable. `readPostkitComponentManifest` from
`@postkit/core/components` takes either version and returns v2, filling what
v1 never recorded with neutral values (no slots or variants, `package: null`,
the kit from the category). `isPostkitComponentManifestV2` and
`isPostkitComponentManifestV1` tell them apart, and
`mergePostkitComponentManifests` combines several:

```ts
import { readPostkitComponentManifest } from '@postkit/core/components';
import manifest from '@postkit/chakra/component-manifest.json';

const catalog = readPostkitComponentManifest(manifest);
```

A v1 component entry looks like this:

```json
{
  "name": "Callout",
  "directive": "postkit-callout",
  "description": "A highlighted note, tip, warning, or caution.",
  "childMode": "mdx",
  "directiveRemarkPlugins": ["directives", "postkit"],
  "props": {
    "tone": {
      "kind": "enum",
      "values": ["note", "tip", "important", "warning", "caution"],
      "description": "The semantic emphasis of the aside."
    }
  },
  "category": "Article structure",
  "runtime": "static",
  "stability": "initial",
  "support": { "react": "supported", "astro": "static", "email": "not-defined" }
}
```

The entry is shortened here: `props` also lists `size`, `variant` and `title`,
and each entry carries `keywords`, `example` and `preview`. The
`email: "not-defined"` value in v1 is a hand-written placeholder that v2
replaces with computed support.

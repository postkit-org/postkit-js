# `@postkit/shiki`

`@postkit/shiki` creates a lazy Shiki syntax-highlighting adapter for Postkit's
Chakra CodeBlock renderer. It includes a practical language and theme preset
without adding Shiki to `@postkit/chakra` itself.

## Install

```sh
npm install @postkit/shiki @chakra-ui/react
```

`shiki` is installed by the package. `@chakra-ui/react` is a peer dependency.

## Configure Postkit

Create the adapter once at module scope and pass it through `PostkitProvider`:

```tsx
import { PostkitProvider } from '@postkit/chakra';
import { createPostkitShikiAdapter } from '@postkit/shiki';

const codeBlockAdapter = createPostkitShikiAdapter();

export function App({ children }: { children: React.ReactNode }) {
  return (
    <PostkitProvider codeBlockAdapter={codeBlockAdapter}>
      {children}
    </PostkitProvider>
  );
}
```

The default preset loads `astro`, `bash`, `json`, `markdown`, `mdx`, `tsx`, and
`typescript`, plus GitHub light and dark themes. Shiki aliases such as `sh`,
`md`, and `ts` work through their canonical grammars.

A code block in a language that isn't loaded renders as escaped plain text in
the same code block, with its line metadata, rather than throwing. In
development the adapter logs one warning per missing language; add its grammar
to `languages` to highlight it.

Postkit's code surface is dark in both colour modes. GitHub Dark's comment grey
(`#6a737d`) is below 4.5:1 there, so the adapter maps it to `#959da5` with
Shiki's `colorReplacements`, scoped to `github-dark`; every other token colour
is unchanged. Pass your own `highlightOptions.colorReplacements` for a theme to
override it.

## Customize the bundle

Only load the languages and themes the application needs:

```ts
import { createPostkitShikiAdapter } from '@postkit/shiki';

export const codeBlockAdapter = createPostkitShikiAdapter({
  languages: ['bash', 'json', 'tsx'],
  themes: {
    dark: 'nord',
    light: 'min-light',
  },
});
```

The adapter loads Shiki on demand, and Chakra reuses the loaded highlighter for
all code blocks below the provider. Use Chakra's lower-level
`createShikiAdapter` directly when an application needs custom Shiki grammars or
non-bundled themes.

## Exports

- `createPostkitShikiAdapter(options?)`
- `postkitShikiLanguages`
- `postkitShikiThemes`
- `CreatePostkitShikiAdapterOptions`
- `PostkitShikiHighlightOptions`
- `PostkitShikiThemes`

## License

MIT

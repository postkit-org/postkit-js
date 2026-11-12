# React Router

Render Postkit MDX beneath React Router with router-native internal links.

`@postkit/react-router` routes internal destinations through React Router and
leaves external URLs, protocol links, hashes, downloads, and explicit
non-default targets as native anchors.

```sh
npm install @postkit/react-router @postkit/chakra @chakra-ui/react @emotion/react react react-dom react-router
```

It supports React Router 7 with React 19 and the matching `@postkit/chakra`
release.

## Create the component map

```tsx
import { createPostkitReactRouterComponents } from '@postkit/react-router';

export const mdxComponents = createPostkitReactRouterComponents();
```

Each Postkit component in the map loads the first time a page renders it, so
a page only downloads the components its content uses. A streaming server
render waits for them, so the HTML is complete, and the browser keeps that
HTML in place until the component has loaded, so nothing shifts. For a
synchronous render such as `renderToStaticMarkup`, pass the eager views:
`createPostkitReactRouterComponents({ components: postkitChakraViews })`.

Render the article beneath both the application router and `PostkitProvider`:

```tsx
import { PostkitProvider, postkitDefaultTheme } from '@postkit/chakra';
import { BrowserRouter } from 'react-router';

export function App() {
  return (
    <BrowserRouter>
      <PostkitProvider preset={postkitDefaultTheme}>
        <Article components={mdxComponents} />
      </PostkitProvider>
    </BrowserRouter>
  );
}
```

The application owns route definitions, data loading, and the outer page
layout. The preset is optional; omit it when the host Chakra recipes should
provide the visual policy.

## Customize components and links

Site components take final precedence:

```tsx
export const mdxComponents = createPostkitReactRouterComponents({
  components: {
    h2: ArticleHeading,
  },
});
```

Router-specific link props can be supplied globally or derived for each
destination:

```tsx
export const mdxComponents = createPostkitReactRouterComponents({
  link: {
    linkProps: { prefetch: 'intent' },
    mapLinkProps: ({ href }) => ({
      preventScrollReset: href.startsWith('?'),
    }),
  },
});
```

If React Router reports missing context, move the rendered article beneath the
router provider. A checked example lives in the repository's
`examples/react-router` directory.

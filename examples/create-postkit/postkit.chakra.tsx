import { createSystem, defaultConfig } from '@chakra-ui/react';
import { chakraLazy, postkitDefaultTheme } from '@postkit/chakra';
import { createPostkit } from '@postkit/next';
import { article, media, technical } from '@postkit/react/kits';

import { showcaseDefinition } from '../component-definition/showcase.definition';
import { ChakraShowcase } from './showcase';

const siteSystem = createSystem(defaultConfig);

/**
 * The same set on the Chakra renderer, through the Next.js preset (which sets
 * `link` to next/link). `chakraLazy` loads each view the first time a page
 * renders it; Next.js's server render waits for them, so the HTML is whole. Theme-variant defaults (`variant`, `frame`) go into
 * the recipes' `defaultVariants`; `title` becomes a view default.
 */
export const postkit = createPostkit({
  renderer: chakraLazy,
  kits: [article, technical, media],
  exclude: ['Poll'],
  components: [{ definition: showcaseDefinition, view: ChakraShowcase }],
  defaults: {
    Callout: { variant: 'plain' },
    Figure: { layout: 'wide' },
    Showcase: { frame: 'laptop' },
  },
  link: { linkProps: { prefetch: false } },
});

export function ChakraArticle({ children }: { readonly children: string }) {
  const { Callout, Showcase, Tabs } = postkit.mdxComponents;
  return (
    <postkit.Provider system={siteSystem} preset={postkitDefaultTheme}>
      <article>
        <Callout tone="tip">{children}</Callout>
        <Showcase screens={[{ src: '/media/editor.png', alt: 'The editor' }]} />
        <Tabs items={[{ label: 'One', content: 'First' }]} />
      </article>
    </postkit.Provider>
  );
}

export const manifest = postkit.manifest();

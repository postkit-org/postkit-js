import { createSystem, defaultConfig } from '@chakra-ui/react';
import { chakra, postkitDefaultTheme } from '@postkit/chakra';
import { createPostkit } from '@postkit/next';
import { article, media, technical } from '@postkit/react/kits';

import { deviceDefinition } from '../component-definition/device.definition';
import { ChakraDevice } from './device';

const siteSystem = createSystem(defaultConfig);

/**
 * The same set on the Chakra renderer, through the Next.js preset (which sets
 * `link` to next/link). Theme-variant defaults (`variant`, `frame`) go into
 * the recipes' `defaultVariants`; `title` becomes a view default.
 */
export const postkit = createPostkit({
  renderer: chakra,
  kits: [article, technical, media],
  exclude: ['Poll'],
  components: [{ definition: deviceDefinition, view: ChakraDevice }],
  defaults: {
    Callout: { variant: 'plain' },
    Figure: { layout: 'wide' },
    Device: { frame: 'laptop' },
  },
  link: { linkProps: { prefetch: false } },
});

export function ChakraArticle({ children }: { readonly children: string }) {
  const { Callout, Device, Tabs } = postkit.mdxComponents;
  return (
    <postkit.Provider system={siteSystem} preset={postkitDefaultTheme}>
      <article>
        <Callout tone="tip">{children}</Callout>
        <Device screens={[{ src: '/media/editor.png', alt: 'The editor' }]} />
        <Tabs items={[{ label: 'One', content: 'First' }]} />
      </article>
    </postkit.Provider>
  );
}

export const manifest = postkit.manifest();

import { postkitBuiltInDefinitions } from '@postkit/core/components';
import {
  createPostkit,
  postkitHeadlessViewNames,
  postkitHeadlessViews,
} from '@postkit/react';
import { article, engagement, media, technical } from '@postkit/react/kits';
import { act, render, screen } from '@testing-library/react';
import type { ComponentType } from 'react';

import { chakra, postkitChakraViews } from './chakra-renderer.js';
import { chakraLazy, postkitChakraLazyViews } from './chakra-lazy-renderer.js';
import { postkitComponentCatalog } from './component-catalog.js';
import { createPostkitLazyMdxComponents } from './lazy-mdx-components.js';
import {
  createPostkitMdxComponents,
  postkitMdxComponents,
} from './mdx-components.js';
import { PostkitProvider } from './provider.js';
import {
  postkitChakraViewLoaders,
  postkitChakraViewNames,
} from './view-loaders.js';

const kits = [article, technical, media, engagement];

describe('the Chakra view loaders', () => {
  it('cover the same views as postkitChakraViews, in order', () => {
    expect(Object.keys(postkitChakraViewLoaders)).toEqual(
      Object.keys(postkitChakraViews),
    );
    expect(postkitChakraViewNames).toEqual(Object.keys(postkitChakraViews));
    expect(Object.keys(postkitChakraLazyViews)).toEqual(
      Object.keys(postkitChakraViews),
    );
  });

  it('each load the view postkitChakraViews has', async () => {
    for (const [name, load] of Object.entries(postkitChakraViewLoaders)) {
      expect(await load(), name).toBe(postkitChakraViews[name]);
    }
  });

  it('keep the catalog support computed from the views', () => {
    for (const name of Object.keys(postkitBuiltInDefinitions)) {
      expect(
        postkitComponentCatalog.components[
          name as keyof typeof postkitComponentCatalog.components
        ].support,
        name,
      ).toMatchObject({
        headless: Object.hasOwn(postkitHeadlessViews, name)
          ? 'supported'
          : 'unsupported',
        chakra: Object.hasOwn(postkitChakraViews, name)
          ? 'supported'
          : 'unsupported',
      });
    }
    expect([...postkitHeadlessViewNames]).toEqual(
      Object.keys(postkitHeadlessViews),
    );
  });
});

describe('createPostkitLazyMdxComponents', () => {
  it('has the same components as createPostkitMdxComponents, with lazy views', () => {
    const lazy = createPostkitLazyMdxComponents();
    const eager = createPostkitMdxComponents();

    expect(Object.keys(lazy).sort()).toEqual(Object.keys(eager).sort());
    for (const name of Object.keys(postkitChakraViewLoaders)) {
      const view = lazy[name as keyof typeof lazy] as { preload?: unknown };
      expect(typeof view.preload, name).toBe('function');
    }
    // Prose loads with the map.
    expect(lazy.p).toBe(postkitMdxComponents.p);
    expect(lazy.pre).toBe(postkitMdxComponents.pre);
  });

  it('lets components override the map', () => {
    function SiteCallout() {
      return null;
    }
    const map = createPostkitLazyMdxComponents({
      components: { Callout: SiteCallout },
    });
    expect(map.Callout).toBe(SiteCallout);
  });

  it('renders a view once it loads', async () => {
    const { Callout } = createPostkitLazyMdxComponents();
    await act(async () => {
      render(
        <PostkitProvider>
          <Callout tone="tip" title="Keep the content">
            Change the renderer.
          </Callout>
        </PostkitProvider>,
      );
    });
    await act(() => Callout.preload());

    expect(screen.getByText('Keep the content')).toBeTruthy();
    expect(
      document
        .querySelector('[data-postkit-component="Callout"]')
        ?.getAttribute('data-postkit-tone'),
    ).toBe('tip');
  });
});

describe('chakraLazy', () => {
  it('records the same manifest support as chakra', () => {
    const eager = createPostkit({ renderer: chakra, kits }).manifest();
    const lazy = createPostkit({ renderer: chakraLazy, kits }).manifest();
    expect(lazy).toEqual(eager);
  });

  it('gives the lazy views site defaults through the provider', async () => {
    const postkit = createPostkit({
      renderer: chakraLazy,
      kits: [article],
      defaults: { Callout: { variant: 'plain', title: 'Note' } },
    });
    const Callout = postkit.mdxComponents['Callout'] as ComponentType<
      Record<string, unknown>
    >;
    expect(Callout).toBe(postkitChakraLazyViews.Callout);

    await act(async () => {
      render(
        <postkit.Provider>
          <Callout>Body</Callout>
        </postkit.Provider>,
      );
    });
    await act(() => postkitChakraLazyViews.Callout.preload());
    expect(screen.getByText('Note')).toBeTruthy();
    expect(
      document
        .querySelector('[data-postkit-part="root"]')
        ?.getAttribute('data-variant'),
    ).toBe('plain');
  });
});

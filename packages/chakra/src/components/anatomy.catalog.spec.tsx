import { defaultSystem, type SystemContext } from '@chakra-ui/react';
import {
  calloutDefinition,
  carouselDefinition,
  deviceDefinition,
  figureDefinition,
  galleryDefinition,
  videoDefinition,
  type AnyPostkitComponentDefinition,
} from '@postkit/core/components';
import * as Headless from '@postkit/react';
import { createElement, type ComponentType, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { PostkitProvider } from '../lib/provider.js';
import { createPostkitSystem, postkitDefaultTheme } from '../lib/theme.js';
import { Callout } from './callout/callout.js';
import { Carousel } from './carousel/carousel.js';
import { postkitCarouselRecipe } from './carousel/carousel.recipe.js';
import { Device } from './device/device.js';
import { postkitDeviceRecipe } from './device/device.recipe.js';
import { Figure } from './figure/figure.js';
import { Gallery } from './gallery/gallery.js';
import { postkitGalleryRecipe } from './gallery/gallery.recipe.js';
import { Video } from './video/video.js';

/*
 * Anatomy parity for the 03 §7 catalog changes (step 10): Carousel peek,
 * Gallery row, Video captions and duration, Device, figure numbering and the
 * Callout `type` alias. Both renderers must emit the same parts, nested the
 * same way, with the same `data-postkit-*` and theme-variant attributes. The
 * helpers are copied from `anatomy.publication.spec.tsx`.
 */

interface AnatomyNode {
  readonly attributes: Readonly<Record<string, string>>;
  readonly children: readonly AnatomyNode[];
}

function anatomyOf(
  html: string,
  definition: AnyPostkitComponentDefinition,
): AnatomyNode[] {
  const stateAttributes = new Set<string>(
    definition.themeVariants.map(Headless.postkitStateAttributeName),
  );
  const document = new DOMParser().parseFromString(html, 'text/html');
  const collect = (element: Element): AnatomyNode[] =>
    [...element.children].flatMap((child) => {
      if (!child.hasAttribute('data-postkit-part')) return collect(child);
      const attributes = Object.fromEntries(
        [...child.attributes]
          .filter(
            (attribute) =>
              attribute.name.startsWith('data-postkit-') ||
              stateAttributes.has(attribute.name),
          )
          .map((attribute) => [attribute.name, attribute.value])
          .sort(([a], [b]) => a.localeCompare(b)),
      );
      return [{ attributes, children: collect(child) }];
    });
  return collect(document.body);
}

const presetSystem = createPostkitSystem({ preset: postkitDefaultTheme });

function renderBoth(
  HeadlessView: ComponentType<never>,
  ChakraView: ComponentType<never>,
  props: Record<string, unknown>,
  { system = presetSystem, numbered = false } = {},
) {
  const element = (View: ComponentType<never>): ReactNode =>
    createElement(
      View as unknown as ComponentType<Record<string, unknown>>,
      props,
    );
  return {
    headless: renderToStaticMarkup(
      numbered ? (
        <Headless.PostkitFiguresProvider figures="numbered">
          {element(HeadlessView)}
        </Headless.PostkitFiguresProvider>
      ) : (
        element(HeadlessView)
      ),
    ),
    chakra: renderToStaticMarkup(
      <PostkitProvider
        system={system}
        figures={numbered ? 'numbered' : undefined}
      >
        {element(ChakraView)}
      </PostkitProvider>,
    ),
  };
}

function expectSameAnatomy(
  definition: AnyPostkitComponentDefinition,
  HeadlessView: ComponentType<never>,
  ChakraView: ComponentType<never>,
  props: Record<string, unknown>,
  options?: { system?: SystemContext; numbered?: boolean },
) {
  const { headless, chakra } = renderBoth(
    HeadlessView,
    ChakraView,
    props,
    options,
  );
  const anatomy = anatomyOf(headless, definition);
  expect(anatomy).toHaveLength(1);
  expect(anatomyOf(chakra, definition)).toEqual(anatomy);
  return { anatomy, headless, chakra };
}

const partTree = (nodes: readonly AnatomyNode[]): unknown[] =>
  nodes.map((node) =>
    node.children.length
      ? {
          [node.attributes['data-postkit-part'] ?? '']: partTree(node.children),
        }
      : node.attributes['data-postkit-part'],
  );

const sizes = [undefined, 'sm', 'md', 'lg'] as const;
const variants = [undefined, 'outline', 'subtle', 'plain'] as const;

const carouselItems = [
  {
    title: 'Launcher',
    caption: 'The launcher.',
    image: { src: '/a.png', alt: 'A' },
  },
  { title: 'Zones', caption: 'Zones.', image: { src: '/b.png', alt: 'B' } },
  { title: 'Attention', image: { src: '/c.png', alt: 'C' } },
];

const cases = [
  {
    name: 'Carousel (peek)',
    definition: carouselDefinition,
    headless: Headless.Carousel,
    chakra: Carousel,
    props: { presentation: 'peek', label: 'Entry media', items: carouselItems },
    tree: [
      {
        root: [
          { slide: ['media', { content: ['title'] }] },
          { slide: ['media', { content: ['title'] }] },
          { slide: ['media', { content: ['title'] }] },
          {
            controls: [
              { caption: ['number'] },
              'previousTrigger',
              'nextTrigger',
            ],
          },
        ],
      },
    ],
  },
  {
    name: 'Carousel (slides, captioned)',
    definition: carouselDefinition,
    headless: Headless.Carousel,
    chakra: Carousel,
    props: { label: 'Entry media', items: carouselItems.slice(0, 2) },
    tree: [
      {
        root: [
          { slide: ['media', { content: ['title', { caption: ['number'] }] }] },
          { slide: ['media', { content: ['title', { caption: ['number'] }] }] },
          { controls: ['previousTrigger', 'status', 'nextTrigger'] },
        ],
      },
    ],
  },
  {
    name: 'Gallery (row)',
    definition: galleryDefinition,
    headless: Headless.Gallery,
    chakra: Gallery,
    props: {
      presentation: 'row',
      title: 'Three ways',
      items: [
        { src: '/a.png', alt: 'A', caption: 'Spatially' },
        { src: '/b.png', alt: 'B', caption: 'Reactively' },
        { src: '/c.png', alt: 'C' },
      ],
    },
    tree: [
      {
        root: [
          { header: ['title'] },
          {
            grid: [
              { item: ['image', { caption: ['number'] }] },
              { item: ['image', { caption: ['number'] }] },
              { item: ['image', { caption: ['number'] }] },
            ],
          },
        ],
      },
    ],
  },
  {
    name: 'Video (captions and duration)',
    definition: videoDefinition,
    headless: Headless.Video,
    chakra: Video,
    props: {
      src: '/v.mp4',
      title: 'Walkthrough',
      captions: '/v.vtt',
      captionsLang: 'en',
      duration: '2:04',
      caption: 'A morning in the app.',
    },
    tree: [
      {
        root: [
          { frame: [{ player: ['fallback'] }] },
          { caption: ['number', 'duration'] },
        ],
      },
    ],
  },
  {
    name: 'Figure (numbered)',
    definition: figureDefinition,
    headless: Headless.Figure,
    chakra: Figure,
    props: { src: '/a.png', alt: 'A', caption: 'C', credit: 'Ada' },
    tree: [
      {
        root: [
          { media: ['image'] },
          { figcaption: ['number', 'caption', 'credit'] },
        ],
      },
    ],
  },
  {
    name: 'Device (iphone)',
    definition: deviceDefinition,
    headless: Headless.Device,
    chakra: Device,
    props: { src: '/a.png', alt: 'A', caption: 'On iPhone.' },
    tree: [
      {
        root: [
          { frame: ['notch', { screen: ['image'] }] },
          { figcaption: ['number', 'caption'] },
        ],
      },
    ],
  },
  {
    name: 'Device (mac)',
    definition: deviceDefinition,
    headless: Headless.Device,
    chakra: Device,
    props: { kind: 'mac', src: '/a.png', alt: 'A' },
    tree: [
      {
        root: [
          { frame: [{ screen: ['image'] }] },
          'base',
          { figcaption: ['number'] },
        ],
      },
    ],
  },
] as const;

describe('Postkit anatomy parity for the 03 §7 catalog changes', () => {
  it.each(cases)(
    '$name emits the same anatomy for every variant and size',
    ({ definition, headless, chakra, props }) => {
      for (const variant of variants) {
        for (const size of sizes) {
          for (const numbered of [false, true]) {
            const {
              anatomy: [root],
            } = expectSameAnatomy(
              definition,
              headless as ComponentType<never>,
              chakra as ComponentType<never>,
              { ...props, variant, size },
              { numbered },
            );
            expect(root?.attributes).toMatchObject({
              'data-postkit-component': definition.name,
              'data-variant': variant ?? 'subtle',
              'data-size': size ?? 'md',
            });
          }
        }
      }
    },
    60_000,
  );

  it.each(cases)('emits the full $name part tree, numbered', (testCase) => {
    const { anatomy } = expectSameAnatomy(
      testCase.definition,
      testCase.headless as ComponentType<never>,
      testCase.chakra as ComponentType<never>,
      testCase.props,
      { numbered: true },
    );
    expect(partTree(anatomy)).toEqual(testCase.tree);
  });

  it.each(cases)(
    'matches $name without a registered recipe',
    ({ definition, headless, chakra, props }) => {
      expectSameAnatomy(
        definition,
        headless as ComponentType<never>,
        chakra as ComponentType<never>,
        props,
        { system: defaultSystem, numbered: true },
      );
    },
  );

  it('stamps the new theme variants on the root in both renderers', () => {
    const peek = expectSameAnatomy(
      carouselDefinition,
      Headless.Carousel as ComponentType<never>,
      Carousel as ComponentType<never>,
      { presentation: 'peek', items: carouselItems },
    );
    expect(peek.anatomy[0]?.attributes['data-presentation']).toBe('peek');
    const row = expectSameAnatomy(
      galleryDefinition,
      Headless.Gallery as ComponentType<never>,
      Gallery as ComponentType<never>,
      { presentation: 'row', items: [{ src: '/a.png', alt: 'A' }] },
    );
    expect(row.anatomy[0]?.attributes['data-presentation']).toBe('row');
    for (const kind of ['iphone', 'ipad', 'mac']) {
      const device = expectSameAnatomy(
        deviceDefinition,
        Headless.Device as ComponentType<never>,
        Device as ComponentType<never>,
        { kind, src: '/a.png', alt: 'A' },
      );
      expect(device.anatomy[0]?.attributes['data-kind']).toBe(kind);
    }
  });

  it('numbers the same labels in both renderers', () => {
    const labels = (html: string) =>
      [...html.matchAll(/data-postkit-part="number"[^>]*>([^<]+)</g)].map(
        (match) => match[1],
      );
    const { headless, chakra } = renderBoth(
      Headless.Gallery as ComponentType<never>,
      Gallery as ComponentType<never>,
      {
        presentation: 'row',
        items: [
          { src: '/a.png', alt: 'A' },
          { src: '/b.png', alt: 'B' },
          { src: '/c.png', alt: 'C' },
        ],
      },
      { numbered: true },
    );
    expect(labels(headless)).toEqual(['Fig. 1', 'Fig. 1b', 'Fig. 1c']);
    expect(labels(chakra)).toEqual(labels(headless));
  });

  it('puts peek arrows only, with the caption in a polite live region', () => {
    const { headless, chakra } = renderBoth(
      Headless.Carousel as ComponentType<never>,
      Carousel as ComponentType<never>,
      { presentation: 'peek', items: carouselItems },
    );
    for (const html of [headless, chakra]) {
      const document = new DOMParser().parseFromString(html, 'text/html');
      const caption = document.querySelector('[data-postkit-part="caption"]');
      expect(caption?.getAttribute('aria-live')).toBe('polite');
      expect(caption?.textContent).toBe('The launcher.');
      expect(document.querySelectorAll('button')).toHaveLength(2);
      expect(document.querySelector('[data-postkit-part="status"]')).toBeNull();
    }
  });

  it('maps the Callout type alias to tone in both renderers (D6)', () => {
    const { anatomy } = expectSameAnatomy(
      calloutDefinition,
      Headless.Callout as ComponentType<never>,
      Callout as ComponentType<never>,
      { type: 'warning', children: 'Body' },
    );
    expect(anatomy[0]?.attributes['data-tone']).toBe('warning');
  });

  it.each([
    {
      name: 'Carousel',
      definition: carouselDefinition,
      recipe: postkitCarouselRecipe,
    },
    {
      name: 'Gallery',
      definition: galleryDefinition,
      recipe: postkitGalleryRecipe,
    },
    {
      name: 'Device',
      definition: deviceDefinition,
      recipe: postkitDeviceRecipe,
    },
  ])(
    "$name's recipe has every theme-variant value, defaulting as its definition does",
    ({ definition, recipe }) => {
      const recipeVariants = recipe.variants as Record<string, object>;
      const recipeDefaults = recipe.defaultVariants as Record<string, unknown>;
      for (const name of definition.themeVariants) {
        const prop = (
          definition.props as AnyPostkitComponentDefinition['props']
        )[name];
        expect(prop?.kind).toBe('enum');
        if (prop?.kind !== 'enum') continue;
        expect(Object.keys(recipeVariants[name] ?? {}).sort()).toEqual(
          [...prop.values].sort(),
        );
        expect(recipeDefaults[name]).toBe(prop.default);
      }
    },
  );
});

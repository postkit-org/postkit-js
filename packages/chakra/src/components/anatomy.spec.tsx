import { defaultSystem, type SystemContext } from '@chakra-ui/react';
import {
  asideDefinition,
  calloutDefinition,
  cardGridDefinition,
  disclosureDefinition,
  figureDefinition,
  galleryDefinition,
  stepsDefinition,
  type AnyPostkitComponentDefinition,
} from '@postkit/core/components';
import * as Headless from '@postkit/react';
import { createElement, type ComponentType, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { PostkitProvider } from '../lib/provider.js';
import { createPostkitSystem, postkitDefaultTheme } from '../lib/theme.js';
import { Aside } from './aside/aside.js';
import { Callout } from './callout/callout.js';
import { postkitCalloutRecipe } from './callout/callout.recipe.js';
import { Figure } from './figure/figure.js';
import { postkitFigureRecipe } from './figure/figure.recipe.js';
import { CardGrid } from './card-grid/card-grid.js';
import { postkitCardGridRecipe } from './card-grid/card-grid.recipe.js';
import { Disclosure } from './disclosure/disclosure.js';
import { postkitDisclosureRecipe } from './disclosure/disclosure.recipe.js';
import { Gallery } from './gallery/gallery.js';
import { postkitGalleryRecipe } from './gallery/gallery.recipe.js';
import { Steps } from './steps/steps.js';
import { postkitStepsRecipe } from './steps/steps.recipe.js';

/*
 * Both renderers must emit the same anatomy (03 §5.1): the same parts, nested
 * the same way, with the same `data-postkit-*` and theme-variant state
 * attributes, for every tone, variant and size.
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
  system: SystemContext = presetSystem,
) {
  const element = (View: ComponentType<never>): ReactNode =>
    createElement(
      View as unknown as ComponentType<Record<string, unknown>>,
      props,
    );
  return {
    headless: renderToStaticMarkup(element(HeadlessView)),
    chakra: renderToStaticMarkup(
      <PostkitProvider system={system}>{element(ChakraView)}</PostkitProvider>,
    ),
  };
}

function expectSameAnatomy(
  definition: AnyPostkitComponentDefinition,
  HeadlessView: ComponentType<never>,
  ChakraView: ComponentType<never>,
  props: Record<string, unknown>,
  system?: SystemContext,
) {
  const { headless, chakra } = renderBoth(
    HeadlessView,
    ChakraView,
    props,
    system,
  );
  const anatomy = anatomyOf(headless, definition);
  expect(anatomy).toHaveLength(1);
  expect(anatomyOf(chakra, definition)).toEqual(anatomy);
  return anatomy;
}

const sizes = [undefined, 'sm', 'md', 'lg'] as const;
const variants = [undefined, 'outline', 'subtle', 'plain'] as const;
const tones = [
  undefined,
  'note',
  'tip',
  'important',
  'warning',
  'caution',
] as const;
const layouts = [undefined, 'inline', 'wide', 'bleed'] as const;

function* combinations<Value>(
  ...lists: readonly (readonly Value[])[]
): Generator<Value[]> {
  if (lists.length === 0) {
    yield [];
    return;
  }
  const [first, ...rest] = lists;
  for (const value of first ?? []) {
    for (const tail of combinations(...rest)) yield [value, ...tail];
  }
}

describe('Postkit anatomy parity between @postkit/react and @postkit/chakra', () => {
  it.each([
    ['Callout', calloutDefinition, Headless.Callout, Callout],
    ['Aside', asideDefinition, Headless.Aside, Aside],
  ] as const)(
    '%s emits the same anatomy for every tone, variant and size',
    (name, definition, HeadlessView, ChakraView) => {
      for (const [tone, variant, size] of combinations<string | undefined>(
        tones,
        variants,
        sizes,
      )) {
        for (const title of [undefined, 'Heads up']) {
          const anatomy = expectSameAnatomy(
            definition,
            HeadlessView as ComponentType<never>,
            ChakraView as ComponentType<never>,
            { tone, variant, size, title, children: 'Body' },
          );
          expect(anatomy[0]?.attributes).toMatchObject({
            'data-postkit-component': name,
            'data-postkit-part': 'root',
            'data-tone': tone ?? 'note',
            'data-variant': variant ?? 'subtle',
            'data-size': size ?? 'md',
          });
        }
      }
    },
    60_000,
  );

  it('Figure emits the same anatomy for every layout, variant, size and content shape', () => {
    const shapes = [
      {},
      { caption: 'A caption' },
      { credit: 'Photo', creditHref: 'https://example.com/credit' },
      { href: '/full.jpg', caption: 'Linked', credit: 'Plain credit' },
    ];
    for (const [layout, variant, size] of combinations<string | undefined>(
      layouts,
      variants,
      sizes,
    )) {
      // Every content shape once, the full matrix with one shape.
      for (const shape of layout || variant || size
        ? shapes.slice(3)
        : shapes) {
        const anatomy = expectSameAnatomy(
          figureDefinition,
          Headless.Figure as ComponentType<never>,
          Figure as ComponentType<never>,
          { src: '/a.jpg', alt: 'An image', layout, variant, size, ...shape },
        );
        expect(anatomy[0]?.attributes).toMatchObject({
          'data-postkit-component': 'Figure',
          'data-layout': layout ?? 'inline',
          'data-variant': variant ?? 'subtle',
          'data-size': size ?? 'md',
        });
      }
    }
  }, 60_000);

  it('emits the full Figure part tree', () => {
    const anatomy = expectSameAnatomy(
      figureDefinition,
      Headless.Figure as ComponentType<never>,
      Figure as ComponentType<never>,
      {
        src: '/a.jpg',
        alt: 'An image',
        href: '/full.jpg',
        caption: 'Caption',
        credit: 'Credit',
        creditHref: '/credit',
      },
    );
    const parts = (nodes: readonly AnatomyNode[]): unknown[] =>
      nodes.map((node) =>
        node.children.length
          ? {
              [node.attributes['data-postkit-part'] ?? '']: parts(
                node.children,
              ),
            }
          : node.attributes['data-postkit-part'],
      );
    expect(parts(anatomy)).toEqual([
      {
        root: [
          { mediaLink: [{ media: ['image'] }] },
          { figcaption: ['caption', { credit: ['creditLink'] }] },
        ],
      },
    ]);
  });

  it('marks unstyled instances the same way', () => {
    expectSameAnatomy(
      calloutDefinition,
      Headless.Callout as ComponentType<never>,
      Callout as ComponentType<never>,
      { unstyled: true, children: 'Body' },
    );
    const [root] = expectSameAnatomy(
      figureDefinition,
      Headless.Figure as ComponentType<never>,
      Figure as ComponentType<never>,
      { unstyled: true, src: '/a.jpg', alt: '' },
    );
    expect(root?.attributes['data-postkit-unstyled']).toBe('');
  });

  it('falls back from an unknown tone the same way', () => {
    const [root] = expectSameAnatomy(
      calloutDefinition,
      Headless.Callout as ComponentType<never>,
      Callout as ComponentType<never>,
      { tone: 'bogus', children: 'Body' },
    );
    expect(root?.attributes['data-tone']).toBe('note');
    expect(root?.attributes['data-postkit-tone']).toBe('note');
  });

  it('matches without a registered recipe, from the definition defaults', () => {
    expectSameAnatomy(
      calloutDefinition,
      Headless.Callout as ComponentType<never>,
      Callout as ComponentType<never>,
      { children: 'Body' },
      defaultSystem,
    );
    expectSameAnatomy(
      figureDefinition,
      Headless.Figure as ComponentType<never>,
      Figure as ComponentType<never>,
      { src: '/a.jpg', alt: '', caption: 'C' },
      defaultSystem,
    );
  });

  it.each([
    ['Callout', calloutDefinition, postkitCalloutRecipe],
    ['Figure', figureDefinition, postkitFigureRecipe],
  ] as const)(
    "%s's recipe defaults match its definition's defaults (D12)",
    (_, definition, recipe) => {
      const definitionDefaults = Object.fromEntries(
        definition.themeVariants.map((name) => [
          name,
          (definition.props as AnyPostkitComponentDefinition['props'])[name]
            ?.default,
        ]),
      );
      expect(recipe.defaultVariants).toEqual(definitionDefaults);
    },
  );
  describe('article structure (03 step 7)', () => {
    const galleryItems = [
      { src: '/a.jpg', alt: 'A', caption: 'Caption', width: 800 },
      { src: '/b.jpg', alt: '', href: '/b-full.jpg' },
      { src: '/c.jpg', alt: 'C', href: '/c', caption: 'Linked' },
    ];
    const cardItems = [
      {
        title: 'One',
        description: 'First',
        href: '/one',
        linkLabel: 'Read',
        image: { src: '/one.jpg', alt: 'One' },
        meta: '5 min',
      },
      { title: 'Two', href: '/two' },
      { title: 'Three' },
    ];
    const stepItems = [
      { title: 'Install', description: 'Add the package.' },
      { title: 'Render' },
    ];

    const cases = [
      [
        'Gallery',
        galleryDefinition,
        Headless.Gallery,
        Gallery,
        [
          { items: galleryItems },
          { items: galleryItems, title: 'Title' },
          { items: JSON.stringify(galleryItems), description: 'D', columns: 3 },
        ],
      ],
      [
        'Disclosure',
        disclosureDefinition,
        Headless.Disclosure,
        Disclosure,
        [
          { summary: 'More', children: 'Body' },
          { summary: 'Open', open: true, children: 'Body' },
        ],
      ],
      [
        'Steps',
        stepsDefinition,
        Headless.Steps,
        Steps,
        [{ items: stepItems }, { items: [] }],
      ],
      [
        'CardGrid',
        cardGridDefinition,
        Headless.CardGrid,
        CardGrid,
        [
          { items: cardItems },
          { items: cardItems, title: 'Title', description: 'D', columns: 4 },
          { items: JSON.stringify(cardItems), description: 'Only' },
        ],
      ],
    ] as const;

    it.each(cases)(
      '%s emits the same anatomy for every variant, size and content shape',
      (name, definition, HeadlessView, ChakraView, shapes) => {
        for (const [variant, size] of combinations<string | undefined>(
          variants,
          sizes,
        )) {
          for (const shape of variant || size ? shapes.slice(-1) : shapes) {
            const anatomy = expectSameAnatomy(
              definition,
              HeadlessView as ComponentType<never>,
              ChakraView as ComponentType<never>,
              { variant, size, ...shape },
            );
            expect(anatomy[0]?.attributes).toMatchObject({
              'data-postkit-component': name,
              'data-postkit-part': 'root',
              'data-variant': variant ?? 'subtle',
              'data-size': size ?? 'md',
            });
          }
        }
        for (const system of [presetSystem, defaultSystem]) {
          const [root] = expectSameAnatomy(
            definition,
            HeadlessView as ComponentType<never>,
            ChakraView as ComponentType<never>,
            { unstyled: true, ...shapes[0] },
            system,
          );
          expect(root?.attributes['data-postkit-unstyled']).toBe('');
        }
      },
      60_000,
    );

    it('emits the full part trees', () => {
      const parts = (nodes: readonly AnatomyNode[]): unknown[] =>
        nodes.map((node) =>
          node.children.length
            ? {
                [node.attributes['data-postkit-part'] ?? '']: parts(
                  node.children,
                ),
              }
            : node.attributes['data-postkit-part'],
        );
      const tree = (
        definition: AnyPostkitComponentDefinition,
        HeadlessView: unknown,
        ChakraView: unknown,
        props: Record<string, unknown>,
      ) =>
        parts(
          expectSameAnatomy(
            definition,
            HeadlessView as ComponentType<never>,
            ChakraView as ComponentType<never>,
            props,
          ),
        );

      expect(
        tree(galleryDefinition, Headless.Gallery, Gallery, {
          title: 'T',
          description: 'D',
          items: [{ src: '/a.jpg', alt: 'A', href: '/a', caption: 'C' }],
        }),
      ).toEqual([
        {
          root: [
            { header: ['title', 'description'] },
            { grid: [{ item: [{ imageLink: ['image'] }, 'caption'] }] },
          ],
        },
      ]);
      expect(
        tree(disclosureDefinition, Headless.Disclosure, Disclosure, {
          summary: 'S',
          children: 'C',
        }),
      ).toEqual([{ root: [{ summary: ['indicator'] }, 'content'] }]);
      expect(
        tree(stepsDefinition, Headless.Steps, Steps, {
          items: [{ title: 'T', description: 'D' }],
        }),
      ).toEqual([
        { root: [{ item: ['marker', { content: ['title', 'description'] }] }] },
      ]);
      expect(
        tree(cardGridDefinition, Headless.CardGrid, CardGrid, {
          title: 'T',
          description: 'D',
          items: [cardItems[0]],
        }),
      ).toEqual([
        {
          root: [
            { header: ['title', 'description'] },
            {
              grid: [
                {
                  card: [
                    'image',
                    {
                      cardBody: [
                        'cardTitle',
                        'cardDescription',
                        'meta',
                        'link',
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ]);
    });

    it.each([
      ['Gallery', galleryDefinition, postkitGalleryRecipe],
      ['Disclosure', disclosureDefinition, postkitDisclosureRecipe],
      ['Steps', stepsDefinition, postkitStepsRecipe],
      ['CardGrid', cardGridDefinition, postkitCardGridRecipe],
    ] as const)(
      "%s's recipe defaults match its definition's defaults (D12)",
      (_, definition, recipe) => {
        const definitionDefaults = Object.fromEntries(
          definition.themeVariants.map((name) => [
            name,
            (definition.props as AnyPostkitComponentDefinition['props'])[name]
              ?.default,
          ]),
        );
        expect(recipe.defaultVariants).toEqual(definitionDefaults);
      },
    );
  });
});

import { defaultSystem, type SystemContext } from '@chakra-ui/react';
import {
  asideDefinition,
  calloutDefinition,
  figureDefinition,
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

// Standalone components (03 step 7).
import {
  appearsOnDefinition,
  audioDefinition,
  authorCardDefinition,
  callToActionDefinition,
  chartDefinition,
  videoDefinition,
} from '@postkit/core/components';
import { AppearsOn } from './appears-on/appears-on.js';
import { postkitAppearsOnRecipe } from './appears-on/appears-on.recipe.js';
import { Audio } from './audio/audio.js';
import { postkitAudioRecipe } from './audio/audio.recipe.js';
import { AuthorCard } from './author-card/author-card.js';
import { postkitAuthorCardRecipe } from './author-card/author-card.recipe.js';
import { CallToAction } from './call-to-action/call-to-action.js';
import { postkitCallToActionRecipe } from './call-to-action/call-to-action.recipe.js';
import { Chart } from './chart/chart.js';
import { postkitChartRecipe } from './chart/chart.recipe.js';
import { Video } from './video/video.js';
import { postkitVideoRecipe } from './video/video.recipe.js';

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
});

describe('Standalone component anatomy parity (03 step 7)', () => {
  const partTree = (nodes: readonly AnatomyNode[]): unknown[] =>
    nodes.map((node) =>
      node.children.length
        ? {
            [node.attributes['data-postkit-part'] ?? '']: partTree(
              node.children,
            ),
          }
        : node.attributes['data-postkit-part'],
    );

  const cases = [
    {
      name: 'AppearsOn',
      definition: appearsOnDefinition,
      headless: Headless.AppearsOn,
      chakra: AppearsOn,
      recipe: postkitAppearsOnRecipe,
      variants: { presentation: [undefined, 'inline', 'list', 'badges'] },
      shapes: [
        { items: '[{"service":"bluesky","url":"https://bsky.app/1"}]' },
        {
          showDates: true,
          items: [
            {
              service: 'bluesky',
              url: 'https://bsky.app/1',
              publishedAt: '2026-01-02',
              status: 'pending',
            },
            { service: 'medium', url: 'https://medium.com/1', label: 'M' },
          ],
        },
      ],
      tree: [
        {
          root: [
            'label',
            {
              list: [
                { item: [{ link: ['icon'] }, 'date', 'status'] },
                { item: [{ link: ['icon'] }] },
              ],
            },
          ],
        },
      ],
    },
    {
      name: 'Audio',
      definition: audioDefinition,
      headless: Headless.Audio,
      chakra: Audio,
      recipe: postkitAudioRecipe,
      variants: {},
      shapes: [
        { src: '/a.mp3', title: 'A' },
        { src: '/a.mp3', title: 'A', caption: 'Caption', preload: 'none' },
      ],
      tree: [{ root: ['title', { player: ['fallback'] }, 'caption'] }],
    },
    {
      name: 'AuthorCard',
      definition: authorCardDefinition,
      headless: Headless.AuthorCard,
      chakra: AuthorCard,
      recipe: postkitAuthorCardRecipe,
      variants: { presentation: [undefined, 'card', 'compact', 'inline'] },
      shapes: [
        { name: 'Ada', avatarSrc: '/ada.jpg' },
        { name: 'Ada', children: 'Bio' },
        {
          name: 'Ada',
          role: 'Writer',
          href: '/ada',
          bio: 'Bio',
          links: '[{"label":"Site","href":"/s","rel":"me"}]',
        },
      ],
      tree: [
        {
          root: [
            'avatar',
            {
              content: [
                { header: [{ name: ['nameLink'] }, 'role'] },
                'bio',
                { links: ['link'] },
              ],
            },
          ],
        },
      ],
    },
    {
      name: 'CallToAction',
      definition: callToActionDefinition,
      headless: Headless.CallToAction,
      chakra: CallToAction,
      recipe: postkitCallToActionRecipe,
      variants: { alignment: [undefined, 'start', 'center'] },
      shapes: [
        { title: 'T' },
        { title: 'T', children: 'Body', primaryLabel: 'P' },
        {
          title: 'T',
          eyebrow: 'E',
          description: 'D',
          primaryLabel: 'P',
          primaryHref: '/p',
          secondaryLabel: 'S',
          secondaryHref: '/s',
        },
      ],
      tree: [
        {
          root: [
            { content: ['eyebrow', 'title', 'body'] },
            { actions: ['primaryAction', 'secondaryAction'] },
          ],
        },
      ],
    },
    {
      name: 'Chart',
      definition: chartDefinition,
      headless: Headless.Chart,
      chakra: Chart,
      recipe: postkitChartRecipe,
      variants: {},
      shapes: [
        { title: 'T', data: '[]' },
        { title: 'T', data: [{ label: 'Jan', a: 1 }], type: 'line' },
        {
          title: 'T',
          description: 'D',
          showTable: 'true',
          data: '[{"label":"Jan","a":1,"b":3},{"label":"Feb","a":2,"b":5}]',
        },
      ],
      tree: [
        {
          root: [
            'title',
            'description',
            {
              legend: [
                { legendItem: ['legendSwatch'] },
                { legendItem: ['legendSwatch'] },
              ],
            },
            {
              plot: [
                {
                  svg: [
                    ...Array.from({ length: 3 }, () => [
                      'gridLine',
                      'axisLabel',
                    ]).flat(),
                    'axisLabel',
                    'axisLabel',
                    'seriesMark',
                    'seriesMark',
                    'seriesMark',
                    'seriesMark',
                  ],
                },
              ],
            },
            {
              tableContainer: [
                {
                  table: [
                    'headerCell',
                    'headerCell',
                    'headerCell',
                    'rowHeader',
                    'dataCell',
                    'dataCell',
                    'rowHeader',
                    'dataCell',
                    'dataCell',
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      name: 'Video',
      definition: videoDefinition,
      headless: Headless.Video,
      chakra: Video,
      recipe: postkitVideoRecipe,
      variants: {},
      shapes: [
        { src: '/v.mp4', title: 'V' },
        {
          src: '/v.mp4',
          title: 'V',
          poster: '/p.jpg',
          caption: 'C',
          aspectRatio: '4 / 3',
          tracks: [{ src: '/t.vtt', srcLang: 'en', label: 'English' }],
        },
      ],
      tree: [{ root: [{ frame: [{ player: ['fallback'] }] }, 'caption'] }],
    },
  ] as const;

  it.each(cases)(
    '$name emits the same anatomy for every theme variant and content shape',
    ({ name, definition, headless, chakra, variants: extra, shapes }) => {
      const lists = [sizes, variants, ...Object.values(extra)] as const;
      const names = ['size', 'variant', ...Object.keys(extra)];
      for (const values of combinations<string | undefined>(...lists)) {
        const themed = Object.fromEntries(
          names.map((prop, index) => [prop, values[index]]),
        );
        // Every content shape with the defaults, the full matrix with the last.
        const all = values.every((value) => value === undefined);
        for (const shape of all ? shapes : shapes.slice(-1)) {
          const [root] = expectSameAnatomy(
            definition,
            headless as ComponentType<never>,
            chakra as ComponentType<never>,
            { ...shape, ...themed },
          );
          const expected = Object.fromEntries(
            names.map((prop) => [
              Headless.postkitStateAttributeName(prop),
              themed[prop] ??
                (definition.props as AnyPostkitComponentDefinition['props'])[
                  prop
                ]?.default,
            ]),
          );
          expect(root?.attributes).toMatchObject({
            'data-postkit-component': name,
            'data-postkit-part': 'root',
            ...expected,
          });
        }
      }
    },
    60_000,
  );

  it.each(cases)(
    '$name emits its full part tree',
    ({ definition, headless, chakra, shapes, tree }) => {
      const anatomy = expectSameAnatomy(
        definition,
        headless as ComponentType<never>,
        chakra as ComponentType<never>,
        shapes[shapes.length - 1] as Record<string, unknown>,
      );
      expect(partTree(anatomy)).toEqual(tree);
    },
  );

  it.each(cases)(
    '$name matches unstyled and without a registered recipe',
    ({ definition, headless, chakra, shapes }) => {
      const [root] = expectSameAnatomy(
        definition,
        headless as ComponentType<never>,
        chakra as ComponentType<never>,
        { ...shapes[0], unstyled: true },
      );
      expect(root?.attributes['data-postkit-unstyled']).toBe('');
      expectSameAnatomy(
        definition,
        headless as ComponentType<never>,
        chakra as ComponentType<never>,
        shapes[0] as Record<string, unknown>,
        defaultSystem,
      );
    },
  );

  it.each(cases)(
    "$name's recipe slots and defaults come from its definition (D12)",
    ({ definition, recipe }) => {
      expect(recipe.slots).toEqual(definition.slots);
      expect(recipe.defaultVariants).toEqual(
        Object.fromEntries(
          definition.themeVariants.map((name) => [
            name,
            (definition.props as AnyPostkitComponentDefinition['props'])[name]
              ?.default,
          ]),
        ),
      );
    },
  );
});

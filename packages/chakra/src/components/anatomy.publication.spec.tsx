import { defaultSystem, type SystemContext } from '@chakra-ui/react';
import { type AnyPostkitComponentDefinition } from '@postkit/core/components';
import * as Headless from '@postkit/react';
import { createElement, type ComponentType, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PostkitProvider } from '../lib/provider.js';
import { createPostkitSystem, postkitDefaultTheme } from '../lib/theme.js';
import {
  audienceBoundaryDefinition,
  comparisonDefinition,
  keyTakeawayDefinition,
  productCardDefinition,
  pullQuoteDefinition,
  relatedContentDefinition,
  seriesNavigationDefinition,
  sponsorBlockDefinition,
  statDefinition,
} from '@postkit/core/components';
import { AudienceBoundary } from './audience-boundary/audience-boundary.js';
import { postkitAudienceBoundaryRecipe } from './audience-boundary/audience-boundary.recipe.js';
import { Comparison } from './comparison/comparison.js';
import { postkitComparisonRecipe } from './comparison/comparison.recipe.js';
import { KeyTakeaway } from './key-takeaway/key-takeaway.js';
import { postkitKeyTakeawayRecipe } from './key-takeaway/key-takeaway.recipe.js';
import { ProductCard } from './product-card/product-card.js';
import { postkitProductCardRecipe } from './product-card/product-card.recipe.js';
import { PullQuote } from './pull-quote/pull-quote.js';
import { postkitPullQuoteRecipe } from './pull-quote/pull-quote.recipe.js';
import { RelatedContent } from './related-content/related-content.js';
import { postkitRelatedContentRecipe } from './related-content/related-content.recipe.js';
import { SeriesNavigation } from './series-navigation/series-navigation.js';
import { postkitSeriesNavigationRecipe } from './series-navigation/series-navigation.recipe.js';
import { SponsorBlock } from './sponsor-block/sponsor-block.js';
import { postkitSponsorBlockRecipe } from './sponsor-block/sponsor-block.recipe.js';
import { Stat } from './stat/stat.js';
import { postkitStatRecipe } from './stat/stat.recipe.js';

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

/*
 * The publication components (03 step 7). Each case renders a minimal and a
 * full content shape; the full shape's part tree is checked as well.
 */
const partTree = (nodes: readonly AnatomyNode[]): unknown[] =>
  nodes.map((node) =>
    node.children.length
      ? {
          [node.attributes['data-postkit-part'] ?? '']: partTree(node.children),
        }
      : node.attributes['data-postkit-part'],
  );

const publicationCases = [
  {
    name: 'PullQuote',
    definition: pullQuoteDefinition,
    headless: Headless.PullQuote,
    chakra: PullQuote,
    recipe: postkitPullQuoteRecipe,
    minimal: { quote: 'Q' },
    full: { quote: 'Q', attribution: 'Ada', cite: 'Notes' },
    tree: [{ root: ['mark', 'quote', { attribution: ['cite'] }] }],
  },
  {
    name: 'KeyTakeaway',
    definition: keyTakeawayDefinition,
    headless: Headless.KeyTakeaway,
    chakra: KeyTakeaway,
    recipe: postkitKeyTakeawayRecipe,
    minimal: {},
    full: { eyebrow: 'E', title: 'T', items: ['a', 'b'], children: 'Body' },
    tree: [{ root: ['eyebrow', 'title', 'body', { list: ['item', 'item'] }] }],
  },
  {
    name: 'Stat',
    definition: statDefinition,
    headless: Headless.Stat,
    chakra: Stat,
    recipe: postkitStatRecipe,
    minimal: { value: '98%', label: 'L' },
    full: { value: '98%', label: 'L', trend: '+4%', description: 'D' },
    tree: [{ root: ['label', 'value', 'trend', 'description'] }],
  },
  {
    name: 'Comparison',
    definition: comparisonDefinition,
    headless: Headless.Comparison,
    chakra: Comparison,
    recipe: postkitComparisonRecipe,
    minimal: { columns: [], items: [] },
    full: {
      title: 'T',
      description: 'D',
      columns: ['A'],
      items: [{ label: 'X', values: [true] }],
    },
    tree: [
      {
        root: [
          'title',
          'description',
          {
            scroller: [
              {
                table: [
                  { head: ['header', 'header'] },
                  { row: ['label', 'value'] },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    name: 'ProductCard',
    definition: productCardDefinition,
    headless: Headless.ProductCard,
    chakra: ProductCard,
    recipe: postkitProductCardRecipe,
    minimal: { title: 'T', href: '/p' },
    full: {
      title: 'T',
      href: '/p',
      imageSrc: '/i.jpg',
      badge: 'New',
      description: 'D',
      rating: 4.5,
      price: '$1',
    },
    tree: [
      {
        root: [
          'image',
          {
            content: [
              'badge',
              'title',
              'description',
              'rating',
              { footer: ['price', 'action'] },
            ],
          },
        ],
      },
    ],
  },
  {
    name: 'RelatedContent',
    definition: relatedContentDefinition,
    headless: Headless.RelatedContent,
    chakra: RelatedContent,
    recipe: postkitRelatedContentRecipe,
    minimal: { items: [] },
    full: {
      items: [{ title: 'A', href: '/a', description: 'D', meta: 'M' }],
    },
    tree: [
      {
        root: [
          'title',
          {
            list: [{ item: [{ link: ['itemTitle', 'description', 'meta'] }] }],
          },
        ],
      },
    ],
  },
  {
    name: 'SeriesNavigation',
    definition: seriesNavigationDefinition,
    headless: Headless.SeriesNavigation,
    chakra: SeriesNavigation,
    recipe: postkitSeriesNavigationRecipe,
    minimal: { title: 'S' },
    full: {
      title: 'S',
      current: 2,
      total: 4,
      previous: { title: 'P', href: '/p' },
      next: '{"title":"N","href":"/n"}',
    },
    tree: [
      {
        root: [
          { header: ['title', 'position'] },
          {
            links: [
              { link: ['direction', 'linkTitle'] },
              { link: ['direction', 'linkTitle'] },
            ],
          },
        ],
      },
    ],
  },
  {
    name: 'SponsorBlock',
    definition: sponsorBlockDefinition,
    headless: Headless.SponsorBlock,
    chakra: SponsorBlock,
    recipe: postkitSponsorBlockRecipe,
    minimal: { name: 'N' },
    full: { name: 'N', logoSrc: '/l.png', message: 'M', href: '/s' },
    tree: [
      {
        root: [
          'disclosure',
          'logo',
          { content: ['name', 'message', 'action'] },
        ],
      },
    ],
  },
  {
    name: 'AudienceBoundary',
    definition: audienceBoundaryDefinition,
    headless: Headless.AudienceBoundary,
    chakra: AudienceBoundary,
    recipe: postkitAudienceBoundaryRecipe,
    minimal: { audience: 'members', children: 'C' },
    full: {
      audience: 'members',
      authorized: false,
      showLabel: true,
      children: 'C',
    },
    tree: [{ root: ['label', 'fallback'] }],
  },
] as const;

describe('Postkit anatomy parity for the publication components', () => {
  it.each(publicationCases)(
    '$name emits the same anatomy for every variant, size and content shape',
    ({ name, definition, headless, chakra, minimal, full }) => {
      for (const [variant, size] of combinations<string | undefined>(
        variants,
        sizes,
      )) {
        for (const shape of [minimal, full]) {
          const [root] = expectSameAnatomy(
            definition,
            headless as ComponentType<never>,
            chakra as ComponentType<never>,
            { ...shape, variant, size },
          );
          expect(root?.attributes).toMatchObject({
            'data-postkit-component': name,
            'data-postkit-part': 'root',
            'data-variant': variant ?? 'subtle',
            'data-size': size ?? 'md',
          });
        }
      }
    },
    60_000,
  );

  it.each(publicationCases)(
    'emits the full $name part tree',
    ({ definition, headless, chakra, full, tree }) => {
      const anatomy = expectSameAnatomy(
        definition,
        headless as ComponentType<never>,
        chakra as ComponentType<never>,
        full,
      );
      expect(partTree(anatomy)).toEqual(tree);
    },
  );

  it.each(publicationCases)(
    'marks an unstyled $name and matches without a registered recipe',
    ({ definition, headless, chakra, full }) => {
      const [root] = expectSameAnatomy(
        definition,
        headless as ComponentType<never>,
        chakra as ComponentType<never>,
        { ...full, unstyled: true },
      );
      expect(root?.attributes['data-postkit-unstyled']).toBe('');
      expectSameAnatomy(
        definition,
        headless as ComponentType<never>,
        chakra as ComponentType<never>,
        full,
        defaultSystem,
      );
    },
  );

  it('keeps the AudienceBoundary content for an authorized viewer', () => {
    const [root] = expectSameAnatomy(
      audienceBoundaryDefinition,
      Headless.AudienceBoundary as ComponentType<never>,
      AudienceBoundary as ComponentType<never>,
      { audience: 'members', children: 'C' },
    );
    expect(root?.attributes['data-postkit-audience']).toBe('members');
    expect(partTree(root ? [root] : [])).toEqual([{ root: ['content'] }]);
  });

  it.each(publicationCases)(
    "$name's recipe defaults match its definition's defaults (D12)",
    ({ definition, recipe }) => {
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

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
import {
  diffDefinition,
  fileCardDefinition,
  fileTreeDefinition,
  terminalDefinition,
} from '@postkit/core/components';
import { Diff } from './diff/diff.js';
import { postkitDiffRecipe } from './diff/diff.recipe.js';
import { FileCard } from './file-card/file-card.js';
import { postkitFileCardRecipe } from './file-card/file-card.recipe.js';
import { FileTree } from './file-tree/file-tree.js';
import { postkitFileTreeRecipe } from './file-tree/file-tree.recipe.js';
import { Terminal } from './terminal/terminal.js';
import { postkitTerminalRecipe } from './terminal/terminal.recipe.js';

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

  describe('technical content', () => {
    const technical = [
      [
        'Terminal',
        terminalDefinition,
        Headless.Terminal,
        Terminal,
        postkitTerminalRecipe,
        [
          { command: 'npm i' },
          { command: 'npm i', output: 'added 1 package', prompt: '>' },
        ],
      ],
      [
        'Diff',
        diffDefinition,
        Headless.Diff,
        Diff,
        postkitDiffRecipe,
        [{ diff: '- a\n+ b\n c\n' }, { diff: '+ b', title: 'a.ts' }],
      ],
      [
        'FileTree',
        fileTreeDefinition,
        Headless.FileTree,
        FileTree,
        postkitFileTreeRecipe,
        [
          { items: [{ path: 'a.ts' }] },
          {
            title: 'Files',
            items: JSON.stringify([
              { path: 'src', type: 'folder' },
              { path: 'src/a.ts', meta: '2 KB' },
            ]),
          },
        ],
      ],
      [
        'FileCard',
        fileCardDefinition,
        Headless.FileCard,
        FileCard,
        postkitFileCardRecipe,
        [
          { href: '/a.pdf', name: 'a.pdf' },
          {
            href: '/b.zip',
            name: 'b.zip',
            description: 'Sources',
            fileType: 'ZIP',
            fileSize: '2 MB',
            download: 'false',
          },
        ],
      ],
    ] as const;

    it.each(technical)(
      '%s emits the same anatomy for every variant, size and content shape',
      (name, definition, HeadlessView, ChakraView, _recipe, shapes) => {
        for (const [variant, size] of combinations<string | undefined>(
          variants,
          sizes,
        )) {
          for (const shape of shapes) {
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
      },
      60_000,
    );

    it.each(technical)(
      '%s matches unstyled and without a registered recipe',
      (_, definition, HeadlessView, ChakraView, _recipe, shapes) => {
        const shape = shapes[shapes.length - 1];
        const [root] = expectSameAnatomy(
          definition,
          HeadlessView as ComponentType<never>,
          ChakraView as ComponentType<never>,
          { unstyled: true, ...shape },
        );
        expect(root?.attributes['data-postkit-unstyled']).toBe('');
        expectSameAnatomy(
          definition,
          HeadlessView as ComponentType<never>,
          ChakraView as ComponentType<never>,
          { ...shape },
          defaultSystem,
        );
      },
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
      const tree = (index: number) => {
        const [, definition, HeadlessView, ChakraView, , shapes] =
          technical[index];
        return parts(
          expectSameAnatomy(
            definition,
            HeadlessView as ComponentType<never>,
            ChakraView as ComponentType<never>,
            { ...shapes[shapes.length - 1] },
          ),
        );
      };

      expect(tree(0)).toEqual([
        {
          root: [
            { header: ['dots', 'title'] },
            { body: ['prompt', 'command', 'output'] },
          ],
        },
      ]);
      expect(tree(1)).toEqual([
        {
          root: [
            { header: ['title'] },
            { code: [{ line: ['marker', 'content'] }] },
          ],
        },
      ]);
      expect(tree(2)).toEqual([
        {
          root: [
            'title',
            {
              list: [
                { item: ['icon', 'path'] },
                { item: ['icon', 'path', 'meta'] },
              ],
            },
          ],
        },
      ]);
      expect(tree(3)).toEqual([
        {
          root: [
            'icon',
            { content: ['name', 'description', 'meta'] },
            'action',
          ],
        },
      ]);
    });

    it.each(technical)(
      "%s's recipe defaults match its definition's defaults (D12)",
      (_, definition, _headless, _chakra, recipe) => {
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

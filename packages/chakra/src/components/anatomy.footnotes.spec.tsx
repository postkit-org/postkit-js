import {
  footnoteDefinition,
  footnotesDefinition,
  sidenoteDefinition,
  type AnyPostkitComponentDefinition,
} from '@postkit/core/components';
import * as Headless from '@postkit/react';
import { createElement, type ComponentType, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { PostkitProvider } from '../lib/postkit-provider.js';
import { createPostkitSystem } from '../lib/create-postkit-system.js';
import { postkitDefaultTheme } from '../lib/theme.js';
import { Footnote } from './footnote/footnote.js';
import { Footnotes } from './footnotes/footnotes.js';
import { Sidenote } from './sidenote/sidenote.js';

/*
 * Footnotes (03 §7.1) emit the same anatomy in both renderers (03 §5.1): the
 * same parts, nested the same way, with the same `data-postkit-*` and
 * theme-variant state attributes, for every marker, numbering, placement,
 * variant and size.
 */

interface AnatomyNode {
  readonly attributes: Readonly<Record<string, string>>;
  readonly children: readonly AnatomyNode[];
}

const stateAttributes = new Set(['data-size', 'data-variant']);

function anatomyOf(html: string): AnatomyNode[] {
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

const system = createPostkitSystem({ preset: postkitDefaultTheme });

function expectSameAnatomy(
  definition: AnyPostkitComponentDefinition,
  HeadlessView: ComponentType<never>,
  ChakraView: ComponentType<never>,
  props: Record<string, unknown>,
) {
  const element = (View: ComponentType<never>): ReactNode =>
    createElement(
      View as unknown as ComponentType<Record<string, unknown>>,
      props,
    );
  const headless = anatomyOf(renderToStaticMarkup(element(HeadlessView)));
  const chakra = anatomyOf(
    renderToStaticMarkup(
      <PostkitProvider system={system}>{element(ChakraView)}</PostkitProvider>,
    ),
  );
  expect(headless).toHaveLength(1);
  expect(headless[0]?.attributes).toMatchObject({
    'data-postkit-component': definition.name,
    'data-postkit-part': 'root',
  });
  expect(chakra).toEqual(headless);
  return headless;
}

const sizes = [undefined, 'sm', 'md', 'lg'] as const;
const variants = [undefined, 'outline', 'subtle', 'plain'] as const;
const markers = [undefined, 'superscript', 'bracket', 'pill'] as const;
const placements = [
  undefined,
  'end',
  'side',
  'popover',
  'inline',
  { base: 'inline', md: 'end', xl: 'side' },
] as const;

describe('Footnote anatomy parity between @postkit/react and @postkit/chakra', () => {
  it('Footnote emits the same anatomy for every marker, placement, variant and size', () => {
    for (const marker of markers) {
      for (const placement of placements) {
        for (const variant of variants) {
          for (const size of sizes) {
            const [root] = expectSameAnatomy(
              footnoteDefinition,
              Headless.Footnote as ComponentType<never>,
              Footnote as ComponentType<never>,
              {
                index: 2,
                scope: 'post',
                marker,
                placement,
                variant,
                size,
                numbering: 'lower-roman',
                children: 'A note.',
              },
            );
            expect(root?.attributes).toMatchObject({
              'data-size': size ?? 'md',
              'data-variant': variant ?? 'subtle',
            });
            // The marker, then the sidenote copy when the note can show in place.
            expect(root?.children.length).toBe(
              placement === undefined || placement === 'end' ? 1 : 2,
            );
          }
        }
      }
    }
  }, 60_000);

  it('Footnotes emits the same anatomy for every variant, size, title and backlink shape', () => {
    for (const variant of variants) {
      for (const size of sizes) {
        for (const title of [undefined, 'References', false] as const) {
          for (const backlinks of [undefined, false] as const) {
            const [root] = expectSameAnatomy(
              footnotesDefinition,
              Headless.Footnotes as ComponentType<never>,
              Footnotes as ComponentType<never>,
              {
                variant,
                size,
                title,
                backlinks,
                numbering: 'symbol',
                children: [
                  createElement(
                    Headless.Footnote,
                    { key: 1, index: 1, references: 2 },
                    'Shared.',
                  ),
                  createElement(
                    Headless.Footnote,
                    { key: 2, index: 2 },
                    'Single.',
                  ),
                ],
              },
            );
            expect(
              root?.children.map(
                (child) => child.attributes['data-postkit-part'],
              ),
            ).toEqual(
              title === false ? ['rule', 'list'] : ['title', 'rule', 'list'],
            );
          }
        }
      }
    }
  }, 60_000);

  it('Sidenote (internal) emits the same anatomy', () => {
    for (const variant of variants) {
      for (const size of sizes) {
        const [root] = expectSameAnatomy(
          sidenoteDefinition,
          Headless.Sidenote as ComponentType<never>,
          Sidenote as ComponentType<never>,
          { index: 1, mark: '1', variant, size, children: 'A note.' },
        );
        expect(
          root?.children.map((child) => child.attributes['data-postkit-part']),
        ).toEqual(['number', 'content']);
      }
    }
  });
});

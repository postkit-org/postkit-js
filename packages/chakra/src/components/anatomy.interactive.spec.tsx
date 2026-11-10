import { defaultSystem, type SystemContext } from '@chakra-ui/react';
import {
  carouselDefinition,
  codeBlockDefinition,
  codeGroupDefinition,
  linkPreviewDefinition,
  newsletterSignupDefinition,
  pollDefinition,
  shareActionsDefinition,
  socialPostDefinition,
  tabsDefinition,
  type AnyPostkitComponentDefinition,
} from '@postkit/core/components';
import * as Headless from '@postkit/react';
import {
  createPostkitSocialPostSnapshot,
  type ResolvedLinkPreview,
} from '@postkit/unfurl';
import { createElement, type ComponentType, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { PostkitProvider } from '../lib/provider.js';
import { createPostkitSystem, postkitDefaultTheme } from '../lib/theme.js';
import { Carousel } from './carousel/carousel.js';
import { postkitCarouselRecipe } from './carousel/carousel.recipe.js';
import { CodeBlock } from './code-block/code-block.js';
import { postkitCodeBlockRecipe } from './code-block/code-block.recipe.js';
import { CodeGroup } from './code-group/code-group.js';
import { postkitCodeGroupRecipe } from './code-group/code-group.recipe.js';
import { LinkPreview } from './link-preview/link-preview.js';
import { postkitLinkPreviewRecipe } from './link-preview/link-preview.recipe.js';
import { NewsletterSignup } from './newsletter-signup/newsletter-signup.js';
import { postkitNewsletterSignupRecipe } from './newsletter-signup/newsletter-signup.recipe.js';
import { Poll } from './poll/poll.js';
import { postkitPollRecipe } from './poll/poll.recipe.js';
import { ShareActions } from './share-actions/share-actions.js';
import { postkitShareActionsRecipe } from './share-actions/share-actions.recipe.js';
import { SocialPost } from './social-post/social-post.js';
import { postkitSocialPostRecipe } from './social-post/social-post.recipe.js';
import { Tabs } from './tabs/tabs.js';
import { postkitTabsRecipe } from './tabs/tabs.recipe.js';

/*
 * Both renderers must emit the same anatomy (03 §5.1) for the interactive
 * components too (03 §8 step 6): the same parts, nested the same way, with the
 * same `data-postkit-*` and theme-variant state attributes. The helpers are
 * copied from `anatomy.publication.spec.tsx`.
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

const partTree = (nodes: readonly AnatomyNode[]): unknown[] =>
  nodes.map((node) =>
    node.children.length
      ? {
          [node.attributes['data-postkit-part'] ?? '']: partTree(node.children),
        }
      : node.attributes['data-postkit-part'],
  );

/** A nested CodeBlock's part tree, as CodeGroup panels render it. */
const codeBlockTree = (header: unknown[] = []) => ({
  root: [
    { header: [...header, { control: [{ copyTrigger: ['copyIndicator'] }] }] },
    { content: [{ code: ['codeText'] }] },
  ],
});

const href = 'https://example.com/a';
const article: ResolvedLinkPreview = {
  requestedUrl: href,
  url: href,
  title: 'T',
  description: 'D',
  siteName: 'S',
  favicon: 'https://example.com/f.ico',
  images: [{ src: 'https://cdn.example.com/a.png', alt: 'A' }],
  audio: [],
  video: [],
  provider: { id: 'fixture' },
};
const embed: ResolvedLinkPreview = {
  ...article,
  images: [],
  embed: { type: 'video', src: 'https://player.example.org/1' },
};
const social: ResolvedLinkPreview = {
  ...article,
  social: {
    service: 'bluesky',
    url: href,
    author: {
      name: 'Ada',
      handle: '@ada',
      avatar: 'https://cdn.example.com/ada.png',
    },
    text: 'Post',
    publishedAt: '2026-01-02T03:04:05Z',
    images: [{ src: 'https://cdn.example.com/p.png', alt: 'P' }],
    video: [],
    metrics: { likes: 3 },
    quotedPost: {
      service: 'x',
      url: 'https://x.com/q',
      text: 'Q',
      images: [],
      video: [],
    },
  },
};
const snapshot = createPostkitSocialPostSnapshot(social, {
  capturedAt: '2026-02-01T00:00:00Z',
  resolvedAt: '2026-01-31T00:00:00Z',
  cacheResult: 'hit',
});
const linkPreviewContent = {
  anchor: [
    {
      content: [
        { siteRow: ['favicon', 'siteName'] },
        'title',
        'description',
        'domain',
      ],
    },
  ],
};

const interactiveCases = [
  {
    name: 'Tabs',
    definition: tabsDefinition,
    headless: Headless.Tabs,
    chakra: Tabs,
    recipe: postkitTabsRecipe,
    minimal: { items: [{ label: 'A', content: 'a' }] },
    full: {
      label: 'Install',
      initialIndex: 1,
      items: [
        { id: 'npm', label: 'npm', content: 'npm i' },
        { id: 'pnpm', label: 'pnpm', content: 'pnpm add' },
      ],
    },
    tree: [
      { root: [{ list: ['tab', 'tab'] }, { panels: ['panel', 'panel'] }] },
    ],
  },
  {
    name: 'CodeGroup',
    definition: codeGroupDefinition,
    headless: Headless.CodeGroup,
    chakra: CodeGroup,
    recipe: postkitCodeGroupRecipe,
    minimal: { items: [{ label: 'A', code: 'a' }] },
    full: {
      label: 'Install',
      items: [
        { label: 'npm', code: 'npm i', language: 'sh' },
        { label: 'pnpm', code: 'pnpm add', filename: 'install.sh' },
      ],
    },
    tree: [
      {
        root: [
          { tabs: ['tab', 'tab'] },
          { panel: [codeBlockTree([{ title: ['language'] }])] },
          { panel: [codeBlockTree([{ title: ['filename'] }])] },
        ],
      },
    ],
  },
  {
    name: 'CodeBlock',
    definition: codeBlockDefinition,
    headless: Headless.CodeBlock,
    chakra: CodeBlock,
    recipe: postkitCodeBlockRecipe,
    minimal: { code: 'x' },
    full: {
      code: 'const a = 1;\nconst b = 2;',
      filename: 'a.ts',
      language: 'ts',
      highlightLines: '2',
      lineNumbers: true,
      wrap: true,
      maxHeight: '20rem',
    },
    tree: [codeBlockTree([{ title: ['filename', 'language'] }])],
  },
  {
    name: 'Carousel',
    definition: carouselDefinition,
    headless: Headless.Carousel,
    chakra: Carousel,
    recipe: postkitCarouselRecipe,
    minimal: { children: ['One', 'Two'] },
    full: {
      label: 'Photos',
      initialIndex: '1',
      items: [
        {
          title: 'A',
          description: 'D',
          href: '/a',
          image: { src: '/a.png', alt: 'A' },
        },
        { description: 'Only a description' },
      ],
    },
    tree: [
      {
        root: [
          {
            slide: [{ link: ['media', { content: ['title', 'description'] }] }],
          },
          { slide: [{ content: ['description'] }] },
          { controls: ['previousTrigger', 'status', 'nextTrigger'] },
        ],
      },
    ],
  },
  {
    name: 'LinkPreview',
    definition: linkPreviewDefinition,
    headless: Headless.LinkPreview,
    chakra: LinkPreview,
    recipe: postkitLinkPreviewRecipe,
    minimal: { href },
    full: { href, metadata: article },
    tree: [{ root: [{ media: ['image'] }, linkPreviewContent] }],
  },
  {
    name: 'SocialPost',
    definition: socialPostDefinition,
    headless: Headless.SocialPost,
    chakra: SocialPost,
    recipe: postkitSocialPostRecipe,
    minimal: { href },
    full: { href, metadata: snapshot, showMetrics: true },
    tree: [
      {
        root: [
          { serviceRow: [{ serviceBadge: ['serviceIcon'] }, 'timestamp'] },
          { authorRow: ['avatar', { author: ['authorName', 'handle'] }] },
          'content',
          { media: ['image'] },
          { quote: ['quoteAuthor', 'quoteContent'] },
          { metrics: ['metric'] },
          { footer: ['originalLink'] },
          {
            snapshotInfo: [
              { snapshotLabel: ['snapshotTime'] },
              { snapshotLabel: ['snapshotTime'] },
            ],
          },
        ],
      },
    ],
  },
  {
    name: 'Poll',
    definition: pollDefinition,
    headless: Headless.Poll,
    chakra: Poll,
    recipe: postkitPollRecipe,
    minimal: { question: 'Q', options: [{ id: 'a', label: 'A' }] },
    full: {
      question: 'Q',
      description: 'D',
      options: [
        { id: 'a', label: 'A', votes: 1 },
        { id: 'b', label: 'B', votes: 3 },
      ],
      selectedId: 'b',
    },
    tree: [
      {
        root: [
          'question',
          'description',
          {
            options: [
              { option: [{ optionLabel: ['result'] }, 'bar'] },
              { option: [{ optionLabel: ['result'] }, 'bar'] },
            ],
          },
          'status',
        ],
      },
    ],
  },
  {
    name: 'NewsletterSignup',
    definition: newsletterSignupDefinition,
    headless: Headless.NewsletterSignup,
    chakra: NewsletterSignup,
    recipe: postkitNewsletterSignupRecipe,
    minimal: { title: 'T' },
    full: { title: 'T', description: 'D', list: 'l', privacy: 'P' },
    tree: [
      {
        root: [
          { content: ['title', 'description'] },
          {
            form: [
              'label',
              { fields: ['input', 'submit'] },
              'status',
              'privacy',
            ],
          },
        ],
      },
    ],
  },
  {
    name: 'ShareActions',
    definition: shareActionsDefinition,
    headless: Headless.ShareActions,
    chakra: ShareActions,
    recipe: postkitShareActionsRecipe,
    minimal: { url: 'https://example.com/a' },
    full: {
      url: 'https://example.com/a',
      title: 'T',
      text: 'X',
      services: ['native', 'copy', 'x'],
      layout: 'inline',
    },
    tree: [
      {
        root: [
          'label',
          {
            actions: [
              { action: ['icon'] },
              { action: ['icon'] },
              { action: ['icon'] },
            ],
          },
          'status',
        ],
      },
    ],
  },
] as const;

describe('Postkit anatomy parity for the interactive components', () => {
  it.each(interactiveCases)(
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

  it.each(interactiveCases)(
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

  it.each(interactiveCases)(
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

  it.each(interactiveCases)(
    "$name's recipe defaults match its definition's defaults (D12)",
    ({ definition, recipe }) => {
      const definitionDefaults = Object.fromEntries(
        definition.themeVariants.map((name) => [
          name,
          (definition.props as AnyPostkitComponentDefinition['props'])[name]
            ?.default,
        ]),
      );
      const recipeDefaults = recipe.defaultVariants as Record<string, unknown>;
      expect(
        Object.fromEntries(
          definition.themeVariants.map((name) => [name, recipeDefaults[name]]),
        ),
      ).toEqual(definitionDefaults);
    },
  );

  it.each([
    {
      name: 'LinkPreview',
      definition: linkPreviewDefinition,
      headless: Headless.LinkPreview,
      chakra: LinkPreview,
      before: [
        {
          root: [
            { embedFrame: [{ consent: ['consentButton'] }] },
            linkPreviewContent,
          ],
        },
      ],
      after: [{ root: [{ embedFrame: ['embed'] }, linkPreviewContent] }],
    },
    {
      name: 'SocialPost',
      definition: socialPostDefinition,
      headless: Headless.SocialPost,
      chakra: SocialPost,
      before: [{ root: [{ embedFrame: [{ consent: ['consentButton'] }] }] }],
      after: [{ root: [{ embedFrame: ['embed'] }] }],
    },
  ])(
    'emits the $name embed behind consent, and the frame only once immediate',
    ({ definition, headless, chakra, before, after }) => {
      const props = { href, metadata: embed, presentation: 'embed' };
      const [root] = expectSameAnatomy(
        definition,
        headless as ComponentType<never>,
        chakra as ComponentType<never>,
        props,
      );
      expect(partTree(root ? [root] : [])).toEqual(before);
      const { headless: html } = renderBoth(
        headless as ComponentType<never>,
        chakra as ComponentType<never>,
        props,
      );
      expect(html).not.toContain('<iframe');
      expect(html).not.toContain('player.example.org');
      expect(
        partTree(
          expectSameAnatomy(
            definition,
            headless as ComponentType<never>,
            chakra as ComponentType<never>,
            { ...props, activation: 'immediate' },
          ),
        ),
      ).toEqual(after);
    },
  );

  it('emits the inline and carousel LinkPreview shapes', () => {
    expect(
      partTree(
        expectSameAnatomy(
          linkPreviewDefinition,
          Headless.LinkPreview as ComponentType<never>,
          LinkPreview as ComponentType<never>,
          { href, presentation: 'inline' },
        ),
      ),
    ).toEqual([{ root: ['anchor'] }]);
    const [root] = expectSameAnatomy(
      linkPreviewDefinition,
      Headless.LinkPreview as ComponentType<never>,
      LinkPreview as ComponentType<never>,
      {
        href,
        images: 'carousel',
        metadata: {
          ...article,
          images: [...article.images, { src: 'https://cdn.example.com/b.png' }],
        },
      },
    );
    expect(root?.attributes['data-postkit-presentation']).toBe('card');
    expect(root?.children[0]?.attributes['data-postkit-part']).toBe('carousel');
  });

  it('emits the empty Carousel state and a CodeBlock without a header', () => {
    expect(
      partTree(
        expectSameAnatomy(
          carouselDefinition,
          Headless.Carousel as ComponentType<never>,
          Carousel as ComponentType<never>,
          {},
        ),
      ),
    ).toEqual([{ root: ['emptyState'] }]);
    expect(
      partTree(
        expectSameAnatomy(
          codeBlockDefinition,
          Headless.CodeBlock as ComponentType<never>,
          CodeBlock as ComponentType<never>,
          { code: 'x', copy: false },
        ),
      ),
    ).toEqual([{ root: [{ content: [{ code: ['codeText'] }] }] }]);
  });
});

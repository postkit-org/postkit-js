// The demo content Home renders. Every renderer on the page takes its copy from here, so the
// article the panel switches between is the same article, word for word.

/** The short article the renderer panel shows in each renderer. */
export const rendererArticle = {
  lead: 'A callout is a small thing, but the moment an article leaves its page it has to survive a feed reader, a newsletter and an editor’s preview pane.',
  callout: {
    tone: 'tip',
    title: 'Keep the content',
    body: 'Change the renderer without changing the article.',
  },
} as const;

/** "Writers keep their tools": the same callout, authored two ways. */
export const authoringSources = {
  mdx: `<Callout tone="tip"
  title="Keep the content">
  Change the renderer without
  changing the article.
</Callout>`,
  // Directive attributes stay on one line: remark-directive doesn't continue `{…}` across
  // lines (the board wraps it), and a broken directive would render as plain text.
  markdown: `:::postkit-callout{tone="tip" title="Keep the content"}
Change the renderer without
changing the article.
:::`,
} as const;

/** The command the install CTA copies (the board's). */
export const installCommand = 'npm install @postkit/react';

export type RendererId = 'headless' | 'chakra' | 'email' | 'editor';

export interface RendererTab {
  readonly value: RendererId;
  readonly label: string;
  /** The package (or app) that draws it. */
  readonly pkg: string;
  readonly description: string;
}

export const rendererTabs: readonly RendererTab[] = [
  {
    value: 'headless',
    label: 'Headless',
    pkg: '@postkit/react',
    description:
      'Semantic markup and the named parts, with a quiet stylesheet you can keep or replace with your own CSS.',
  },
  {
    value: 'chakra',
    label: 'Chakra',
    pkg: '@postkit/chakra',
    description:
      'The same parts as slot recipes on your Chakra system, so your tokens and theme flow straight through.',
  },
  {
    value: 'email',
    label: 'Email',
    pkg: '@postkit/email',
    description:
      'Inbox-safe tables and inline styles, with a declared fallback for anything an inbox can’t run.',
  },
  {
    value: 'editor',
    label: 'Editor',
    pkg: 'Prismark',
    description:
      'Rendered inline while you write, selectable, with its properties in a panel. The file stays plain MDX.',
  },
];

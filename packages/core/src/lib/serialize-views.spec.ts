import type { Nodes as HastNodes } from 'hast';
import { fromHtml } from 'hast-util-from-html';

import { postkitBuiltInDefinitions } from '../components/built-ins.js';
import {
  createPostkitDocument,
  parsePostkitHtml,
  parsePostkitMarkdown,
  serializePostkit,
  serializePostkitHtml,
  serializePostkitMarkdown,
  serializePostkitText,
  type PostkitComponentNode,
  type PostkitDocument,
  type PostkitJsonValue,
  type PostkitNode,
} from '../index.js';

const paragraph = (value: string): PostkitNode => ({
  type: 'element',
  name: 'p',
  children: [{ type: 'text', value }],
});

const component = (
  name: string,
  props: Record<string, PostkitJsonValue>,
  children: PostkitNode[] = [],
): PostkitComponentNode => ({ type: 'component', name, props, children });

/** One instance of every built-in, with the props that carry its text. */
const fixtures: Record<string, PostkitComponentNode> = {
  AppearsOn: component('AppearsOn', {
    items: [
      {
        service: 'bluesky',
        url: 'https://bsky.app/profile/postkit.org/post/1',
        label: 'Bluesky',
        publishedAt: '2026-11-01',
      },
      { name: 'Example publication', href: 'https://example.com' },
      { service: 'mastodon', url: '/m/1', status: 'pending' },
    ],
    showDates: true,
  }),
  Aside: component('Aside', { title: 'Background' }, [
    paragraph('Postkit grew out of Prismark.'),
  ]),
  AudienceBoundary: component(
    'AudienceBoundary',
    { audience: 'members', showLabel: true },
    [paragraph('Members-only notes.')],
  ),
  Audio: component('Audio', {
    src: '/media/episode.mp3',
    title: 'Episode 1',
    caption: 'Recorded live.',
  }),
  AuthorCard: component(
    'AuthorCard',
    {
      name: 'Ada Example',
      role: 'Editor',
      href: '/authors/ada',
      avatarSrc: '/ada.png',
      avatarAlt: 'Ada',
      links: '[{"label": "Website", "href": "https://ada.example"}]',
    },
    [paragraph('Ada writes about portable content.')],
  ),
  CallToAction: component('CallToAction', {
    eyebrow: 'New',
    title: 'Try Postkit',
    description: 'Install it in a minute.',
    primaryLabel: 'Get started',
    primaryHref: '/docs/installation',
    secondaryLabel: 'Read the guide',
    secondaryHref: '/docs/introduction',
  }),
  Callout: component('Callout', { title: 'Keep the content', tone: 'tip' }, [
    paragraph('Change the renderer without changing the article.'),
  ]),
  CardGrid: component('CardGrid', {
    title: 'Guides',
    description: 'Where to go next.',
    columns: '2',
    items: [
      {
        title: 'Install',
        description: 'Add the packages.',
        href: '/docs/installation',
        meta: '2 min',
        image: { src: '/install.png', alt: 'A terminal' },
      },
      { title: 'Theme', linkLabel: 'Theme it', href: '/docs/theming' },
    ],
  }),
  Carousel: component(
    'Carousel',
    {
      label: 'Screenshots',
      items: [
        {
          image: { src: '/one.png', alt: 'The editor' },
          title: 'Editor',
          description: 'Write once.',
          href: '/editor',
        },
        { image: { src: '/two.png', alt: 'The feed' } },
      ],
    },
    [paragraph('A slide from children.')],
  ),
  Chart: component('Chart', {
    title: 'Downloads',
    description: 'Weekly npm downloads.',
    data: [
      { label: 'Week 1', core: 120, react: 80 },
      { label: 'Week 2', core: 150, react: 95 },
    ],
    series: [
      { key: 'core', label: '@postkit/core' },
      { key: 'react', label: '@postkit/react' },
    ],
  }),
  CodeBlock: component('CodeBlock', {
    code: '<Callout tone="tip">\n  Keep it.\n</Callout>',
    language: 'mdx',
    filename: 'post.mdx',
  }),
  CodeGroup: component('CodeGroup', {
    items: [
      { label: 'npm', code: 'npm install @postkit/core', language: 'sh' },
      {
        label: 'pnpm',
        filename: 'shell',
        code: 'pnpm add @postkit/core',
        language: 'sh',
      },
    ],
  }),
  Comparison: component('Comparison', {
    title: 'Plans',
    description: 'What each plan includes.',
    columns: ['Starter', 'Pro'],
    items: [
      { label: 'Portable content', values: [true, true] },
      { label: 'Seats', values: [1, 'Unlimited'] },
      { label: 'Support', values: [false] },
    ],
  }),
  Diff: component('Diff', {
    title: 'package.json',
    diff: '- "@postkit/react": "0.2.0"\n+ "@postkit/react": "0.3.0"\n  "react": "19"',
  }),
  Disclosure: component('Disclosure', { summary: 'Why?', open: true }, [
    paragraph('Because content outlives renderers.'),
  ]),
  Figure: component('Figure', {
    src: '/media/lead.jpg',
    alt: 'A desk with a notebook',
    caption: 'The lead image.',
    credit: 'Photo: Ada',
    creditHref: 'https://ada.example',
    width: 1200,
    height: 800,
    srcSet: '/media/lead.jpg 1x, /media/lead@2x.jpg 2x',
  }),
  FileCard: component('FileCard', {
    href: '/files/guide.pdf',
    name: 'guide.pdf',
    description: 'The printable guide.',
    fileType: 'PDF',
    fileSize: '2 MB',
  }),
  FileTree: component('FileTree', {
    title: 'Project',
    items: [
      { path: 'src', type: 'folder' },
      { path: 'src/index.ts', meta: 'entry' },
    ],
  }),
  Gallery: component('Gallery', {
    title: 'Gallery',
    items: [
      { src: '/a.jpg', alt: 'A', caption: 'First', href: '/a' },
      { src: '/b.jpg', alt: 'B' },
    ],
  }),
  KeyTakeaway: component('KeyTakeaway', {
    title: 'In short',
    eyebrow: 'Summary',
    items: '["Components are defined once.", "Views are headless."]',
  }),
  LinkPreview: component('LinkPreview', {
    href: 'https://github.com/postkit-org/postkit-js',
    presentation: 'card',
    siteName: 'GitHub',
    title: 'postkit-org/postkit-js',
    description: 'Portable web and email components.',
  }),
  NewsletterSignup: component(
    'NewsletterSignup',
    { title: 'Get the newsletter', description: 'Monthly, no spam.' },
    [paragraph('Release notes in your inbox.')],
  ),
  Poll: component('Poll', {
    question: 'Which renderer?',
    description: 'Pick one.',
    options: [
      { id: 'react', label: 'React', votes: 3 },
      { id: 'astro', label: 'Astro', votes: 1 },
    ],
    totalVotes: 4,
  }),
  ProductCard: component('ProductCard', {
    title: 'Notebook',
    href: 'https://shop.example/notebook',
    description: 'A paper notebook.',
    imageSrc: '/notebook.jpg',
    imageAlt: 'A notebook',
    price: '$12',
    rating: 4,
    badge: 'Pick',
  }),
  PullQuote: component('PullQuote', {
    quote: 'The file stays plain text.',
    attribution: 'Postkit design principles',
    cite: 'The handbook',
  }),
  RelatedContent: component('RelatedContent', {
    items: [
      {
        title: 'Introduction',
        href: '/docs/introduction',
        description: 'Start here.',
        meta: 'Docs',
      },
    ],
  }),
  SeriesNavigation: component('SeriesNavigation', {
    title: 'Portable content',
    current: 2,
    total: 3,
    previous: '{"title": "Part one", "href": "/notes/one"}',
    next: { title: 'Part three', href: '/notes/three' },
  }),
  ShareActions: component('ShareActions', {
    url: 'https://postkit.org/notes/one',
    title: 'One article, four renderers',
    services: ['bluesky', 'email'],
  }),
  SocialPost: component('SocialPost', {
    href: 'https://bsky.app/profile/postkit.org/post/3',
    service: 'Bluesky',
    metadata: {
      url: 'https://bsky.app/profile/postkit.org/post/3',
      images: [],
      social: {
        service: 'bluesky',
        url: 'https://bsky.app/profile/postkit.org/post/3',
        author: { name: 'Postkit', handle: 'postkit.org' },
        text: 'Postkit 0.3.0 is out.\n\nHeadless views.',
        publishedAt: '2026-11-01T10:00:00Z',
        images: [],
        video: [],
      },
      embed: { html: '<iframe src="https://evil.example"></iframe>' },
      rawHtml: '<script>alert(1)</script>',
    },
  }),
  SponsorBlock: component('SponsorBlock', {
    name: 'Acme',
    message: 'Acme makes tools.',
    href: 'https://acme.example',
    logoSrc: '/acme.svg',
  }),
  Stat: component('Stat', {
    value: '42%',
    label: 'Faster builds',
    trend: '+8%',
    description: 'Since 0.2.0.',
  }),
  Steps: component('Steps', {
    items:
      '[{"title": "Theme the parts.", "description": "Style root, icon and title."}, {"title": "Eject the view."}]',
  }),
  Tabs: component('Tabs', {
    items: [
      { label: 'React', content: 'Use the headless views.' },
      { label: 'Chakra', content: 'Use the recipes.\n\nOr the theme.' },
    ],
  }),
  Terminal: component('Terminal', {
    command: 'npm install @postkit/react',
    output: 'added 1 package in 2s',
  }),
  Video: component('Video', {
    src: '/media/demo.mp4',
    title: 'Demo',
    poster: '/media/demo.jpg',
    caption: 'A two-minute demo.',
    captions: '/media/demo.vtt',
    captionsLang: 'en',
    duration: '2:04',
  }),
  Device: component('Device', {
    kind: 'iphone',
    src: '/media/home.png',
    alt: 'The home screen',
    caption: 'The companion app.',
  }),
};

const documentOf = (...nodes: PostkitNode[]): PostkitDocument =>
  createPostkitDocument(nodes);

const parts = (html: string) =>
  [...html.matchAll(/data-postkit-part="([^"]+)"/g)].map((match) => match[1]);

const voidElements = new Set(['br', 'hr', 'img', 'input', 'source', 'track']);

/** Every opened element is closed, in order: the markup is well-formed. */
function expectBalanced(html: string): void {
  const stack: string[] = [];
  for (const [, closing, name] of html.matchAll(
    /<(\/?)([a-z][a-z0-9-]*)[^>]*>/g,
  )) {
    if (!name || voidElements.has(name)) continue;
    if (closing) expect(stack.pop()).toBe(name);
    else stack.push(name);
  }
  expect(stack).toEqual([]);
}

/** Parsed as a browser would: no executable elements or handlers anywhere. */
function expectInert(html: string): void {
  const visit = (node: HastNodes) => {
    if (node.type === 'element') {
      expect(node.tagName).not.toMatch(
        /^(?:script|style|iframe|embed|object|form|input)$/,
      );
      for (const [key, value] of Object.entries(node.properties)) {
        expect(key).not.toMatch(/^on/i);
        if (['href', 'src', 'poster', 'srcSet'].includes(key)) {
          expect(String(value)).not.toMatch(
            /^\s*(?:javascript|vbscript|data):/i,
          );
        }
      }
    }
    if ('children' in node) node.children.forEach(visit);
  };
  visit(fromHtml(html, { fragment: true }));
}

describe('static component views', () => {
  it('cover every built-in definition', () => {
    expect(Object.keys(fixtures).sort()).toEqual(
      Object.keys(postkitBuiltInDefinitions).sort(),
    );
  });

  describe.each(Object.entries(fixtures))('%s', (name, node) => {
    const definition =
      postkitBuiltInDefinitions[name as keyof typeof postkitBuiltInDefinitions];
    const options = { newsletterUrl: 'https://postkit.org/subscribe' };

    it('serializes to readable HTML', () => {
      const html = serializePostkitHtml(documentOf(node), {
        ...options,
        annotations: false,
      });
      expect(html).toMatchSnapshot();
      expect(html).toMatch(
        new RegExp(`^<[a-z]+ data-postkit-component="${name}"`),
      );
      expectBalanced(html);
    });

    it('serializes to plain text', () => {
      const text = serializePostkitText(documentOf(node), options);
      expect(text).toMatchSnapshot();
      expect(text.trim()).not.toBe('');
    });

    it('emits only its definition’s anatomy parts', () => {
      const html = serializePostkitHtml(documentOf(node), options);
      expect(parts(html)[0]).toBe('root');
      for (const part of parts(html)) {
        expect(definition.slots).toContain(part);
      }
    });

    it('round-trips through annotated HTML and Markdown', () => {
      const document = documentOf(paragraph('Before.'), node);
      const html = serializePostkitHtml(document, options);
      expect(parsePostkitHtml(html)).toEqual(document);
      // Well-formed: parsing and serializing again is a fixed point.
      expect(serializePostkitHtml(parsePostkitHtml(html), options)).toBe(html);
      expectBalanced(html);
      const markdown = serializePostkitMarkdown(document);
      expect(parsePostkitMarkdown(markdown)).toEqual(document);
    });

    it('has no runtime: no script, form, embed or iframe', () => {
      expectInert(serializePostkitHtml(documentOf(node), options));
    });
  });
});

describe('prop-carried text', () => {
  it('appears as text in HTML and plain text, not only in annotations', () => {
    const document = documentOf(fixtures['Callout'] as PostkitNode);
    const html = serializePostkitHtml(document);
    expect(html).toContain(
      '<p data-postkit-part="title"><strong>Keep the content</strong></p>',
    );
    expect(serializePostkitText(document)).toBe(
      'Keep the content\n\nChange the renderer without changing the article.\n',
    );
    expect(serializePostkit(document, { format: 'text' })).toBe(
      serializePostkitText(document),
    );
  });

  it('keeps authored children of components that take none', () => {
    const node = component('Stat', { value: '1', label: 'One' }, [
      paragraph('Extra.'),
    ]);
    const html = serializePostkitHtml(documentOf(node));
    expect(html).toContain('<p data-postkit-node="p"');
    expect(parsePostkitHtml(html).children).toEqual([node]);
  });

  it('writes Markdown blocks that survive line breaks in props', () => {
    const document = documentOf(
      component('Terminal', { command: 'ls', output: 'a\n\nb' }),
      paragraph('After.'),
    );
    const markdown = serializePostkitMarkdown(document);
    expect(markdown).toContain('a&#10;&#10;b');
    expect(parsePostkitMarkdown(markdown)).toEqual(document);
  });

  it('carries custom components as before', () => {
    const node = component('Badge', { tone: 'new' }, [
      { type: 'text', value: 'New' },
    ]);
    expect(serializePostkitHtml(documentOf(node))).toBe(
      '<div data-postkit-component="Badge" data-postkit-version="1" data-postkit-props="{&quot;tone&quot;:&quot;new&quot;}">New</div>',
    );
    expect(serializePostkitText(documentOf(node))).toBe('New\n');
  });

  it('serializes a whole document as plain text', () => {
    const document = parsePostkitMarkdown(`# Title

Intro with a [link](/docs) and **bold** text.

- [x] Done
- Two
  1. Nested

> Quoted

| A | B |
| --- | --- |
| 1 | 2 |

\`\`\`ts
const a = 1;
  indented();
\`\`\`
`);
    expect(
      serializePostkitText(document, { baseUrl: 'https://postkit.org' }),
    ).toBe(
      [
        'Title',
        'Intro with a link (https://postkit.org/docs) and bold text.',
        '- [x] Done\n- Two\n  1. Nested',
        '> Quoted',
        'A | B\n1 | 2',
        'const a = 1;\n  indented();',
      ].join('\n\n') + '\n',
    );
    expect(serializePostkitText(createPostkitDocument())).toBe('');
  });
});

describe('static view options', () => {
  it('resolves relative URLs against baseUrl in props and elements', () => {
    const document = documentOf(
      fixtures['CallToAction'] as PostkitNode,
      {
        type: 'element',
        name: 'a',
        attributes: { href: '/docs' },
        children: [{ type: 'text', value: 'Docs' }],
      },
      {
        type: 'element',
        name: 'a',
        attributes: { href: '#top' },
        children: [{ type: 'text', value: 'Top' }],
      },
    );
    const html = serializePostkitHtml(document, {
      baseUrl: 'https://postkit.org',
      annotations: false,
    });
    expect(html).toContain('href="https://postkit.org/docs/installation"');
    expect(html).toContain('href="https://postkit.org/docs"');
    expect(html).toContain('href="#top"');
    expect(
      serializePostkitText(document, { baseUrl: 'https://postkit.org' }),
    ).toContain('Get started (https://postkit.org/docs/installation)');
  });

  it('shows an AudienceBoundary’s content only to its audiences', () => {
    const document = documentOf(fixtures['AudienceBoundary'] as PostkitNode);
    const gated = serializePostkitHtml(document, { audiences: ['public'] });
    expect(gated).toContain(
      'This section is available to a different audience.',
    );
    expect(gated).not.toContain('Members-only');
    expect(serializePostkitText(document, { audiences: [] })).not.toContain(
      'Members-only',
    );
    expect(
      serializePostkitHtml(document, { audiences: ['members'] }),
    ).toContain('Members-only notes.');
    expect(serializePostkitText(document)).toContain('Members-only notes.');
  });

  it('omits a NewsletterSignup without a subscribe URL', () => {
    const document = documentOf(fixtures['NewsletterSignup'] as PostkitNode);
    expect(serializePostkitHtml(document, { annotations: false })).toBe('');
    expect(serializePostkitText(document)).toBe('');
    const carrier = serializePostkitHtml(document);
    expect(carrier).toMatch(/^<div [^>]*data-postkit-view="omitted" hidden>/);
    expect(parsePostkitHtml(carrier)).toEqual(document);
  });
});

describe('static view safety', () => {
  const script = '<script>alert(1)</script>';
  const breakout = '" onmouseover="alert(1)';

  it.each([
    ['Callout', { title: script }],
    ['KeyTakeaway', { title: script, items: [script] }],
    ['PullQuote', { quote: script, attribution: breakout, cite: script }],
    ['AuthorCard', { name: breakout, role: script }],
    ['SponsorBlock', { name: breakout, disclosure: script }],
    ['Terminal', { command: script, output: script, title: script }],
    ['CodeBlock', { code: script, filename: script, language: breakout }],
    ['Steps', { items: [{ title: script, description: breakout }] }],
  ])('escapes text in %s', (name, props) => {
    const document = documentOf(component(name, props));
    for (const annotations of [false, true]) {
      const html = serializePostkitHtml(document, { annotations });
      expect(html).not.toContain('<script');
      expectInert(html);
      expectBalanced(html);
    }
    expect(serializePostkitHtml(document)).toContain('&lt;script&gt;');
  });

  const unsafeUrls = [
    'javascript:alert(1)',
    'JaVaScRiPt:alert(1)',
    ' java\tscript:alert(1)',
    'vbscript:msgbox(1)',
    'data:text/html,<script>alert(1)</script>',
    'tel:123',
  ];

  it.each(unsafeUrls)('drops unsafe URLs in props: %s', (url) => {
    const document = documentOf(
      component('LinkPreview', { href: url, title: 'Preview' }),
      component('CallToAction', {
        title: 'Act',
        primaryLabel: 'Go',
        primaryHref: url,
      }),
      component('Figure', {
        src: url,
        alt: 'Alt',
        caption: 'Caption',
        credit: 'Credit',
        creditHref: url,
        srcSet: `${url} 1x`,
      }),
      component('Video', { src: url, title: 'Video', poster: url }),
      component('AuthorCard', {
        name: 'Ada',
        href: url,
        avatarSrc: url,
        links: [{ label: 'Site', href: url }],
      }),
      component('Gallery', { items: [{ src: url, alt: 'A', href: url }] }),
      component('SeriesNavigation', {
        title: 'Series',
        next: { title: 'Next', href: url },
      }),
    );
    const html = serializePostkitHtml(document, { annotations: false });
    expect(html).not.toMatch(/(?:href|src|srcset|poster)=/);
    expect(html).toContain('Preview');
    expect(html).toContain('Go');
    const annotated = serializePostkitHtml(document);
    expect(annotated).not.toMatch(
      /(?:href|src|srcset|poster)="\s*(?:java|vbscript|data|tel)/i,
    );
    const text = serializePostkitText(document);
    expect(text).not.toMatch(/javascript|vbscript|data:|tel:/i);
  });

  it('allows http, https, mailto and relative URLs', () => {
    for (const href of [
      'https://example.com/a',
      'http://example.com/a',
      'mailto:hello@postkit.org',
      '/docs',
      '../up',
      '?q=1',
    ]) {
      expect(
        serializePostkitHtml(
          documentOf(component('LinkPreview', { href, title: 'T' })),
          { annotations: false },
        ),
      ).toContain(`href="${href}"`);
    }
  });

  it('never embeds provider HTML from LinkPreview or SocialPost metadata', () => {
    const metadata = {
      url: 'https://example.com/post',
      title: 'Post',
      images: [],
      embed: { html: '<iframe src="https://example.com/embed"></iframe>' },
      rawHtml: '<script>alert(1)</script>',
    };
    const document = documentOf(
      component('LinkPreview', {
        href: 'https://example.com/post',
        presentation: 'embed',
        activation: 'immediate',
        metadata,
      }),
      component('SocialPost', {
        href: 'https://example.com/post',
        presentation: 'embed',
        activation: 'immediate',
        metadata,
      }),
    );
    for (const annotations of [false, true]) {
      const html = serializePostkitHtml(document, { annotations });
      expect(html).not.toMatch(/<(?:iframe|script)/);
    }
    expect(serializePostkitText(document)).not.toMatch(/iframe|script/);
  });

  it('ignores malformed JSON props instead of throwing', () => {
    const document = documentOf(
      component('Steps', { items: '[{"title": ' }),
      component('KeyTakeaway', { title: 'Short', items: 'not json' }),
      component('Chart', { title: 'Empty', data: '{}' }),
    );
    expect(() => serializePostkitHtml(document)).not.toThrow();
    expect(serializePostkitText(document)).toContain('No data.');
  });

  it('cannot forge a static view to hide authored HTML from the parser', () => {
    // Content outside the slot of a forged view is dropped, never executed.
    const document = parsePostkitHtml(
      '<div data-postkit-component="Callout" data-postkit-view="static"><p onclick="x()">Generated</p><div data-postkit-slot="children"><a href="javascript:x()">Kept</a></div></div>',
    );
    expect(document.children).toEqual([
      {
        type: 'component',
        name: 'Callout',
        children: [
          {
            type: 'element',
            name: 'a',
            children: [{ type: 'text', value: 'Kept' }],
          },
        ],
      },
    ]);
  });
});

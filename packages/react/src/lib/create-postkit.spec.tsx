// @vitest-environment node

import {
  calloutDefinition,
  definePostkitComponent,
  presentation,
  prop,
} from '@postkit/core/components';
import type { Root as MdastRoot } from 'mdast';
import type { ComponentProps, ComponentType } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import remarkMdx from 'remark-mdx';
import remarkParse from 'remark-parse';
import { unified } from 'unified';

import { Callout } from '../components/callout/callout.js';
import {
  article,
  discovery,
  engagement,
  media,
  postkitKits,
  technical,
} from '../kits/index.js';
import { createPostkit, postkitHeadlessRenderer } from './create-postkit.js';
import { postkitView } from './view.js';

const showcaseDefinition = definePostkitComponent({
  name: 'Showcase',
  directive: 'postkit-showcase',
  category: 'media',
  description: 'A screenshot framed in a device.',
  stability: 'experimental',
  props: {
    ...presentation,
    frame: prop.enum(['phone', 'laptop'], {
      description: 'The device frame.',
      default: 'phone',
      themeVariant: true,
    }),
    src: prop.string('The screenshot URL.', { required: true }),
    caption: prop.string('A caption.'),
  },
  slots: ['root', 'screen', 'caption'],
});

const Showcase = postkitView(showcaseDefinition, ({ props, part }) => (
  <figure {...part('root')}>
    <img {...part('screen')} src={props.src} alt="" />
    {props.caption ? (
      <figcaption {...part('caption')}>{props.caption}</figcaption>
    ) : null}
  </figure>
));

function compile(
  remarkPlugins: ReturnType<typeof createPostkit>['remarkPlugins'],
  source: string,
): MdastRoot {
  const processor = unified()
    .use(remarkParse)
    .use(remarkMdx)
    .use(remarkPlugins);
  return processor.runSync(processor.parse(source)) as MdastRoot;
}

function render(
  postkit: ReturnType<typeof createPostkit>,
  name: string,
  props: Record<string, unknown> = {},
): string {
  const View = postkit.mdxComponents[name] as ComponentType<
    Record<string, unknown>
  >;
  return renderToStaticMarkup(
    <postkit.Provider>
      <View {...props} />
    </postkit.Provider>,
  );
}

describe('kits', () => {
  it('ship each category as a renderer-neutral list of definitions', () => {
    expect(postkitKits.map((kit) => kit.id)).toEqual([
      'article',
      'technical',
      'media',
      'discovery',
      'engagement',
      'publishing',
    ]);
    expect(article.definitions).toContain(calloutDefinition);
    expect(article.definitions.map(({ name }) => name)).toEqual(
      expect.arrayContaining(['Footnote', 'Footnotes']),
    );
    expect(
      postkitKits.flatMap((kit) => kit.definitions).map(({ name }) => name),
    ).toHaveLength(38);
    for (const kit of postkitKits) {
      expect(kit.package).toBe('@postkit/core');
      expect(Object.isFrozen(kit.definitions)).toBe(true);
    }
  });
});

describe('createPostkit', () => {
  it('enables exactly the kits and components given, minus exclude', () => {
    const postkit = createPostkit({
      kits: [article, technical, media],
      exclude: ['Gallery'],
      components: [{ definition: showcaseDefinition, view: Showcase }],
    });
    const names = postkit.definitions.map(({ name }) => name);

    expect(names).toContain('Callout');
    expect(names).toContain('Figure');
    expect(names).toContain('Showcase');
    expect(names).not.toContain('Gallery');
    expect(names).not.toContain('RelatedContent');
    expect(postkit.mdxComponents['Showcase']).toBe(Showcase);
    expect(postkit.mdxComponents['RelatedContent']).toBeUndefined();
    expect(postkit.mdxComponents['a']).toBeDefined();
    expect(postkit.renderer).toBe(postkitHeadlessRenderer);
  });

  it('applies site defaults to headless views, and an author prop wins', () => {
    const postkit = createPostkit({
      kits: [article],
      defaults: { Callout: { variant: 'plain', title: 'Note' } },
    });

    const defaulted = render(postkit, 'Callout', { children: 'Body' });
    expect(defaulted).toContain('data-variant="plain"');
    expect(defaulted).toContain('>Note</p>');

    const authored = render(postkit, 'Callout', {
      variant: 'outline',
      title: 'Mine',
    });
    expect(authored).toContain('data-variant="outline"');
    expect(authored).toContain('>Mine</p>');

    // Outside the provider, views keep the definition's defaults.
    expect(renderToStaticMarkup(<Callout>Body</Callout>)).toContain(
      'data-variant="subtle"',
    );
  });

  it('replaces anatomy parts with slot overrides', () => {
    function InkMark(props: ComponentProps<'span'>) {
      return <b data-ink {...props} />;
    }
    const postkit = createPostkit({
      kits: [article],
      overrides: {
        Callout: {
          slots: { icon: InkMark },
          classNames: { icon: 'site-mark', title: 'site-title' },
        },
      },
    });
    const markup = render(postkit, 'Callout', {
      tone: 'tip',
      title: 'Tip',
      classNames: { icon: 'mark' },
    });

    expect(markup).toContain(
      '<b data-ink="true" data-postkit-part="icon" class="site-mark mark" aria-hidden="true">✓</b>',
    );
    expect(markup).toContain('class="site-title"');
    expect(markup).toContain('data-postkit-component="Callout"');
  });

  it('replaces a whole view with a view override', () => {
    const CommuneCallout = postkitView(calloutDefinition, ({ part }) => (
      <div {...part('root')}>commune</div>
    ));
    const postkit = createPostkit({
      kits: [article],
      overrides: { Callout: { view: CommuneCallout } },
    });

    expect(postkit.mdxComponents['Callout']).toBe(CommuneCallout);
    expect(render(postkit, 'Callout')).toContain('commune');
  });

  it('validates directives against the enabled set', () => {
    const postkit = createPostkit({
      kits: [article],
      components: [{ definition: showcaseDefinition, view: Showcase }],
    });

    const tree = compile(
      postkit.remarkPlugins,
      '::postkit-showcase{src="/phone.png" frame="laptop"}',
    );
    expect(tree.children[0]).toMatchObject({
      type: 'mdxJsxFlowElement',
      name: 'Showcase',
    });

    expect(() =>
      compile(postkit.remarkPlugins, '::postkit-figure{src="/a.png" alt=""}'),
    ).toThrow(/Figure isn't enabled/);
    expect(() => compile(postkit.remarkPlugins, '<Figure />')).toThrow(
      /Figure isn't enabled/,
    );
  });

  it('renders every built-in on the headless renderer (chakraOnly is empty)', () => {
    // 03 step 6 gave the interactive components headless views, so nothing is
    // chakra-only any more: Tabs and Poll are part of their kits headlessly too.
    const postkit = createPostkit({ kits: [article, engagement] });

    expect(postkit.definitions.map(({ name }) => name)).toContain('Tabs');
    expect(postkit.manifest().components['Tabs']).toMatchObject({
      support: { headless: 'supported' },
    });
    expect(() =>
      compile(postkit.remarkPlugins, ':::postkit-tabs{items="[]"}\nBody\n:::'),
    ).not.toThrow();
    expect(() => render(postkit, 'Tabs')).not.toThrow();
  });

  it('builds a v2 manifest of exactly the set', () => {
    const manifest = createPostkit({
      kits: [article, discovery],
      exclude: ['Aside'],
      components: [
        {
          definition: showcaseDefinition,
          view: Showcase,
          package: '@acme/showcase',
        },
      ],
    }).manifest();

    expect(manifest.version).toBe(2);
    expect(Object.keys(manifest.components)).not.toContain('Aside');
    expect(manifest.components['LinkPreview']).toMatchObject({
      support: { headless: 'supported' },
    });
    expect(manifest.components['Callout']).toMatchObject({
      kit: 'article',
      package: '@postkit/core',
      support: { react: 'supported', headless: 'supported' },
    });
    expect(manifest.components['Showcase']).toMatchObject({
      kit: null,
      package: '@acme/showcase',
      stability: 'experimental',
      support: { headless: 'supported' },
    });
    expect(manifest.components['Showcase'].support).not.toHaveProperty(
      'chakra',
    );
  });

  it('rejects configuration that names nothing it enabled', () => {
    expect(() =>
      createPostkit({ kits: [article], exclude: ['Figure'] }),
    ).toThrow("exclude: Figure isn't in the enabled kits or components.");
    expect(() =>
      createPostkit({
        kits: [article],
        defaults: { Figure: { layout: 'wide' } },
      }),
    ).toThrow("defaults.Figure: Figure isn't enabled.");
    expect(() =>
      createPostkit({
        kits: [article],
        defaults: { Callout: { variant: 'loud' as never } },
      }),
    ).toThrow('defaults: Callout: the "variant" prop must be one of');
    expect(() =>
      createPostkit({
        kits: [article],
        defaults: { Callout: { colour: 'red' } as never },
      }),
    ).toThrow('defaults.Callout: Callout has no "colour" prop.');
    expect(() =>
      createPostkit({
        kits: [article],
        overrides: { Callout: { slots: { badge: Showcase } as never } },
      }),
    ).toThrow('overrides.Callout.slots: Callout has no "badge" part.');
    expect(() =>
      createPostkit({
        kits: [article],
        components: [{ definition: calloutDefinition, view: Showcase }],
      }),
    ).toThrow('components: Callout is already enabled.');
  });

  it('types defaults and slot names for built-ins', () => {
    expect(() =>
      createPostkit({
        kits: [article],
        // @ts-expect-error `loud` isn't a Callout variant.
        defaults: { Callout: { variant: 'loud' } },
      }),
    ).toThrow(TypeError);
    expect(() =>
      createPostkit({
        kits: [article],
        // @ts-expect-error Callout has no `badge` part.
        overrides: { Callout: { slots: { badge: Showcase } } },
      }),
    ).toThrow(TypeError);
  });
});

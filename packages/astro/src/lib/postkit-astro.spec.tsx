import { renderToStaticMarkup } from 'react-dom/server';
import {
  createPostkitAstroComponents,
  postkitAstroComponents,
} from './components.js';
import { POSTKIT_ASTRO_SYSTEM_ID, postkitAstro } from './integration.js';
import { createPostkitAstroMdxOptions } from './mdx-options.js';
import {
  Audio,
  CallToAction,
  Figure,
  SocialPost,
} from './react-bridges.js';

describe('Postkit Astro adapter', () => {
  it('provides Postkit components while preserving site overrides', () => {
    const SiteAudio = () => undefined;
    const components = createPostkitAstroComponents({
      Audio: SiteAudio,
      Callout: () => undefined,
    });

    expect(Object.keys(postkitAstroComponents)).toHaveLength(35);
    expect(Object.keys(postkitAstroComponents)).toEqual(
      expect.arrayContaining([
        'AppearsOn',
        'Aside',
        'Callout',
        'Gallery',
        'CodeBlock',
        'FileCard',
        'Poll',
        'ProductCard',
        'AudienceBoundary',
        'Video',
      ]),
    );
    expect(components.Audio).toBe(SiteAudio);
    expect(components.Callout).toBeDefined();
    expect(components.Carousel).toBe(postkitAstroComponents.Carousel);
  });

  it('exposes Postkit remark plugins as Astro MDX options', () => {
    const options = createPostkitAstroMdxOptions({
      postkit: {
        frontmatter: false,
      },
    });

    expect(options.processor.name).toBe('unified');
    expect(options.processor.options.remarkPlugins).toHaveLength(3);
    expect(options.processor.options.gfm).toBe(false);
  });

  it('renders React bridges beneath the themed Postkit provider', () => {
    const markup = renderToStaticMarkup(
      <Audio
        src="/episode.mp3"
        title="Episode"
        caption="Recorded live."
      />,
    );

    expect(markup).toContain('data-postkit-component="Audio"');
    expect(markup).toContain('Recorded live.');

    const ctaMarkup = renderToStaticMarkup(
      <CallToAction
        title="Read the field guide"
        primaryLabel="Open guide"
        primaryHref="/guide"
      />,
    );
    expect(ctaMarkup).toContain('data-postkit-component="CallToAction"');
    expect(ctaMarkup).toContain('Read the field guide');

    const figureMarkup = renderToStaticMarkup(
      <Figure
        src="/photo.jpg"
        alt="A field at sunrise"
        caption="First light."
      />,
    );
    expect(figureMarkup).toContain('data-postkit-component="Figure"');
    expect(figureMarkup).toContain('First light.');

    const socialMarkup = renderToStaticMarkup(
      <SocialPost
        href="https://social.example/post/1"
        service="linegraph"
        authorName="Ada"
        text="A syndicated note."
      />,
    );
    expect(socialMarkup).toContain('data-postkit-component="SocialPost"');
    expect(socialMarkup).toContain('A syndicated note.');
  });

  it('provides Chakra default and custom system virtual modules', async () => {
    const defaultSource = await configuredSystemSource(postkitAstro());
    const customSource = await configuredSystemSource(
      postkitAstro({ chakraSystem: './src/postkit-system.ts' }),
    );

    expect(defaultSource).toContain('defaultSystem');
    expect(customSource).toContain('/fixture/src/postkit-system.ts');
  });
});

async function configuredSystemSource(
  integration: ReturnType<typeof postkitAstro>,
): Promise<string> {
  let vitePlugin:
    | {
        resolveId(id: string): unknown;
        load(id: string): unknown;
      }
    | undefined;
  const hook = integration.hooks['astro:config:setup'];

  if (!hook) {
    throw new Error('Expected the Astro config setup hook.');
  }

  await hook({
    config: {
      root: new URL('file:///fixture/'),
    },
    updateConfig: (config: {
      vite?: {
        plugins?: Array<{
          resolveId(id: string): unknown;
          load(id: string): unknown;
        }>;
      };
    }) => {
      vitePlugin = config.vite?.plugins?.[0];
    },
  } as never);

  if (!vitePlugin) {
    throw new Error('Expected the Postkit Chakra system Vite plugin.');
  }

  const resolvedId = await vitePlugin.resolveId(POSTKIT_ASTRO_SYSTEM_ID);
  if (typeof resolvedId !== 'string') {
    throw new Error('Expected the Postkit Chakra system virtual module.');
  }

  const source = await vitePlugin.load(resolvedId);
  if (typeof source !== 'string') {
    throw new Error('Expected the Postkit Chakra system module source.');
  }

  return source;
}

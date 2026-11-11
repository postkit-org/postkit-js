import { renderToStaticMarkup } from 'react-dom/server';
import {
  createPostkitAstroComponents,
  postkitAstroComponents,
} from './components.js';
import {
  POSTKIT_ASTRO_SYSTEM_ID,
  POSTKIT_ASTRO_VIEWS_ID,
  postkitAstro,
} from './integration.js';
import { createPostkitAstroMdxOptions } from './mdx-options.js';
import { Audio, CallToAction, Figure, SocialPost } from './react-bridges.js';

describe('Postkit Astro adapter', () => {
  it('provides Postkit components while preserving site overrides', () => {
    const SiteAudio = () => undefined;
    const components = createPostkitAstroComponents({
      Audio: SiteAudio,
      Callout: () => undefined,
    });

    expect(Object.keys(postkitAstroComponents)).toHaveLength(38);
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
      <Audio src="/episode.mp3" title="Episode" caption="Recorded live." />,
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

  it('points the wrappers at the Chakra views by default and the headless views on request', async () => {
    const chakra = await configuredSystemSource(
      postkitAstro(),
      POSTKIT_ASTRO_VIEWS_ID,
    );
    const explicit = await configuredSystemSource(
      postkitAstro({ renderer: 'chakra' }),
      POSTKIT_ASTRO_VIEWS_ID,
    );
    const headless = await configuredSystemSource(
      postkitAstro({ renderer: 'headless' }),
      POSTKIT_ASTRO_VIEWS_ID,
    );

    expect(chakra).toMatch(/^export \* from ".*react-bridges\.js";$/);
    expect(explicit).toBe(chakra);
    expect(headless).toMatch(/^export \* from ".*headless-bridges\.js";$/);
  });

  it('adds the headless stylesheet to every page only when asked', async () => {
    expect(
      await injectedScripts(
        postkitAstro({ renderer: 'headless', styles: true }),
      ),
    ).toEqual([['page-ssr', "import '@postkit/react/styles.css';"]]);
    expect(
      await injectedScripts(postkitAstro({ renderer: 'headless' })),
    ).toEqual([]);
    expect(await injectedScripts(postkitAstro())).toEqual([]);
  });

  it('rejects options that belong to the other renderer', () => {
    expect(() =>
      postkitAstro({ renderer: 'headless', chakraSystem: './system.ts' }),
    ).toThrow('chakraSystem applies to the Chakra renderer only');
    expect(() => postkitAstro({ styles: true })).toThrow(
      'needs renderer: "headless"',
    );
    expect(() => postkitAstro({ renderer: 'elements' as never })).toThrow(
      'renderer must be "chakra" or "headless"',
    );
  });
});

type SetupHookInput = {
  config: { root: URL };
  injectScript: (stage: string, content: string) => void;
  updateConfig: (config: {
    vite?: {
      plugins?: Array<{
        resolveId(id: string): unknown;
        load(id: string): unknown;
      }>;
    };
  }) => void;
};

async function injectedScripts(
  integration: ReturnType<typeof postkitAstro>,
): Promise<[string, string][]> {
  const scripts: [string, string][] = [];
  const hook = integration.hooks['astro:config:setup'];
  if (!hook) throw new Error('Expected the Astro config setup hook.');
  const input: SetupHookInput = {
    config: { root: new URL('file:///fixture/') },
    injectScript: (stage, content) => {
      scripts.push([stage, content]);
    },
    updateConfig: () => undefined,
  };
  await hook(input as never);
  return scripts;
}

async function configuredSystemSource(
  integration: ReturnType<typeof postkitAstro>,
  moduleId: string = POSTKIT_ASTRO_SYSTEM_ID,
): Promise<string> {
  let vitePlugins: NonNullable<
    NonNullable<
      Parameters<SetupHookInput['updateConfig']>[0]['vite']
    >['plugins']
  > = [];
  const hook = integration.hooks['astro:config:setup'];

  if (!hook) {
    throw new Error('Expected the Astro config setup hook.');
  }

  const input: SetupHookInput = {
    config: {
      root: new URL('file:///fixture/'),
    },
    injectScript: () => undefined,
    updateConfig: (config) => {
      vitePlugins = config.vite?.plugins ?? [];
    },
  };
  await hook(input as never);

  for (const vitePlugin of vitePlugins) {
    const resolvedId = await vitePlugin.resolveId(moduleId);
    if (typeof resolvedId !== 'string') continue;

    const source = await vitePlugin.load(resolvedId);
    if (typeof source !== 'string') {
      throw new Error(`Expected the ${moduleId} module source.`);
    }
    return source;
  }

  throw new Error(`Expected a Vite plugin for ${moduleId}.`);
}

import type { AstroIntegration } from 'astro';
import { fileURLToPath } from 'node:url';

export const POSTKIT_ASTRO_SYSTEM_ID = 'virtual:postkit/chakra-system' as const;
const RESOLVED_POSTKIT_ASTRO_SYSTEM_ID =
  `\0${POSTKIT_ASTRO_SYSTEM_ID}` as const;

/**
 * The module the generated Astro wrappers render their views from. The
 * integration points it at the configured renderer's views.
 */
export const POSTKIT_ASTRO_VIEWS_ID = 'virtual:postkit/astro-views' as const;
const RESOLVED_POSTKIT_ASTRO_VIEWS_ID = `\0${POSTKIT_ASTRO_VIEWS_ID}` as const;

/** The renderers the Astro wrappers can use. */
export type PostkitAstroRenderer = 'chakra' | 'headless';

export interface PostkitAstroIntegrationOptions {
  /**
   * Which views the Astro components render:
   *
   * - `'chakra'` (the default): the `@postkit/chakra` views, each in Postkit's
   *   provider with the site's Chakra system (`chakraSystem`).
   * - `'headless'`: the `@postkit/react` views, which emit the anatomy and no
   *   styles. Style them yourself, or set `styles: true` for the
   *   `@postkit/react/styles.css` baseline. Chakra isn't loaded.
   */
  readonly renderer?: PostkitAstroRenderer;
  /**
   * A module that default-exports the site's Chakra SystemContext.
   * Relative paths resolve from the Astro project root. Chakra renderer only.
   */
  readonly chakraSystem?: string;
  /**
   * Adds `@postkit/react/styles.css`, the headless views' token-driven
   * baseline, to every page. Headless renderer only; defaults to `false`.
   */
  readonly styles?: boolean;
}

const renderers: readonly PostkitAstroRenderer[] = ['chakra', 'headless'];

function systemModuleSource(
  projectRoot: URL,
  configuredModule: string | undefined,
): string {
  if (!configuredModule) {
    return "export { defaultSystem as default } from '@chakra-ui/react';";
  }

  const moduleId = configuredModule.startsWith('.')
    ? fileURLToPath(new URL(configuredModule, projectRoot))
    : configuredModule;
  return `export { default } from ${JSON.stringify(moduleId)};`;
}

/*
 * The views module re-exports one renderer's bridges, so a page (and each
 * island) only ever loads the renderer it uses.
 */
function viewsModuleSource(renderer: PostkitAstroRenderer): string {
  const bridges = new URL(
    renderer === 'headless' ? './headless-bridges.js' : './react-bridges.js',
    import.meta.url,
  );
  return `export * from ${JSON.stringify(fileURLToPath(bridges))};`;
}

function validated(
  options: PostkitAstroIntegrationOptions,
): Required<Pick<PostkitAstroIntegrationOptions, 'renderer' | 'styles'>> {
  const renderer = options.renderer ?? 'chakra';
  if (!renderers.includes(renderer)) {
    throw new TypeError(
      `postkitAstro: renderer must be "chakra" or "headless", not ${JSON.stringify(renderer)}.`,
    );
  }
  if (renderer === 'headless' && options.chakraSystem !== undefined) {
    throw new TypeError(
      'postkitAstro: chakraSystem applies to the Chakra renderer only. Remove it, or use renderer: "chakra".',
    );
  }
  if (renderer === 'chakra' && options.styles) {
    throw new TypeError(
      'postkitAstro: styles adds the headless baseline (@postkit/react/styles.css), so it needs renderer: "headless". The Chakra views are styled by the Chakra system.',
    );
  }
  return { renderer, styles: options.styles ?? false };
}

export function postkitAstro(
  options: PostkitAstroIntegrationOptions = {},
): AstroIntegration {
  const { renderer, styles } = validated(options);

  return {
    name: '@postkit/astro',
    hooks: {
      'astro:config:setup': ({ config, injectScript, updateConfig }) => {
        const systemSource = systemModuleSource(
          config.root,
          options.chakraSystem,
        );
        const viewsSource = viewsModuleSource(renderer);

        if (styles) {
          injectScript('page-ssr', "import '@postkit/react/styles.css';");
        }

        updateConfig({
          vite: {
            plugins: [
              {
                name: '@postkit/astro:chakra-system',
                enforce: 'pre',
                resolveId(id) {
                  return id === POSTKIT_ASTRO_SYSTEM_ID
                    ? RESOLVED_POSTKIT_ASTRO_SYSTEM_ID
                    : undefined;
                },
                load(id) {
                  return id === RESOLVED_POSTKIT_ASTRO_SYSTEM_ID
                    ? systemSource
                    : undefined;
                },
              },
              {
                name: '@postkit/astro:views',
                enforce: 'pre',
                resolveId(id) {
                  return id === POSTKIT_ASTRO_VIEWS_ID
                    ? RESOLVED_POSTKIT_ASTRO_VIEWS_ID
                    : undefined;
                },
                load(id) {
                  return id === RESOLVED_POSTKIT_ASTRO_VIEWS_ID
                    ? viewsSource
                    : undefined;
                },
              },
            ],
          },
        });
      },
    },
  };
}

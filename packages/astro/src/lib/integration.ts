import type { AstroIntegration } from 'astro';
import { fileURLToPath } from 'node:url';

export const POSTKIT_ASTRO_SYSTEM_ID = 'virtual:postkit/chakra-system' as const;
const RESOLVED_POSTKIT_ASTRO_SYSTEM_ID =
  `\0${POSTKIT_ASTRO_SYSTEM_ID}` as const;

export interface PostkitAstroIntegrationOptions {
  /**
   * A module that default-exports the site's Chakra SystemContext.
   * Relative paths resolve from the Astro project root.
   */
  readonly chakraSystem?: string;
}

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

export function postkitAstro(
  options: PostkitAstroIntegrationOptions = {},
): AstroIntegration {
  return {
    name: '@postkit/astro',
    hooks: {
      'astro:config:setup': ({ config, updateConfig }) => {
        const source = systemModuleSource(config.root, options.chakraSystem);

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
                    ? source
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

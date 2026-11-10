import type { PostkitComponentManifest } from '@postkit/core/components';

import { PostkitCliError } from './names.js';

/** The part of a `createPostkit` result the CLI reads. */
export interface PostkitConfigModuleValue {
  manifest(): PostkitComponentManifest;
}

function isPostkit(value: unknown): value is PostkitConfigModuleValue {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { manifest?: unknown }).manifest === 'function'
  );
}

/**
 * Picks the `createPostkit` result from a config module: its default export,
 * a `postkit` export, or its only export with a `manifest()` method.
 */
export function pickPostkitExport(
  module: Readonly<Record<string, unknown>>,
  path: string,
): PostkitConfigModuleValue {
  const candidates: unknown[] = [module['default'], module['postkit']];
  const fromDefault = module['default'];
  if (typeof fromDefault === 'object' && fromDefault !== null) {
    candidates.push((fromDefault as Record<string, unknown>)['postkit']);
  }
  for (const candidate of candidates) {
    if (isPostkit(candidate)) return candidate;
  }
  const others = Object.values(module).filter(isPostkit);
  if (others.length === 1) return others[0];
  throw new PostkitCliError(
    others.length > 1
      ? `${path} exports more than one createPostkit result. Export the one to use as default or as postkit.`
      : `${path} doesn't export a createPostkit result. Export it as default or as postkit.`,
  );
}

/**
 * Loads a config module (TypeScript and TSX included, through jiti) and
 * returns its `createPostkit` result.
 */
export async function loadPostkitConfig(
  path: string,
): Promise<PostkitConfigModuleValue> {
  const { createJiti } = await import('jiti');
  const jiti = createJiti(path, {
    jsx: { runtime: 'automatic' },
    interopDefault: false,
    moduleCache: false,
    fsCache: false,
  });
  let module: Record<string, unknown>;
  try {
    module = (await jiti.import(path)) as Record<string, unknown>;
  } catch (error) {
    throw new PostkitCliError(
      `Couldn't load ${path}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  return pickPostkitExport(module, path);
}

import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * The share images' fonts: Inter Tight (the boards' sans) and JetBrains Mono, as WOFF (Satori
 * reads TTF, OTF and WOFF, not WOFF2). The site loads Inter Tight through `next/font`, which
 * Satori can't use, and no font package is installed, so the files come from the Fontsource
 * npm packages on jsDelivr at a pinned version, checked against a SHA-256, and are cached in
 * `node_modules/.cache`. The first build on a machine needs network access.
 *
 * Each face has the `latin` and `latin-ext` subsets; Satori falls back from one to the next.
 */

const SOURCE = 'https://cdn.jsdelivr.net/npm';

type Weight = 400 | 500;

interface FontFile {
  readonly name: 'Inter Tight' | 'JetBrains Mono';
  readonly weight: Weight;
  /** The pinned package: `@fontsource/inter-tight@5.3.0`. */
  readonly pkg: string;
  readonly file: string;
  readonly sha256: string;
}

const files: readonly FontFile[] = [
  {
    name: 'Inter Tight',
    weight: 400,
    pkg: '@fontsource/inter-tight@5.3.0',
    file: 'inter-tight-latin-400-normal.woff',
    sha256: 'd31e5249a330dd72303ae493d7a3cd0d50b1bbda58a677d31105205af253902b',
  },
  {
    name: 'Inter Tight',
    weight: 400,
    pkg: '@fontsource/inter-tight@5.3.0',
    file: 'inter-tight-latin-ext-400-normal.woff',
    sha256: '96dc974cdd007eed83b86a3b193fdd8536bf79bb622779c9f66429af4f0faffd',
  },
  {
    name: 'Inter Tight',
    weight: 500,
    pkg: '@fontsource/inter-tight@5.3.0',
    file: 'inter-tight-latin-500-normal.woff',
    sha256: '4dd64e50b64fd1bfd517e7e4872bddeded0ecf771e8a236b3523f0e03d98d124',
  },
  {
    name: 'Inter Tight',
    weight: 500,
    pkg: '@fontsource/inter-tight@5.3.0',
    file: 'inter-tight-latin-ext-500-normal.woff',
    sha256: 'a1edfdaa17b52e0df99a1269feb29f2294caf08737e4bf77974ae497feaa994c',
  },
  {
    name: 'JetBrains Mono',
    weight: 400,
    pkg: '@fontsource/jetbrains-mono@5.3.0',
    file: 'jetbrains-mono-latin-400-normal.woff',
    sha256: '658b9ee07b0249cf910a8d6f3d812d46c962bae81d7379a0355b1db35c61586f',
  },
  {
    name: 'JetBrains Mono',
    weight: 400,
    pkg: '@fontsource/jetbrains-mono@5.3.0',
    file: 'jetbrains-mono-latin-ext-400-normal.woff',
    sha256: 'e7131bbf591e1ed9b74e44e162f6a39affa00ac21654cb683585d085733f6355',
  },
];

/** The shape `ImageResponse`'s `fonts` option takes. */
export interface ShareImageFont {
  readonly name: string;
  readonly data: ArrayBuffer;
  readonly weight: Weight;
  readonly style: 'normal';
}

function sha256(data: Uint8Array): string {
  return createHash('sha256').update(data).digest('hex');
}

async function readCached(
  path: string,
  expected: string,
): Promise<Uint8Array | null> {
  try {
    const data = await readFile(path);
    return sha256(data) === expected ? data : null;
  } catch {
    return null;
  }
}

async function download(
  font: FontFile,
  cachePath: string,
): Promise<Uint8Array> {
  const url = `${SOURCE}/${font.pkg}/files/${font.file}`;
  let response: Response;
  try {
    response = await fetch(url);
  } catch (error) {
    throw new Error(
      `Couldn't download ${url} for the share images. The first build needs network access.`,
      { cause: error },
    );
  }
  if (!response.ok) {
    throw new Error(`Couldn't download ${url}: HTTP ${response.status}.`);
  }
  const data = new Uint8Array(await response.arrayBuffer());
  const actual = sha256(data);
  if (actual !== font.sha256) {
    throw new Error(
      `${url} doesn't match its pinned SHA-256 (expected ${font.sha256}, got ${actual}).`,
    );
  }
  await writeFile(cachePath, data);
  return data;
}

/** Every face the templates use, from the cache or (once per machine) the network. */
export async function loadShareImageFonts(
  cacheDirectory: string,
): Promise<ShareImageFont[]> {
  await mkdir(cacheDirectory, { recursive: true });

  return Promise.all(
    files.map(async (font) => {
      const path = join(
        cacheDirectory,
        `${font.sha256.slice(0, 12)}-${font.file}`,
      );
      const data =
        (await readCached(path, font.sha256)) ?? (await download(font, path));
      return {
        name: font.name,
        // A copy into its own ArrayBuffer (a Node Buffer may share a pooled one).
        data: new Uint8Array(data).buffer,
        weight: font.weight,
        style: 'normal' as const,
      };
    }),
  );
}

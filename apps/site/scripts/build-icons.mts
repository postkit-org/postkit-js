/**
 * Renders the site icons and the web manifest into `public/` from the one brand source,
 * `docs/design/handoff/assets/brand/favicon.svg` (05 §2, PK-060), so they never drift. The
 * output is generated and git-ignored. Run through Nx (`nx run site:icons`).
 *
 * - `favicon.svg`: the source, as is (the pill on a transparent ground).
 * - `favicon.ico`: 16 and 32px PNGs in an ICO container.
 * - `apple-touch-icon.png` (180), `icon-192.png`, `icon-512.png`: the pill at 62% width on
 *   `#1D1D1F`, square. 512 is also the maskable icon: the pill stays inside the 80% safe zone.
 * - `site.webmanifest`: name, theme and background colours, and the icons.
 */
import { copyFile, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createJiti } from 'jiti';
import sharp from 'sharp';

const siteRoot = fileURLToPath(new URL('../', import.meta.url));
const publicDirectory = join(siteRoot, 'public');
const source = join(
  siteRoot,
  '..',
  '..',
  'docs',
  'design',
  'handoff',
  'assets',
  'brand',
  'favicon.svg',
);

// The theme package is TypeScript source; jiti loads it as the site's bundler would.
const jiti = createJiti(import.meta.url);
const { tokens } = (await jiti.import(
  '@postkit/site-theme',
)) as typeof import('@postkit/site-theme');

/** The touch and app icons' ground: 05 §2's #1D1D1F, the light `bg.inverted`. */
const iconGround = tokens.color['bg.inverted'].light;
/** The manifest's `theme_color` and `background_color`: 05 §2's #FFFFFF, the light `bg`. */
const manifestColor = tokens.color.bg.light;
/** The pill's width on the square icons. */
const PILL_SHARE = 0.62;
/** A maskable icon's safe zone: a centred circle 80% of the icon's width. */
const SAFE_ZONE = 0.8;

const svg = await readFile(source);
const { width: viewWidth = 30, height: viewHeight = 16 } =
  await sharp(svg).metadata();

/** The pill alone at `width` pixels wide, transparent around it. */
async function pill(width: number): Promise<Buffer> {
  // Rasterise at 4× and downsample, for clean edges at favicon sizes.
  const density = (72 * width * 4) / viewWidth;
  return sharp(svg, { density }).resize({ width }).png().toBuffer();
}

/** The pill centred in a transparent square (favicon.ico). */
async function transparentSquare(size: number): Promise<Buffer> {
  return sharp(await pill(size))
    .resize(size, size, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
}

/** The pill at 62% width, centred on the icon ground. */
async function groundedSquare(size: number): Promise<Buffer> {
  const width = Math.round(size * PILL_SHARE);
  const height = (width * viewHeight) / viewWidth;
  // The stadium's farthest points are its ends, half its width from the centre.
  if (Math.hypot(width / 2, 0) > (size * SAFE_ZONE) / 2 || height > size) {
    throw new RangeError(`The pill doesn't fit the safe zone at ${size}px.`);
  }
  return sharp({
    create: { width: size, height: size, channels: 4, background: iconGround },
  })
    .composite([{ input: await pill(width), gravity: 'centre' }])
    .png()
    .toBuffer();
}

/** An ICO file holding PNG images (supported everywhere ICO is). */
function ico(images: readonly { size: number; png: Buffer }[]): Buffer {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // 1 = icon
  header.writeUInt16LE(images.length, 4);

  let offset = header.length + images.length * 16;
  const entries = images.map(({ size, png }) => {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0); // width
    entry.writeUInt8(size >= 256 ? 0 : size, 1); // height
    entry.writeUInt8(0, 2); // palette size
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // colour planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(png.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += png.length;
    return entry;
  });

  return Buffer.concat([header, ...entries, ...images.map(({ png }) => png)]);
}

const icons = [
  { file: 'apple-touch-icon.png', size: 180 },
  { file: 'icon-192.png', size: 192 },
  { file: 'icon-512.png', size: 512 },
] as const;

await copyFile(source, join(publicDirectory, 'favicon.svg'));

await writeFile(
  join(publicDirectory, 'favicon.ico'),
  ico(
    await Promise.all(
      [16, 32].map(async (size) => ({
        size,
        png: await transparentSquare(size),
      })),
    ),
  ),
);

for (const { file, size } of icons) {
  await writeFile(join(publicDirectory, file), await groundedSquare(size));
}

const manifest = {
  name: 'Postkit',
  icons: [
    { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    {
      src: '/icon-512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'maskable',
    },
  ],
  theme_color: manifestColor,
  background_color: manifestColor,
};
await writeFile(
  join(publicDirectory, 'site.webmanifest'),
  `${JSON.stringify(manifest, null, 2)}\n`,
);

process.stdout.write(
  `Icons: favicon.svg, favicon.ico (16, 32), ${icons
    .map(({ file }) => file)
    .join(', ')}, site.webmanifest → ${publicDirectory}\n`,
);

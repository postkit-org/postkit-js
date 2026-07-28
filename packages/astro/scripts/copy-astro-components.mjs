import { cp, mkdir, readdir, writeFile } from 'node:fs/promises';

const sourceDirectory = new URL('../src/components/', import.meta.url);
const destinationDirectory = new URL('../dist/components/', import.meta.url);

await mkdir(destinationDirectory, {
  recursive: true,
});
await cp(sourceDirectory, destinationDirectory, { recursive: true });

for (const fileName of await readdir(sourceDirectory)) {
  if (!fileName.endsWith('.astro')) continue;
  await writeFile(
    new URL(`${fileName}.d.ts`, destinationDirectory),
    `import type { AstroComponentFactory } from 'astro/runtime/server/index.js';
declare const component: AstroComponentFactory;
export default component;
`,
  );
}

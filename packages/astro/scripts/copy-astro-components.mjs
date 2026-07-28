import { cp, mkdir } from 'node:fs/promises';

await mkdir(new URL('../dist/components/', import.meta.url), {
  recursive: true,
});
await cp(
  new URL('../src/components/', import.meta.url),
  new URL('../dist/components/', import.meta.url),
  { recursive: true },
);

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { format } from 'prettier';

const workspaceRoot = fileURLToPath(new URL('../', import.meta.url));
const outputPath = join(
  workspaceRoot,
  'packages',
  'react',
  'component-manifest.json',
);
const catalogModule = await import(
  new URL('../packages/react/dist/index.js', import.meta.url)
);
const output = await format(
  JSON.stringify(catalogModule.postkitComponentCatalog),
  { parser: 'json' },
);

if (process.argv.includes('--check')) {
  let existing;
  try {
    existing = readFileSync(outputPath, 'utf8');
  } catch {
    throw new Error(
      'The generated component manifest is missing. Run npm run catalog:generate.',
    );
  }
  if (existing !== output) {
    throw new Error(
      'The generated component manifest is stale. Run npm run catalog:generate.',
    );
  }
  process.stdout.write('Component manifest is current.\n');
} else {
  writeFileSync(outputPath, output);
  process.stdout.write(`Generated ${outputPath}\n`);
}

// Builds `dist/styles.css`, the optional baseline exported as
// `@postkit/react/styles.css` (03-component-system §5.2): the tokens, the
// shared prose rules, then each component's slice in folder order.
import { access, mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const sourceRoot = new URL('../src/', import.meta.url);
const outputFile = new URL('../dist/styles.css', import.meta.url);

async function exists(url) {
  try {
    await access(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * The stylesheet's sources, relative to `src/`, in cascade order: tokens,
 * shared prose, then `components/<name>/<name>.css` for each component folder
 * that has one.
 */
export async function postkitStyleSources() {
  const folders = (
    await readdir(new URL('components/', sourceRoot), { withFileTypes: true })
  )
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  const sources = ['styles/tokens.css', 'styles/prose.css'];
  for (const folder of folders) {
    const source = `components/${folder}/${folder}.css`;
    if (await exists(new URL(source, sourceRoot))) sources.push(source);
  }
  return sources;
}

/** The concatenated stylesheet. */
export async function buildPostkitStylesheet() {
  const sections = [];
  for (const source of await postkitStyleSources()) {
    const css = await readFile(new URL(source, sourceRoot), 'utf8');
    sections.push(`/* ${source} */\n${css.trim()}\n`);
  }
  return (
    '/*! @postkit/react/styles.css: the optional, token-driven baseline. MIT License. */\n\n' +
    sections.join('\n')
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await mkdir(new URL('./', outputFile), { recursive: true });
  await writeFile(outputFile, await buildPostkitStylesheet());
}

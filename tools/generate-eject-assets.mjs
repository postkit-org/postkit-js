// Writes a renderer package's eject assets (03 §4 rung 7) to `dist/eject/`:
// the source of every component folder, the internal modules those views
// import (transitively), and `manifest.json` with the package's public export
// names. `postkit eject` copies from these assets and rewrites the imports;
// `postkit diff` compares them across versions.
//
//   node tools/generate-eject-assets.mjs packages/chakra chakra
//
// The sources go to `dist/eject/files/` (`src/`'s layout), so they ship in
// the tarball without publishing `src/` (package:check forbids it), and are
// rebuilt with the package.
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, posix, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const workspaceRoot = fileURLToPath(new URL('../', import.meta.url));
const [projectArgument, renderer] = process.argv.slice(2);
if (!projectArgument || !renderer) {
  throw new Error(
    'Usage: node tools/generate-eject-assets.mjs <package-dir> <renderer-id>',
  );
}
const projectRoot = resolve(workspaceRoot, projectArgument);
const sourceRoot = join(projectRoot, 'src');
const outputRoot = join(projectRoot, 'dist', 'eject');
const packageJson = JSON.parse(
  readFileSync(join(projectRoot, 'package.json'), 'utf8'),
);

const isSource = (name) =>
  /\.(tsx?|css)$/.test(name) && !/\.(spec|test|spec-support)\./.test(name);

const toPascal = (folder) =>
  folder.replace(/(^|-)([a-z0-9])/g, (_, __, letter) => letter.toUpperCase());

/** Relative module specifiers a source file imports or re-exports. */
function relativeSpecifiers(source) {
  const found = [];
  const pattern =
    /(?:^|[\s;])(?:import|export)\b[^'";]*?(?:from\s*)?['"](\.{1,2}\/[^'"]+)['"]/g;
  for (const match of source.matchAll(pattern)) found.push(match[1]);
  return found;
}

/** Resolves `./x.js` to the `.ts`/`.tsx` (or exact) file beside it. */
function resolveSource(fromFile, specifier) {
  const base = resolve(dirname(fromFile), specifier);
  const candidates = [
    base,
    base.replace(/\.js$/, '.ts'),
    base.replace(/\.js$/, '.tsx'),
    `${base}.ts`,
    `${base}.tsx`,
    join(base, 'index.ts'),
  ];
  return candidates.find(
    (candidate) => existsSync(candidate) && statSync(candidate).isFile(),
  );
}

// Component folders, and the closure of the modules their views import.
const components = {};
const files = new Set();
const queue = [];
const componentsRoot = join(sourceRoot, 'components');
for (const folder of readdirSync(componentsRoot).sort()) {
  const folderPath = join(componentsRoot, folder);
  if (!statSync(folderPath).isDirectory()) continue;
  const folderFiles = readdirSync(folderPath).filter(isSource).sort();
  if (!folderFiles.some((file) => /\.tsx$/.test(file))) continue;
  components[toPascal(folder)] = {
    folder: `components/${folder}`,
    files: folderFiles,
  };
  for (const file of folderFiles) queue.push(join(folderPath, file));
}
while (queue.length > 0) {
  const file = queue.pop();
  if (files.has(file)) continue;
  files.add(file);
  if (!/\.tsx?$/.test(file)) continue;
  for (const specifier of relativeSpecifiers(readFileSync(file, 'utf8'))) {
    const target = resolveSource(file, specifier);
    if (target && target.startsWith(sourceRoot) && isSource(target)) {
      queue.push(target);
    }
  }
}

// The public export names of the package root, types included, so the CLI
// can tell which internal imports an ejected view can take from the package.
function publicExports() {
  const entry = join(sourceRoot, 'index.ts');
  const program = ts.createProgram([entry], {
    allowJs: false,
    customConditions: ['@postkit/source'],
    jsx: ts.JsxEmit.ReactJSX,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    noEmit: true,
    skipLibCheck: true,
    target: ts.ScriptTarget.ES2022,
    types: [],
  });
  const checker = program.getTypeChecker();
  const sourceFile = program.getSourceFile(entry);
  const moduleSymbol = sourceFile && checker.getSymbolAtLocation(sourceFile);
  if (!moduleSymbol) throw new Error(`Couldn't read the exports of ${entry}.`);
  return checker
    .getExportsOfModule(moduleSymbol)
    .map((symbol) => symbol.getName())
    .sort();
}

rmSync(outputRoot, { recursive: true, force: true });
for (const file of [...files].sort()) {
  const target = join(outputRoot, 'files', relative(sourceRoot, file));
  mkdirSync(dirname(target), { recursive: true });
  cpSync(file, target);
}
const manifest = {
  schema: 'postkit.eject/1',
  package: packageJson.name,
  version: packageJson.version,
  renderer,
  exports: publicExports(),
  components,
  files: [...files]
    .map((file) => relative(sourceRoot, file).split('\\').join(posix.sep))
    .sort(),
};
writeFileSync(
  join(outputRoot, 'manifest.json'),
  `${JSON.stringify(manifest, null, 2)}\n`,
);
process.stdout.write(
  `${packageJson.name}: ${Object.keys(components).length} ejectable views, ` +
    `${files.size} files in dist/eject.\n`,
);

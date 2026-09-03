import { spawnSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import publicPackages from './public-packages.json' with { type: 'json' };
import { runNpm } from './release-commands.mjs';

const workspaceRoot = fileURLToPath(new URL('../', import.meta.url));
const packagesRoot = join(workspaceRoot, 'packages');
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const expectedRepository = 'git+https://github.com/postkit-org/postkit-js.git';
const expectedBugs = 'https://github.com/postkit-org/postkit-js/issues';
const requiredKeywords = ['postkit', 'publishing', 'typescript'];
const chakraPeerRange = '>=3.29.0 <4';
const nxConfiguration = readJson(join(workspaceRoot, 'nx.json'));
const publishIndex = new Map(
  publicPackages.map((packageName, index) => [packageName, index]),
);

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function fail(message) {
  throw new Error(message);
}

if (nxConfiguration.release?.projectsRelationship !== 'fixed') {
  fail('Public PostKit packages must use a fixed Nx release relationship.');
}
if (
  JSON.stringify(nxConfiguration.release?.projects) !==
  JSON.stringify(publicPackages)
) {
  fail(
    'The Nx release project order must exactly match tools/public-packages.json.',
  );
}

const manifests = new Map();
const packageDirectories = readdirSync(packagesRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

for (const directory of packageDirectories) {
  const manifest = readJson(join(packagesRoot, directory, 'package.json'));
  if (manifest.nx?.tags?.includes('npm:public')) {
    if (!publishIndex.has(manifest.name)) {
      fail(
        `${manifest.name} is public but missing from the publish allowlist.`,
      );
    }
    manifests.set(manifest.name, { directory, manifest });
  } else if (manifest.private !== true) {
    fail(`${manifest.name} is not allowlisted and must be private.`);
  }
}

for (const packageName of publicPackages) {
  const entry = manifests.get(packageName);
  if (!entry) fail(`${packageName} is allowlisted but not marked npm:public.`);

  const { directory, manifest } = entry;
  if (manifest.private === true)
    fail(`${packageName} is unexpectedly private.`);
  if (manifest.license !== 'MIT')
    fail(`${packageName} must use the MIT license.`);
  if (
    !Array.isArray(manifest.keywords) ||
    requiredKeywords.some((keyword) => !manifest.keywords.includes(keyword)) ||
    new Set(manifest.keywords).size !== manifest.keywords.length
  ) {
    fail(
      `${packageName} must provide unique npm keywords including ${requiredKeywords.join(
        ', ',
      )}.`,
    );
  }
  if (manifest.publishConfig?.access !== 'public') {
    fail(`${packageName} must publish with public access.`);
  }
  if (manifest.publishConfig?.registry !== 'https://registry.npmjs.org/') {
    fail(`${packageName} must publish only to the public npm registry.`);
  }
  if (
    manifest.repository?.url !== expectedRepository ||
    manifest.repository?.directory !== `packages/${directory}` ||
    manifest.homepage !==
      `https://github.com/postkit-org/postkit-js/tree/main/packages/${directory}#readme` ||
    manifest.bugs?.url !== expectedBugs
  ) {
    fail(`${packageName} has incomplete repository or support metadata.`);
  }

  for (const dependencyGroup of [
    'dependencies',
    'optionalDependencies',
    'peerDependencies',
  ]) {
    for (const [dependencyName, dependencyVersion] of Object.entries(
      manifest[dependencyGroup] ?? {},
    )) {
      if (!dependencyName.startsWith('@postkit/')) continue;
      const dependency = manifests.get(dependencyName);
      if (!dependency) {
        fail(`${packageName} depends on non-allowlisted ${dependencyName}.`);
      }
      if (dependencyVersion !== dependency.manifest.version) {
        fail(
          `${packageName} must pin ${dependencyName} to ` +
            `${dependency.manifest.version}, received ${dependencyVersion}.`,
        );
      }
      if (publishIndex.get(dependencyName) >= publishIndex.get(packageName)) {
        fail(`${dependencyName} must precede ${packageName} in publish order.`);
      }
    }
  }

  if (
    manifest.peerDependencies?.['@chakra-ui/react'] &&
    manifest.peerDependencies['@chakra-ui/react'] !== chakraPeerRange
  ) {
    fail(
      `${packageName} must support @chakra-ui/react ${chakraPeerRange}, ` +
        `received ${manifest.peerDependencies['@chakra-ui/react']}.`,
    );
  }
}

runNpm([
  'exec',
  '--',
  'nx',
  'run-many',
  '-t',
  'build',
  '--projects=tag:npm:public',
]);

for (const packageName of publicPackages) {
  const result = spawnSync(
    npmCommand,
    [
      'pack',
      '--dry-run',
      '--json',
      '--cache',
      './tmp/npm-cache',
      '--workspace',
      packageName,
    ],
    {
      cwd: workspaceRoot,
      encoding: 'utf8',
      env: process.env,
    },
  );
  if (result.error) throw result.error;
  if (result.status !== 0) {
    process.stderr.write(result.stderr);
    fail(`npm pack failed for ${packageName}.`);
  }

  const [tarball] = JSON.parse(result.stdout);
  const paths = tarball.files.map((file) => file.path);
  for (const required of ['LICENSE', 'README.md', 'package.json']) {
    if (!paths.includes(required)) {
      fail(`${packageName} tarball is missing ${required}.`);
    }
  }
  if (
    packageName === '@postkit/react' &&
    !paths.includes('component-manifest.json')
  ) {
    fail('@postkit/react tarball is missing component-manifest.json.');
  }
  if (!paths.some((path) => path.endsWith('.js'))) {
    fail(`${packageName} tarball has no compiled JavaScript.`);
  }
  if (!paths.some((path) => path.endsWith('.d.ts'))) {
    fail(`${packageName} tarball has no TypeScript declarations.`);
  }
  const forbidden = paths.find(
    (path) =>
      path.startsWith('src/') ||
      path.includes('/src/') ||
      path.includes('.spec.') ||
      path.includes('.test.') ||
      path.startsWith('fixture/'),
  );
  if (forbidden) {
    fail(`${packageName} tarball contains development file ${forbidden}.`);
  }

  process.stdout.write(
    `${packageName}@${tarball.version}: ${tarball.entryCount} files, ` +
      `${tarball.size} bytes\n`,
  );
}

process.stdout.write(
  `Validated ${publicPackages.length} public PostKit packages.\n`,
);

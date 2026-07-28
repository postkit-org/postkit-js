import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import publicPackages from './public-packages.json' with { type: 'json' };
import { runNpm } from './release-commands.mjs';

const workspaceRoot = fileURLToPath(new URL('../', import.meta.url));
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const dryRun = process.argv.slice(2).includes('--dry-run');

function readManifest(packageName) {
  const directory = packageName.slice('@postkit/'.length);
  return JSON.parse(
    readFileSync(
      join(workspaceRoot, 'packages', directory, 'package.json'),
      'utf8',
    ),
  );
}

function pack(packageName) {
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
    throw new Error(`npm pack failed for ${packageName}.`);
  }
  const [tarball] = JSON.parse(result.stdout);
  return tarball;
}

async function registryIntegrity(packageName, version) {
  const packagePath = encodeURIComponent(packageName);
  const response = await fetch(
    `https://registry.npmjs.org/${packagePath}/${version}`,
    {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(15_000),
    },
  );
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(
      `Could not inspect ${packageName}@${version} on npm: ` +
        `${response.status} ${response.statusText}.`,
    );
  }
  const metadata = await response.json();
  if (typeof metadata.dist?.integrity !== 'string') {
    throw new Error(`${packageName}@${version} has no registry integrity.`);
  }
  return metadata.dist.integrity;
}

const plans = await Promise.all(
  publicPackages.map(async (packageName) => {
    process.stdout.write(`Inspecting ${packageName} release contents...\n`);
    const manifest = readManifest(packageName);
    const tarball = pack(packageName);
    const publishedIntegrity = await registryIntegrity(
      packageName,
      manifest.version,
    );
    if (publishedIntegrity && publishedIntegrity !== tarball.integrity) {
      throw new Error(
        `${packageName}@${manifest.version} already exists with different ` +
          'contents. Bump every public package version before publishing.',
      );
    }
    return {
      packageName,
      version: manifest.version,
      integrity: tarball.integrity,
      alreadyPublished: publishedIntegrity === tarball.integrity,
    };
  }),
);

for (const plan of plans) {
  const label = `${plan.packageName}@${plan.version}`;
  if (plan.alreadyPublished) {
    process.stdout.write(`${label} already matches npm; skipping.\n`);
    continue;
  }
  if (dryRun) {
    process.stdout.write(`${label} would be published.\n`);
    continue;
  }

  runNpm([
    'publish',
    '--workspace',
    plan.packageName,
    '--access',
    'public',
    '--provenance',
  ]);
}

if (dryRun) process.stdout.write('Registry publication plan is valid.\n');

#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import publicPackages from './public-packages.json' with { type: 'json' };
import {
  createPostkitPackageGraph,
  missingPostkitPackageClosure,
} from './yalc-package-closure.mjs';

const require = createRequire(import.meta.url);
const workspaceRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const yalcBin = require.resolve('yalc/src/yalc.js');
const { readInstallationsFile } = require('yalc/src/installations.js');
const command = process.argv[2];
const extraArgs = process.argv.slice(3);

if (command !== 'publish' && command !== 'push') {
  process.stderr.write(
    'Usage: node tools/yalc-public-packages.mjs <publish|push> [yalc options]\n',
  );
  process.exit(1);
}

const packages = publicPackages.map((packageName) => {
  const directoryName = packageName.slice('@postkit/'.length);
  const directory = join(workspaceRoot, 'packages', directoryName);
  const manifestPath = join(directory, 'package.json');
  const entryPath = join(directory, 'dist', 'index.js');

  if (!existsSync(manifestPath)) {
    throw new Error(`Missing package manifest: ${manifestPath}`);
  }

  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  if (manifest.name !== packageName) {
    throw new Error(
      `Expected ${manifestPath} to describe ${packageName}, received ${manifest.name}.`,
    );
  }
  if (manifest.private === true) {
    throw new Error(`${packageName} is marked private.`);
  }
  if (!existsSync(entryPath)) {
    throw new Error(
      `Missing ${entryPath}. Run the root yalc command so the package build completes first.`,
    );
  }

  return { directory, manifest, packageName, version: manifest.version };
});

const packageGraph = createPostkitPackageGraph(packages);

function runYalc(args, workingDir) {
  const result = spawnSync(process.execPath, [yalcBin, ...args], {
    cwd: workingDir,
    env: process.env,
    stdio: 'inherit',
  });

  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

function linkMissingClosure(packageName) {
  const installations = readInstallationsFile();
  const consumers = installations[packageName] ?? [];
  for (const consumerPath of consumers) {
    if (!existsSync(join(consumerPath, 'package.json'))) continue;
    const missing = missingPostkitPackageClosure({
      consumerPath,
      installations,
      packageName,
      packageGraph,
      packageOrder: publicPackages,
    });
    if (missing.length === 0) continue;
    process.stdout.write(
      `Linking ${missing.join(', ')} in ${consumerPath} for ${packageName}...\n`,
    );
    runYalc(
      ['link', '--no-pure', '--no-scripts', '--no-sig', ...missing],
      consumerPath,
    );
  }
}

for (const packageEntry of packages) {
  const action = command === 'push' ? 'Pushing' : 'Publishing';
  process.stdout.write(
    `${action} ${packageEntry.packageName}@${packageEntry.version} with yalc...\n`,
  );

  if (command === 'push') {
    linkMissingClosure(packageEntry.packageName);
  }

  runYalc(
    [command, '--no-scripts', '--no-sig', ...extraArgs],
    packageEntry.directory,
  );
}

process.stdout.write(
  command === 'push'
    ? `Pushed ${packages.length} PostKit packages to registered yalc consumers.\n`
    : `Published ${packages.length} PostKit packages to the local yalc store.\n`,
);

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import publicPackages from './public-packages.json' with { type: 'json' };

const workspaceRoot = fileURLToPath(new URL('../', import.meta.url));
const versions = new Set(
  publicPackages.map((packageName) => {
    const directory = packageName.slice('@postkit/'.length);
    return JSON.parse(
      readFileSync(
        join(workspaceRoot, 'packages', directory, 'package.json'),
        'utf8',
      ),
    ).version;
  }),
);

if (versions.size !== 1) {
  throw new Error('Every public PostKit package must use one release version.');
}

const [version] = versions;
const releaseTag = process.env.RELEASE_TAG;
const requestedVersion = process.env.REQUESTED_VERSION;

if (releaseTag) {
  if (releaseTag !== `v${version}`) {
    throw new Error(
      `Release tag ${releaseTag} must match package version v${version}.`,
    );
  }
} else if (requestedVersion) {
  if (requestedVersion !== version) {
    throw new Error(
      `Requested version ${requestedVersion} must match ${version}.`,
    );
  }
} else {
  throw new Error('A release tag or requested version is required.');
}

if (process.env.GITHUB_ACTIONS === 'true') {
  execFileSync(
    'git',
    [
      'merge-base',
      '--is-ancestor',
      process.env.GITHUB_SHA,
      'refs/remotes/origin/main',
    ],
    { cwd: workspaceRoot, stdio: 'inherit' },
  );
}

process.stdout.write(`Release source and version ${version} are valid.\n`);

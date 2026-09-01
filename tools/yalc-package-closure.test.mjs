import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createPostkitPackageGraph,
  missingPostkitPackageClosure,
  resolvePostkitPackageClosure,
} from './yalc-package-closure.mjs';

const entries = [
  {
    packageName: '@postkit/core',
    manifest: { name: '@postkit/core' },
  },
  {
    packageName: '@postkit/unfurl',
    manifest: { name: '@postkit/unfurl' },
  },
  {
    packageName: '@postkit/react',
    manifest: {
      name: '@postkit/react',
      dependencies: {
        '@postkit/core': '0.1.1',
        '@postkit/unfurl': '0.1.1',
      },
    },
  },
  {
    packageName: '@postkit/next',
    manifest: {
      name: '@postkit/next',
      peerDependencies: { '@postkit/react': '0.1.1' },
    },
  },
];

const graph = createPostkitPackageGraph(entries);
const order = entries.map((entry) => entry.packageName);

test('resolves transitive Postkit dependencies and peers in release order', () => {
  assert.deepEqual(resolvePostkitPackageClosure('@postkit/react', graph), [
    '@postkit/core',
    '@postkit/unfurl',
  ]);
  assert.deepEqual(resolvePostkitPackageClosure('@postkit/next', graph), [
    '@postkit/core',
    '@postkit/unfurl',
    '@postkit/react',
  ]);
});

test('returns only closure packages not already linked to a consumer', () => {
  assert.deepEqual(
    missingPostkitPackageClosure({
      consumerPath: '/consumer',
      installations: {
        '@postkit/core': ['/consumer'],
        '@postkit/react': ['/consumer'],
      },
      packageName: '@postkit/next',
      packageGraph: graph,
      packageOrder: order,
    }),
    ['@postkit/unfurl'],
  );
});

test('rejects unknown and circular package graphs', () => {
  assert.throws(
    () => resolvePostkitPackageClosure('@postkit/missing', graph),
    /Unknown Postkit package/,
  );
  const circular = createPostkitPackageGraph([
    {
      packageName: '@postkit/a',
      manifest: { dependencies: { '@postkit/b': '1.0.0' } },
    },
    {
      packageName: '@postkit/b',
      manifest: { dependencies: { '@postkit/a': '1.0.0' } },
    },
  ]);
  assert.throws(
    () => resolvePostkitPackageClosure('@postkit/a', circular),
    /Circular Postkit package dependency/,
  );
});

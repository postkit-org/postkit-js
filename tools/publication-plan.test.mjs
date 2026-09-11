import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createPublicationPlan } from './publication-plan.mjs';

const packages = ['@postkit/core', '@postkit/react'];
function seams(overrides = {}) {
  return {
    readManifest: () => ({ version: '0.2.0' }),
    pack: (name) => ({ version: '0.2.0', integrity: `hash:${name}` }),
    registryIntegrity: async () => null,
    ...overrides,
  };
}

test('packs every package before starting timed registry requests', async () => {
  const events = [];
  const plan = await createPublicationPlan(
    packages,
    seams({
      pack(name) {
        events.push(`pack:${name}`);
        return { version: '0.2.0', integrity: `hash:${name}` };
      },
      async registryIntegrity(name) {
        events.push(`registry:${name}`);
        return null;
      },
    }),
  );
  assert.deepEqual(events, [
    'pack:@postkit/core',
    'pack:@postkit/react',
    'registry:@postkit/core',
    'registry:@postkit/react',
  ]);
  assert.deepEqual(
    plan.map((entry) => entry.packageName),
    packages,
  );
  assert.ok(plan.every((entry) => entry.alreadyPublished === false));
});

test('supports resuming an identical partial publication', async () => {
  const plan = await createPublicationPlan(
    packages,
    seams({
      registryIntegrity: async (name) =>
        name === packages[0] ? `hash:${name}` : null,
    }),
  );
  assert.deepEqual(
    plan.map((entry) => entry.alreadyPublished),
    [true, false],
  );
});

test('rejects an integrity mismatch before returning any publication plan', async () => {
  await assert.rejects(
    createPublicationPlan(
      packages,
      seams({ registryIntegrity: async () => 'different' }),
    ),
    /different contents/,
  );
});

test('does not contact the registry if local packing fails or changes version', async () => {
  for (const pack of [
    () => {
      throw new Error('pack failed');
    },
    () => ({ version: '0.1.0' }),
  ]) {
    let contacted = false;
    await assert.rejects(
      createPublicationPlan(
        packages,
        seams({
          pack,
          registryIntegrity: async () => {
            contacted = true;
            return null;
          },
        }),
      ),
    );
    assert.equal(contacted, false);
  }
});

test('identifies the package when registry verification fails', async () => {
  const cause = new Error('timeout');
  await assert.rejects(
    createPublicationPlan(
      packages,
      seams({
        registryIntegrity: async () => {
          throw cause;
        },
      }),
    ),
    (error) => {
      assert.match(error.message, /@postkit\/core@0.2.0/);
      assert.equal(error.cause, cause);
      return true;
    },
  );
});

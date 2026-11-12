import { createRequire } from 'node:module';

import {
  compareChangelogVersions,
  getLatestChangelogRelease,
} from './changelog.js';
import { selectVisibleNotes } from './notes.js';

const require = createRequire(import.meta.url);
const buildEnv = require('../../build-env.cjs') as {
  compareVersions(left: string, right: string): number;
  latestReleasedVersion(
    entries: readonly { version: string; status?: string }[],
  ): string;
  hasVisibleNotes(
    notes: readonly { status?: string }[],
    nodeEnv?: string,
  ): boolean;
};

// build-env.cjs repeats these rules for next.config.js, which loads before this library is
// built. These cases keep the two copies in step.
describe('build-env.cjs', () => {
  const versions = [
    '0.1.0',
    '0.2.0-beta.1',
    '0.2.0-beta.10',
    '0.2.0-beta.2',
    '0.2.0',
    '0.3.0',
    '0.10.0',
    '1.0.0-rc.1',
  ];

  it('orders versions as compareChangelogVersions does', () => {
    for (const left of versions) {
      for (const right of versions) {
        expect(Math.sign(buildEnv.compareVersions(left, right))).toBe(
          Math.sign(compareChangelogVersions(left, right)),
        );
      }
    }
  });

  it('picks the latest release as getLatestChangelogRelease does', () => {
    const cases = [
      [
        { version: '0.2.0', status: 'released' as const },
        { version: '0.3.0', status: 'upcoming' as const },
        { version: '0.1.0', status: 'released' as const },
      ],
      [{ version: '0.3.0', status: 'upcoming' as const }],
      [
        { version: '0.10.0', status: 'released' as const },
        { version: '0.9.0', status: 'released' as const },
      ],
      [],
    ];
    for (const entries of cases) {
      expect(buildEnv.latestReleasedVersion(entries)).toBe(
        getLatestChangelogRelease(entries)?.version ?? '',
      );
    }
  });

  it('decides note visibility as selectVisibleNotes does', () => {
    const cases = [
      [{ status: 'draft' as const }],
      [{ status: 'draft' as const }, { status: 'published' as const }],
      [],
    ];
    for (const notes of cases) {
      for (const nodeEnv of ['production', 'development', undefined]) {
        expect(buildEnv.hasVisibleNotes(notes, nodeEnv)).toBe(
          selectVisibleNotes(notes, nodeEnv).length > 0,
        );
      }
    }
  });
});

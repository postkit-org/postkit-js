/**
 * `npm run release:email -- <version> [--create]` (PK-053, 04 §4): renders a release's email
 * from its changelog entry and writes `dist/emails/<version>.html` and `.txt` for review. With
 * `--create`, it also makes a Resend Broadcast draft for the "Postkit releases" audience
 * (`RESEND_API_KEY`, `RESEND_AUDIENCE_ID`). It never sends: review the draft and send it from
 * Resend. An `upcoming` entry is refused.
 *
 * Run through Nx (`nx run site:release-email`), which builds the packages first. The email
 * templates are TSX in `@postkit/site-emails`, so they load through jiti, as the share images do.
 */
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createJiti } from 'jiti';

const siteRoot = fileURLToPath(new URL('../', import.meta.url));
const workspaceRoot = join(siteRoot, '..', '..');

const jiti = createJiti(import.meta.url, { jsx: { runtime: 'automatic' } });
const { parseReleaseEmailArgs, runReleaseEmail } = (await jiti.import(
  '@postkit/site-emails',
)) as typeof import('@postkit/site-emails');

try {
  const args = parseReleaseEmailArgs(process.argv.slice(2));
  await runReleaseEmail({
    ...args,
    contentDirectory: join(workspaceRoot, 'libs', 'content'),
    // `--out` is relative to where npm was run (INIT_CWD), not this target's cwd.
    outDirectory: args.outDirectory
      ? resolve(process.env['INIT_CWD'] ?? workspaceRoot, args.outDirectory)
      : join(workspaceRoot, 'dist', 'emails'),
    siteUrl: process.env['NEXT_PUBLIC_SITE_URL'],
    env: process.env,
    log: (line) => process.stdout.write(`${line}\n`),
  });
} catch (error) {
  process.stderr.write(
    `release:email: ${error instanceof Error ? error.message : String(error)}\n`,
  );
  process.exitCode = 1;
}

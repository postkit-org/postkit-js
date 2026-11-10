import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  changelogEntrySchema,
  type ChangelogEntryData,
} from '@postkit/content';
import { Resend } from 'resend';
import { parse as parseYaml } from 'yaml';

import { EMAIL_FROM } from './constants';
import { renderReleaseEmail, type RenderedReleaseEmail } from './release-email';

/*
 * `npm run release:email -- <version> [--create]` (PK-053, 04 §4). The CLI is
 * `apps/site/scripts/release-email.mts`, run by the site's `release-email` Nx target; this is
 * everything it does, so it can be tested without the CLI.
 */

export interface ReleaseEmailArgs {
  readonly version: string;
  /** Make a Resend Broadcast draft too. It never sends. */
  readonly create: boolean;
  /** Where to write `<version>.html` and `.txt`, when not `dist/emails`. */
  readonly outDirectory?: string;
}

export const RELEASE_EMAIL_USAGE =
  'Usage: npm run release:email -- <version> [--create] [--out <directory>]';

/** Reads `<version> [--create] [--out <directory>]`. Nx may forward `--create=true`. */
export function parseReleaseEmailArgs(
  argv: readonly string[],
): ReleaseEmailArgs {
  let version: string | undefined;
  let create = false;
  let outDirectory: string | undefined;
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--create' || arg === '--create=true') create = true;
    else if (arg === '--create=false') create = false;
    else if (arg === '--out') outDirectory = argv[(index += 1)];
    else if (arg.startsWith('--out=')) outDirectory = arg.slice(6);
    else if (arg.startsWith('-')) {
      throw new TypeError(`Unknown option ${arg}. ${RELEASE_EMAIL_USAGE}`);
    } else if (version === undefined) version = arg;
    else
      throw new TypeError(`Unexpected argument ${arg}. ${RELEASE_EMAIL_USAGE}`);
  }
  if (!version) throw new TypeError(`Which version? ${RELEASE_EMAIL_USAGE}`);
  if (outDirectory === '') {
    throw new TypeError(`--out needs a directory. ${RELEASE_EMAIL_USAGE}`);
  }
  return {
    version: version.replace(/^v/, ''),
    create,
    ...(outDirectory ? { outDirectory } : {}),
  };
}

/** The changelog entry for `version`, validated with the site's own schema. */
export function loadChangelogEntry(
  changelogDirectory: string,
  version: string,
): ChangelogEntryData {
  for (const file of readdirSync(changelogDirectory).sort()) {
    if (!file.endsWith('.md')) continue;
    const source = readFileSync(join(changelogDirectory, file), 'utf8');
    const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(source);
    if (!match) continue;
    const data = parseYaml(match[1]) as Record<string, unknown> | null;
    if (String(data?.['version'] ?? '') !== version) continue;
    const parsed = changelogEntrySchema.safeParse({
      ...data,
      content: source.slice(match[0].length),
    });
    if (!parsed.success) {
      throw new TypeError(`${file}: ${parsed.error.message}`);
    }
    return parsed.data;
  }
  throw new TypeError(`There's no changelog entry for ${version}.`);
}

/** The Broadcast draft `--create` makes. There is no `send`: Ryan sends it from Resend. */
export interface ReleaseBroadcastDraft {
  readonly audienceId: string;
  readonly name: string;
  readonly from: string;
  readonly subject: string;
  readonly previewText: string;
  readonly html: string;
  readonly text: string;
}

export type CreateReleaseBroadcast = (
  draft: ReleaseBroadcastDraft,
  apiKey: string,
) => Promise<{ readonly id: string }>;

/** Creates the draft with the `resend` SDK. `segmentId` is Resend's current name for an audience. */
export const createResendBroadcastDraft: CreateReleaseBroadcast = async (
  draft,
  apiKey,
) => {
  const resend = new Resend(apiKey);
  const { data, error } = await resend.broadcasts.create({
    segmentId: draft.audienceId,
    name: draft.name,
    from: draft.from,
    subject: draft.subject,
    previewText: draft.previewText,
    html: draft.html,
    text: draft.text,
  });
  if (error || !data) {
    throw new Error(
      `Resend couldn't create the Broadcast draft: ${error?.message ?? 'no response'}`,
    );
  }
  return { id: data.id };
};

export interface RunReleaseEmailOptions extends ReleaseEmailArgs {
  /** `libs/content`. */
  readonly contentDirectory: string;
  /** Where the files go: `dist/emails` at the workspace root. */
  readonly outDirectory: string;
  /** `NEXT_PUBLIC_SITE_URL`, else `https://postkit.org`. */
  readonly siteUrl?: string;
  /** `RESEND_API_KEY` and `RESEND_AUDIENCE_ID` for `--create`. */
  readonly env?: Readonly<Record<string, string | undefined>>;
  /** Replaces the Resend call, for tests. */
  readonly createBroadcast?: CreateReleaseBroadcast;
  readonly log?: (line: string) => void;
}

export interface ReleaseEmailRun {
  readonly email: RenderedReleaseEmail;
  readonly htmlPath: string;
  readonly textPath: string;
  /** The Broadcast draft's id, with `--create`. */
  readonly broadcastId?: string;
}

/**
 * Loads the entry (refusing `status: upcoming`), renders the release email, writes
 * `<version>.html` and `.txt` for review, and with `create` makes a Resend Broadcast draft
 * for the audience. It never sends (04 §4).
 */
export async function runReleaseEmail(
  options: RunReleaseEmailOptions,
): Promise<ReleaseEmailRun> {
  const log = options.log ?? (() => undefined);
  const env = options.env ?? {};
  const apiKey = env['RESEND_API_KEY']?.trim();
  const audienceId = env['RESEND_AUDIENCE_ID']?.trim();
  if (options.create && (!apiKey || !audienceId)) {
    throw new Error(
      '--create needs RESEND_API_KEY and RESEND_AUDIENCE_ID. Nothing was written or created.',
    );
  }

  const entry = loadChangelogEntry(
    join(options.contentDirectory, 'changelog'),
    options.version,
  );
  if (entry.status === 'upcoming') {
    throw new Error(
      `${entry.version} is upcoming. Release emails only go out for released entries; set its status to released first.`,
    );
  }

  const email = await renderReleaseEmail(entry, { siteUrl: options.siteUrl });
  for (const warning of email.warnings) {
    log(`warning (${warning.code}): ${warning.message}`);
  }

  mkdirSync(options.outDirectory, { recursive: true });
  const htmlPath = join(options.outDirectory, `${entry.version}.html`);
  const textPath = join(options.outDirectory, `${entry.version}.txt`);
  writeFileSync(htmlPath, email.html);
  writeFileSync(textPath, email.text);
  log(`Subject: ${email.subject}`);
  log(`Wrote ${htmlPath}`);
  log(`Wrote ${textPath}`);

  if (!options.create || !apiKey || !audienceId) {
    return { email, htmlPath, textPath };
  }
  const { id } = await (options.createBroadcast ?? createResendBroadcastDraft)(
    {
      audienceId,
      name: `Postkit ${entry.version}`,
      from: EMAIL_FROM,
      subject: email.subject,
      previewText: email.preheader,
      html: email.html,
      text: email.text,
    },
    apiKey,
  );
  log(
    `Created Resend Broadcast draft ${id}. Review it and send it from Resend.`,
  );
  return { email, htmlPath, textPath, broadcastId: id };
}

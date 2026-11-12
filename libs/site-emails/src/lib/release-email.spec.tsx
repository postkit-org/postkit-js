import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { EMAIL_FROM, POSTAL_ADDRESS_LINES } from './constants';
import {
  RELEASE_ADDED_LIMIT,
  releaseUnsubscribeUrl,
  RESEND_UNSUBSCRIBE_URL,
} from './release-email';
import {
  parseReleaseEmailArgs,
  runReleaseEmail,
  type CreateReleaseBroadcast,
} from './release-email-run';

const contentDirectory = fileURLToPath(
  new URL('../../../content', import.meta.url),
);

const directories: string[] = [];
function outDirectory(): string {
  const directory = mkdtempSync(join(tmpdir(), 'postkit-release-email-'));
  directories.push(directory);
  return directory;
}

afterEach(() => {
  for (const directory of directories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe('release:email (PK-053, 04 §4)', () => {
  it('renders 0.2.0 to dist files without --create, with no warnings', async () => {
    const out = outDirectory();
    const lines: string[] = [];
    const run = await runReleaseEmail({
      version: '0.2.0',
      create: false,
      contentDirectory,
      outDirectory: out,
      log: (line) => lines.push(line),
    });

    expect(run.broadcastId).toBeUndefined();
    expect(run.email.warnings).toEqual([]);
    expect(run.htmlPath).toBe(join(out, '0.2.0.html'));
    expect(run.textPath).toBe(join(out, '0.2.0.txt'));
    const html = readFileSync(run.htmlPath, 'utf8');
    const text = readFileSync(run.textPath, 'utf8');
    expect(html).toBe(run.email.html);
    expect(text).toBe(run.email.text);
    expect(lines).toContain(`Wrote ${run.htmlPath}`);

    const { email } = run;
    expect(email.from).toBe(EMAIL_FROM);
    expect(email.subject).toBe(
      'Postkit 0.2.0: Portable documents, host-native Chakra and email',
    );
    expect(email.preheader).toMatch(/^Postkit 0.2.0 adds portable document/);
    expect(email.webUrl).toBe('https://postkit.org/changelog/0-2-0');

    // The board's parts, in order (EmailRelease).
    const order = [
      'Release · September 3, 2026',
      'Postkit 0.2.0.',
      'Portable documents, host-native Chakra and email.',
      'data-postkit-component="Callout"',
      '>Added</h2>',
      '>Upgrading</h2>',
      '<pre',
      'Read the full release notes',
      'Packages:',
    ].map((part) => html.indexOf(part));
    expect(order.every((index) => index >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);

    // "Added" keeps its first four items; "Upgrading" the first code block and its lead.
    expect(html.match(/>•<\/td>/g)).toHaveLength(RELEASE_ADDED_LIMIT);
    expect(html).toContain('@postkit/shiki');
    expect(html).not.toContain('Closure-aware yalc tooling');
    expect(html).toContain('Remove the <code');
    expect(html).not.toContain('postkitDefaultTheme');
    expect(html).not.toContain('>Changed</h2>');
    expect(html).toMatch(
      /Packages:[\s\S]*@postkit\/core[\s\S]*@postkit\/react[\s\S]*@postkit\/email[\s\S]*@postkit\/shiki/,
    );

    // Footer: Unsubscribe (the contact's token, filled in by Resend), the web, Privacy.
    expect(html).toContain(
      'href="https://postkit.org/newsletter/unsubscribe?token={{{contact.unsubscribe_token}}}"',
    );
    expect(html).toContain('>Read on the web</a>');
    expect(html).toContain('href="https://postkit.org/privacy"');
    expect(html).toContain(POSTAL_ADDRESS_LINES[1]);
    expect(html).not.toContain('<img');
    expect(html).not.toContain('var(');

    expect(text).toContain('Postkit 0.2.0. Portable documents');
    expect(text).toContain(
      'Added\n\n- @postkit/core, with a versioned document model',
    );
    expect(text).toContain(
      'Read the full release notes: https://postkit.org/changelog/0-2-0',
    );
    expect(text).toContain(
      'Unsubscribe: https://postkit.org/newsletter/unsubscribe?token={{{contact.unsubscribe_token}}}',
    );
  });

  it('refuses an upcoming entry', async () => {
    await expect(
      runReleaseEmail({
        version: '0.3.0',
        create: false,
        contentDirectory,
        outDirectory: outDirectory(),
      }),
    ).rejects.toThrow('0.3.0 is upcoming');
  });

  it('refuses a version with no entry', async () => {
    await expect(
      runReleaseEmail({
        version: '9.9.9',
        create: false,
        contentDirectory,
        outDirectory: outDirectory(),
      }),
    ).rejects.toThrow("There's no changelog entry for 9.9.9.");
  });

  it('makes a Broadcast draft with --create, only with Resend credentials', async () => {
    const createBroadcast = vi.fn<CreateReleaseBroadcast>(async () => ({
      id: 'broadcast_123',
    }));
    await expect(
      runReleaseEmail({
        version: '0.2.0',
        create: true,
        contentDirectory,
        outDirectory: outDirectory(),
        env: { RESEND_API_KEY: 're_test' },
        createBroadcast,
      }),
    ).rejects.toThrow('--create needs RESEND_API_KEY and RESEND_AUDIENCE_ID');
    expect(createBroadcast).not.toHaveBeenCalled();

    const run = await runReleaseEmail({
      version: '0.2.0',
      create: true,
      contentDirectory,
      outDirectory: outDirectory(),
      env: { RESEND_API_KEY: 're_test', RESEND_AUDIENCE_ID: 'aud_123' },
      createBroadcast,
    });
    expect(run.broadcastId).toBe('broadcast_123');
    expect(createBroadcast).toHaveBeenCalledWith(
      expect.objectContaining({
        audienceId: 'aud_123',
        from: EMAIL_FROM,
        subject: run.email.subject,
        previewText: run.email.preheader,
        html: run.email.html,
        text: run.email.text,
      }),
      're_test',
    );
    // A draft: nothing asks Resend to send it.
    expect(createBroadcast.mock.calls[0][0]).not.toHaveProperty('send');
  });

  it('reads the CLI arguments', () => {
    expect(parseReleaseEmailArgs(['0.2.0'])).toEqual({
      version: '0.2.0',
      create: false,
    });
    expect(parseReleaseEmailArgs(['v0.3.0', '--create'])).toEqual({
      version: '0.3.0',
      create: true,
    });
    expect(
      parseReleaseEmailArgs(['--create=true', '0.3.0', '--out', 'tmp']),
    ).toEqual({ version: '0.3.0', create: true, outDirectory: 'tmp' });
    expect(() => parseReleaseEmailArgs([])).toThrow('Which version?');
    expect(() => parseReleaseEmailArgs(['0.2.0', '--send'])).toThrow(
      'Unknown option --send',
    );
  });

  it('documents the unsubscribe fallback', () => {
    expect(releaseUnsubscribeUrl('https://preview.postkit.org/')).toBe(
      'https://preview.postkit.org/newsletter/unsubscribe?token={{{contact.unsubscribe_token}}}',
    );
    expect(RESEND_UNSUBSCRIBE_URL).toBe('{{{RESEND_UNSUBSCRIBE_URL}}}');
  });
});

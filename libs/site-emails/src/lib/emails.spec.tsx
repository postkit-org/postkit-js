import {
  POSTAL_ADDRESS,
  renderAlreadySubscribedEmail,
  renderConfirmEmail,
} from '../index';

const SITE_URL = 'https://postkit.org';
const CONFIRM_TOKEN = 'confirm-token_ABC';
const UNSUBSCRIBE_TOKEN = 'unsubscribe-token_XYZ';

/** Chakra-style token names that would mean a colour or size didn't resolve. */
const UNRESOLVED_TOKEN =
  /:\s*(?:bg|fg|border|accent|gray|green|blue|purple|yellow|red|brand)\.[a-z0-9]+/i;

/** Anything that looks like a tracking pixel: a tiny or hidden image, or any image at all. */
const IMAGE = /<img\b/i;

describe('renderConfirmEmail', () => {
  it('matches the EmailConfirm board', async () => {
    const email = await renderConfirmEmail({
      token: CONFIRM_TOKEN,
      siteUrl: SITE_URL,
    });
    expect(email.html).toMatchSnapshot();
  });

  it('has the subject, sender, preheader and confirm link', async () => {
    const email = await renderConfirmEmail({
      token: CONFIRM_TOKEN,
      siteUrl: `${SITE_URL}/`,
    });
    expect(email.from).toBe('Postkit <releases@postkit.org>');
    expect(email.subject).toBe('Confirm your Postkit release emails');
    expect(email.html).toContain(
      'One click and you’ll get an email each time Postkit ships.',
    );
    expect(email.html).toContain(
      `href="https://postkit.org/api/newsletter/confirm?token=${CONFIRM_TOKEN}"`,
    );
    expect(email.html).toContain('Confirm subscription');
    expect(email.headers).toEqual({});
  });

  it('links only to Privacy in the footer', async () => {
    const email = await renderConfirmEmail({ token: CONFIRM_TOKEN });
    expect(email.html).toContain('href="https://postkit.org/privacy"');
    expect(email.html).not.toMatch(/unsubscribe/i);
  });

  it('ships a hand-written plain-text part', async () => {
    const email = await renderConfirmEmail({ token: CONFIRM_TOKEN });
    expect(email.text).toMatchSnapshot();
    expect(email.text).toContain(
      `https://postkit.org/api/newsletter/confirm?token=${CONFIRM_TOKEN}`,
    );
    expect(email.text).toContain('The link works for 7 days.');
    expect(email.text).toContain(POSTAL_ADDRESS);
    expect(email.text).not.toMatch(/<[a-z]/i);
  });

  it('uses preview origins for links', async () => {
    const email = await renderConfirmEmail({
      token: CONFIRM_TOKEN,
      siteUrl: 'https://postkit-git-branch.vercel.app',
    });
    expect(email.html).toContain(
      'https://postkit-git-branch.vercel.app/api/newsletter/confirm?token=',
    );
  });
});

describe('renderAlreadySubscribedEmail', () => {
  it('uses the confirm layout with no button', async () => {
    const email = await renderAlreadySubscribedEmail({
      unsubscribeToken: UNSUBSCRIBE_TOKEN,
      siteUrl: SITE_URL,
    });
    expect(email.html).toMatchSnapshot();
    expect(email.subject).toBe(
      'You’re already getting Postkit release emails',
    );
    expect(email.html).toContain('You’re already on the list.');
    expect(email.html).toContain(
      'Nothing to do. The next email comes with the next release.',
    );
    expect(email.html).not.toContain('Confirm subscription');
    expect(email.html).not.toContain('/api/newsletter/confirm');
  });

  it('links to Unsubscribe and Privacy, in that order', async () => {
    const email = await renderAlreadySubscribedEmail({
      unsubscribeToken: UNSUBSCRIBE_TOKEN,
    });
    const unsubscribe = email.html.indexOf(
      `href="https://postkit.org/newsletter/unsubscribe?token=${UNSUBSCRIBE_TOKEN}"`,
    );
    const privacy = email.html.indexOf('href="https://postkit.org/privacy"');
    expect(unsubscribe).toBeGreaterThan(-1);
    expect(privacy).toBeGreaterThan(unsubscribe);
  });

  it('sends RFC 8058 one-click unsubscribe headers', async () => {
    const email = await renderAlreadySubscribedEmail({
      unsubscribeToken: UNSUBSCRIBE_TOKEN,
    });
    expect(email.headers).toEqual({
      'List-Unsubscribe': `<https://postkit.org/api/newsletter/unsubscribe?token=${UNSUBSCRIBE_TOKEN}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    });
  });

  it('ships a hand-written plain-text part', async () => {
    const email = await renderAlreadySubscribedEmail({
      unsubscribeToken: UNSUBSCRIBE_TOKEN,
    });
    expect(email.text).toMatchSnapshot();
    expect(email.text).toContain(
      `Unsubscribe: https://postkit.org/newsletter/unsubscribe?token=${UNSUBSCRIBE_TOKEN}`,
    );
    expect(email.text).toContain(POSTAL_ADDRESS);
  });
});

describe('both emails', () => {
  const render = () =>
    Promise.all([
      renderConfirmEmail({ token: CONFIRM_TOKEN }),
      renderAlreadySubscribedEmail({ unsubscribeToken: UNSUBSCRIBE_TOKEN }),
    ]);

  it('have no tracking pixel and no rewritten links', async () => {
    for (const email of await render()) {
      expect(email.html).not.toMatch(IMAGE);
      const hrefs = [...email.html.matchAll(/href="([^"]*)"/g)].map(
        (match) => match[1],
      );
      expect(hrefs.length).toBeGreaterThan(0);
      for (const href of hrefs) {
        expect(href.startsWith('https://postkit.org/')).toBe(true);
      }
    }
  });

  it('carry the real postal address, never the placeholder', async () => {
    for (const email of await render()) {
      expect(email.html).not.toContain('[Postal address]');
      expect(email.text).not.toContain('[Postal address]');
      const visibleText = email.html.replace(/<[^>]+>/g, '');
      expect(visibleText).toContain(
        `Postkit, by Commune Software · ${POSTAL_ADDRESS}`,
      );
      expect(email.html).toContain('PMB 980007');
    }
  });

  it('resolve every theme token to a value', async () => {
    for (const email of await render()) {
      expect(email.html).not.toMatch(UNRESOLVED_TOKEN);
      // bg.subtle page, white card, fg text: the site's light tokens.
      expect(email.html).toContain('#F5F5F4');
      expect(email.html).toContain('#FFFFFF');
      expect(email.html).toContain('#1D1D1F');
    }
  });

  it('are light only and 600px wide', async () => {
    for (const email of await render()) {
      expect(email.html).toContain('content="light only"');
      expect(email.html).toContain('width="600"');
      expect(email.html).not.toMatch(/prefers-color-scheme/);
    }
  });
});

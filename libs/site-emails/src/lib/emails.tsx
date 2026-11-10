import { Button, render, Section } from '@chakra-email/core';

import {
  EMAIL_FROM,
  FOOTER_REASON,
  FOOTER_SIGNATURE,
  newsletterUrls,
} from './constants';
import {
  EmailLayout,
  EmailNote,
  EmailParagraph,
  EmailTitle,
  type FooterLink,
} from './layout';

/** A rendered email, ready for Resend: HTML and a hand-written plain-text part. */
export interface RenderedEmail {
  readonly from: string;
  readonly subject: string;
  readonly preheader: string;
  readonly html: string;
  readonly text: string;
  /** Extra headers (`List-Unsubscribe` on the already-subscribed email). */
  readonly headers: Readonly<Record<string, string>>;
}

export interface ConfirmEmailOptions {
  /** The sealed `confirm` token (`@postkit/site-newsletter`). */
  readonly token: string;
  /** The origin for links; `NEXT_PUBLIC_SITE_URL`, else `https://postkit.org`. */
  readonly siteUrl?: string;
}

export interface AlreadySubscribedEmailOptions {
  /** A sealed `unsubscribe` token for the footer link and `List-Unsubscribe`. */
  readonly unsubscribeToken: string;
  readonly siteUrl?: string;
}

export const CONFIRM_SUBJECT = 'Confirm your Postkit release emails';
export const CONFIRM_PREHEADER =
  'One click and you’ll get an email each time Postkit ships.';

export const ALREADY_SUBSCRIBED_SUBJECT =
  'You’re already getting Postkit release emails';
export const ALREADY_SUBSCRIBED_PREHEADER =
  'Nothing to do. The next email comes with the next release.';

const CONFIRM_TITLE = 'Confirm your email';
const CONFIRM_BODY =
  'Click below and you’ll get one email each time Postkit ships a release. Nothing else.';
const CONFIRM_BUTTON = 'Confirm subscription';
const CONFIRM_NOTE =
  'The link works for 7 days. If you didn’t ask for this, ignore this email and nothing happens.';

const ALREADY_TITLE = 'You’re already on the list.';
const ALREADY_BODY =
  'Nothing to do. The next email comes with the next release.';

/** The plain-text footer, matching the HTML one. */
function textFooter(links: readonly FooterLink[]): string {
  return [
    '--',
    FOOTER_REASON,
    ...links.map((link) => `${link.label}: ${link.href}`),
    FOOTER_SIGNATURE,
  ].join('\n');
}

/**
 * "Confirm your email" (EmailConfirm board, 04 §3). The footer links only to Privacy: the
 * reader isn't subscribed yet, so there's nothing to unsubscribe from.
 */
export async function renderConfirmEmail({
  token,
  siteUrl,
}: ConfirmEmailOptions): Promise<RenderedEmail> {
  const urls = newsletterUrls(siteUrl);
  const confirmUrl = urls.confirm(token);
  const footerLinks: FooterLink[] = [{ label: 'Privacy', href: urls.privacy }];

  const html = await render(
    <EmailLayout
      title={CONFIRM_SUBJECT}
      preheader={CONFIRM_PREHEADER}
      homeUrl={urls.home}
      footerLinks={footerLinks}
    >
      <EmailTitle>{CONFIRM_TITLE}</EmailTitle>
      <EmailParagraph>{CONFIRM_BODY}</EmailParagraph>
      {/* Chakra Email's Button is an `align="left"` table, which floats: the section's cell
          contains it, so the note below starts on its own line. */}
      <Section mt="28px">
        <Button
          href={confirmUrl}
          px="24px"
          py="14px"
          bg="bg.inverted"
          color="fg.inverted"
          rounded="full"
          fontSize="15px"
          fontWeight="medium"
          lineHeight="1.2"
        >
          {CONFIRM_BUTTON}
        </Button>
      </Section>
      <EmailNote>{CONFIRM_NOTE}</EmailNote>
    </EmailLayout>,
  );

  const text = [
    CONFIRM_TITLE,
    '',
    'Open the link below and you’ll get one email each time Postkit ships a release. Nothing else.',
    '',
    `${CONFIRM_BUTTON}: ${confirmUrl}`,
    '',
    CONFIRM_NOTE,
    '',
    textFooter(footerLinks),
    '',
  ].join('\n');

  return {
    from: EMAIL_FROM,
    subject: CONFIRM_SUBJECT,
    preheader: CONFIRM_PREHEADER,
    html,
    text,
    headers: {},
  };
}

/**
 * "You're already on the list" (04 §1, §3): the confirm layout with no button, sent instead
 * of the confirmation when the address is already subscribed. It carries an Unsubscribe link
 * and RFC 8058 `List-Unsubscribe` headers, so mail clients show their own button.
 */
export async function renderAlreadySubscribedEmail({
  unsubscribeToken,
  siteUrl,
}: AlreadySubscribedEmailOptions): Promise<RenderedEmail> {
  const urls = newsletterUrls(siteUrl);
  const footerLinks: FooterLink[] = [
    { label: 'Unsubscribe', href: urls.unsubscribePage(unsubscribeToken) },
    { label: 'Privacy', href: urls.privacy },
  ];

  const html = await render(
    <EmailLayout
      title={ALREADY_SUBSCRIBED_SUBJECT}
      preheader={ALREADY_SUBSCRIBED_PREHEADER}
      homeUrl={urls.home}
      footerLinks={footerLinks}
    >
      <EmailTitle>{ALREADY_TITLE}</EmailTitle>
      <EmailParagraph>{ALREADY_BODY}</EmailParagraph>
    </EmailLayout>,
  );

  const text = [
    ALREADY_TITLE,
    '',
    ALREADY_BODY,
    '',
    textFooter(footerLinks),
    '',
  ].join('\n');

  return {
    from: EMAIL_FROM,
    subject: ALREADY_SUBSCRIBED_SUBJECT,
    preheader: ALREADY_SUBSCRIBED_PREHEADER,
    html,
    text,
    headers: {
      'List-Unsubscribe': `<${urls.unsubscribeOneClick(unsubscribeToken)}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    },
  };
}

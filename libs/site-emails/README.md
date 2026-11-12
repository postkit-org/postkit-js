# @postkit/site-emails

postkit.org's transactional emails (PK-052, `docs/design/handoff/specs/04-emails.md` §3), built
with `@postkit/email` and Chakra Email:

- `renderConfirmEmail({ token, siteUrl })`: "Confirm your email" (EmailConfirm board).
- `renderAlreadySubscribedEmail({ unsubscribeToken, siteUrl })`: the same layout with no button,
  an Unsubscribe link, and `List-Unsubscribe` / `List-Unsubscribe-Post` headers.

Each returns `{ from, subject, preheader, html, text, headers }`, with a hand-written plain-text
part. Light only, 600px wide. The theme maps `@postkit/site-theme`'s raw `tokens` into Chakra
Email's format (`emailTheme`); it doesn't import the site's Chakra system. `@postkit/email`
ships its own light tone colours; `emailToneColors` swaps in the site's tones on the same
`tone.*` / `tint.*` keys, so callouts match the site (the home page's Email tab uses it too).

## Release email (PK-053, 04 §3–§4)

- `renderReleaseEmail(entry, { siteUrl, unsubscribeUrl })`: the EmailRelease board, built from
  a changelog entry with `@postkit/email`'s `renderEmail` and this layout as its wrapper. The
  body is the first warning callout, "Added" (first four items) and "Upgrading" (the first code
  block and its lead); then "Read the full release notes" and the packages the entry names.
  Its `text` is `renderEmail`'s plain text with the same header and footer.
- The footer's Unsubscribe link is
  `https://postkit.org/newsletter/unsubscribe?token={{{contact.unsubscribe_token}}}`
  (`releaseUnsubscribeUrl`): Resend fills in the contact's `unsubscribe_token`. If Broadcasts
  don't render custom contact properties (PK-050), pass `RESEND_UNSUBSCRIBE_URL`
  (`{{{RESEND_UNSUBSCRIBE_URL}}}`, Resend's hosted page) as `unsubscribeUrl` instead.
- `runReleaseEmail` is the script: it loads the entry (refusing `status: upcoming`), writes
  `dist/emails/<version>.html` and `.txt`, and with `create` makes a Resend Broadcast **draft**
  (`RESEND_API_KEY`, `RESEND_AUDIENCE_ID`). It never sends.

```sh
npm run release:email -- 0.2.0            # writes dist/emails/0.2.0.html and .txt
npm run release:email -- 0.3.0 --create   # …and a Broadcast draft to review and send in Resend
```

The root script runs the site's `release-email` Nx target (`apps/site/scripts/release-email.mts`).

Run `nx test site-emails` (HTML snapshots, plain text, no images or tracking, the postal address).

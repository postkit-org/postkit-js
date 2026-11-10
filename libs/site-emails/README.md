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

Run `nx test site-emails` (HTML snapshots, plain text, no images or tracking, the postal address).

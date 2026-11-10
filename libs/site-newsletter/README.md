# @postkit/site-newsletter

The postkit.org release-email API (PK-050, `docs/design/handoff/specs/04-emails.md` §1): sealed
tokens, the subscribe, confirm and unsubscribe handlers, the in-memory abuse limits and the
Resend provider. `apps/site/src/pages/api/newsletter/*` are thin adapters over it.

- **Tokens** (`tokens.ts`): `base64url(nonce ‖ ciphertext ‖ tag)`, AES-256-GCM keyed by
  `SUBSCRIBE_SECRET` with the purpose (`confirm` or `unsubscribe`) as associated data. Confirm
  tokens last 7 days; unsubscribe tokens never expire.
- **Handlers** (`handlers.ts`): framework-neutral, and given a `NewsletterProvider`, so tests run
  against an in-memory fake (`src/testing`, never exported).
- **Limits** (`rate-limit.ts`): 3 subscribe requests per address and 20 per IP, per hour, in
  memory. They're per instance, not global on serverless.
- **Logging:** none. Provider failures surface as `NewsletterProviderError`, which carries the
  operation, Resend's error name and the status, never an address.

Run `nx test site-newsletter`.

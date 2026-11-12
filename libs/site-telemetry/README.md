# @postkit/site-telemetry

Privacy scrubbing shared by postkit.org's Sentry and Fathom setup (PK-004). It has no
dependencies, so it's unit-tested without either SDK.

- `scrubSentryEvent` and `scrubSentryBreadcrumb` deep-copy a Sentry event or breadcrumb.
  They redact email addresses (plain, `%40`-encoded, or masked like `r…@example.com`) in
  every string and key, drop `token` query parameters from every URL and query string, and
  replace any value under a `token` key.
- `cleanAnalyticsUrl` is the URL Fathom records: no `token`, no address, no fragment.
- `redactEmails`, `stripTokenParams` and `scrubText` are the string-level pieces.

Run `npm run site:typecheck` (typecheck, test and lint for the site libraries).

# 09 — Open questions, placeholders and facts to keep true

## Open questions for Ryan

Each one has a default, so work can continue. The agent should bring these back rather than guess beyond the default.

| # | Question | Default until answered | Blocks |
|---|---|---|---|
| Q1 | **Queue for subscribe emails?** Your rule is to queue external work. The confirm email is one Resend call while the reader waits for the form's result. | Send inline with an idempotency key, and show the error state on failure (04 §1). If you want it queued, Upstash QStash works on Vercel, and the Privacy page would need to name it. | PK-050 |
| Q2 | ~~Launch before or with 0.3.0?~~ **Decided 10 Nov 2026: with 0.3.0.** Everything in 03 §8 ships in 0.3.0, and the site launches the same day (03 D19). | — | PK-072 |
| Q3 | **Link previews on the site.** `LinkPreview` uses `@postkit/unfurl`, which sends URLs to a provider. | Resolve at build time only, so no reader data goes anywhere and the Privacy page stays true. | PK-037, PK-039 |
| Q4 | **Suisse Int'l delivery:** self-hosted files or a Fontstack kit? | Inter Tight until the files arrive. | PK-003 |
| Q5 | ~~**Postal address** for the email footers~~ **Answered 10 Nov 2026:** 1870 The Exchange SE Ste 220, PMB 980007, Atlanta, GA 30339-2171 | — | PK-052 |
| Q6 | **Which notes exist at launch?** The index board shows five proposed titles (below). | Launch with "One article, four renderers" and the 0.3.0 release note. The rest are drafts. | PK-021, PK-036 |
| Q7 | **Share images:** is OpenGraphs ready to render these templates? | `@vercel/og` at build time, with the same layout. | PK-061 |
| Q8 | **Postkit's social accounts:** Bluesky and X handles for the footer and the menu. | Hide any link without a confirmed URL. | PK-012 |
| Q9 | **Sender address** for release emails. | `Postkit <releases@postkit.org>` | PK-052 |

## Placeholders in the boards

| Where | Placeholder | Fill with |
|---|---|---|
| Privacy, Licensing, notes, article | `[DATE]` | Real dates (git date for Privacy and Licensing; frontmatter for notes) |
| Privacy, unsubscribe page (Bad link, 04 §1a) | `[contact address]` | `hello@postkit.org` as a `mailto:` link (decided 10 Nov 2026) |
| EmailConfirm, EmailRelease | `[Postal address]` | 1870 The Exchange SE Ste 220, PMB 980007, Atlanta, GA 30339-2171 (Q5) |
| Article | `[The lead image's caption.]`, `[Next note's title]` | From the note's frontmatter and the next note |
| Home renderer panel | `[A caption under the image it describes.]` | Demo content: write a real caption for the demo figure |
| Notes index | Five titles and dates | Q6. The proposed titles: "Postkit 0.3: bring your own design system", "Footnotes that survive the newsletter", "Styling Postkit with Tailwind", "How the Commune site uses Postkit", "Why the contract stays upstream when you eject" |
| Code samples | `[slug]`, `[article]` | Literal route parameters in example code; leave them |
| Home stats and hero | "32 more", "35 components", "six kits", "3 renderers" | From the manifest at build time (08 rule 7) |

## Copy changes since the boards

These override the board copy. The canvas boards still need the same edit, and the exported mockups and renders still show the old text.

| Board | Change | Why |
|---|---|---|
| SitePrivacy, PhonePrivacy | Add a fourth "What we collect" item after the Sentry line: "✓ Standard request logs at our host, Vercel: the page asked for, your browser and your IP address. They're kept briefly, for security and to fix problems, and never used for anything else." | Vercel logs every request, so without this line the page leaves something out. Release-email addresses never reach these logs (04 §1, sealed tokens) |

## Facts the copy depends on (keep them true)

| Claim (board) | What makes it true | Check |
|---|---|---|
| "Postkit's packages collect nothing and never phone home" (Privacy) | No telemetry in any package. `@postkit/unfurl` calls a provider only when the host configures one. | `git grep` for fetch, beacon or analytics in `packages/*/src` before each release |
| "Standard request logs at our host, Vercel … kept briefly" (Privacy) | Default Vercel log retention; no log drain sends logs anywhere else. Email addresses never appear in URLs (sealed tokens), and the API never logs them | Vercel project settings: no log drains; grep the subscribe routes for logging |
| "To ask anything, or to have your email deleted, write to hello@postkit.org" (Privacy) | `postkit.org` receives mail (MX records), and someone reads `hello@postkit.org`. A deletion request removes the contact from the Resend audience entirely, not just unsubscribes it | Send a test message; delete a test contact |
| Search (no claim on the Privacy page) | `/api/search` keeps no query history; queries appear only in Vercel's standard request log, which the hosting-logs line covers | Grep the search route for logging |
| "No cookies" (Privacy) | The theme choice is in `localStorage`; Fathom is cookie-free; no other storage. | Browser devtools on production: no cookies set |
| "Error reports … with IP addresses removed" (Privacy) | Sentry `sendDefaultPii: false`, plus the project setting "Prevent storing of IP addresses" | Sentry event JSON shows no IP |
| "No tracking pixels" (Privacy) | Resend open and click tracking off | Raw email source has no pixel and no rewritten links |
| "Every email has a one-click unsubscribe" (Privacy, about release emails) | The already-subscribed and release emails link to `/newsletter/unsubscribe`, which works in one click, and carry `List-Unsubscribe` headers (04 §1a, §4) | Gmail shows the unsubscribe button on a test send of both |
| "Embeds wait for a click" (component copy) | `SocialPost` `activation` defaults to `'click'`, and the site doesn't override it | Component config in `apps/site` |
| "35 components in six kits", "3 renderers" (Home) | Counted from the manifest at build time | Never hard-coded |
| "Copyright (c) 2026 Postkit" (Licensing) | The repo's LICENSE | Matches the file |
| Made with OSS list | `apps/site/package.json` and the package dependencies | The launch checklist compares them |
| next-meta, react-fathom, react-structured and Sentry on Made with OSS | Wired in PK-004 | Remove any that end up unused |

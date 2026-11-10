# 07 — Acceptance and test plan

## 1. Per-ticket bar

Every ticket, before it's marked done:

1. `npm run site:check` (lint and build), plus `nx typecheck <project>` for any touched private library (`site-theme`, `site-emails`). Package tickets also run `npm run check`.
2. **Visual:** the page matches its boards at 1440 and 390 in light. If a `*Dark` board exists, it matches that too; otherwise it looks right in dark. There's no horizontal overflow at 320. Differences are listed in the PR description.
3. **Keyboard:** every control can be reached, and focus is visible and in a sensible order.
4. axe-core reports no violations (Playwright plus `@axe-core/playwright`) in both themes.
5. No placeholders shipped: no `[Bracketed]` text from the boards, and no `[DATE]`.
6. No hard-coded colours outside `libs/site-theme`.

## 2. Automated tests

| Area | Test |
|---|---|
| Content | Zod schemas reject a bad category, date or status. Draft docs and notes don't appear in production routes, search, feeds or the sitemap. `upcoming` changelog entries appear on the site and in search but not in feeds or emails. |
| Redirects | Every `permanent` entry in `content/redirects.json` returns 308, and `/docs` returns 307, to a page that exists. |
| Search | Index build is deterministic; "callout" puts Callout first; "accordion" finds Disclosure (synonym); "timeline" gives no results and three suggestions; the index stays under 300 KB gzipped. |
| Subscribe API | Valid request → 202, one email to the fake Resend. An existing address → 202, the "already subscribed" email, and an identical response body. Bad email → 400. Rate limit → 429. Tampered token → `/newsletter/subscribe?status=expired`. A token 7 days and 1 second old → expired. No token decodes to anything readable without the key, and no address appears in any URL the API redirects to or emails out (apart from the masked fragment). Confirm twice → one contact. Unsubscribe token → 200 and the contact is unsubscribed; again → 200, no change; a tampered token or a confirm token → 400; a one-click POST (`List-Unsubscribe=One-Click` body) → 200; loading `/newsletter/unsubscribe` with JavaScript off changes nothing until the form is posted. |
| Emails | Snapshots of the confirm, already-subscribed and release HTML. The plain-text parts exist. No tracking pixel or link rewriting. The already-subscribed email and the release draft carry an Unsubscribe link; the already-subscribed email has `List-Unsubscribe` and `List-Unsubscribe-Post` headers. No `token` value appears in Sentry events or Fathom pageviews. |
| Feeds | Valid RSS 2.0, Atom and JSON Feed 1.1. Absolute URLs. Drafts excluded. |
| Structured data | Every page type's JSON-LD parses, and the types match 01 §7. |
| Meta | Every route has a title, description, canonical URL, `og:image` and `og:image:alt`. |
| Theme | The switch persists; System follows `prefers-color-scheme`; no flash of the wrong theme (screenshot at first paint). |
| Footnotes (once D13 lands) | The reference ↔ note backlinks work; sidenotes at 1200px and up, end notes from 761 to 1199px, inline notes at 760px and below; the hover link between number and note. |

## 3. Visual regression

- Playwright screenshots of every route at 1440 and 390, in light and dark, stored as baselines once Ryan approves the first set.
- Fonts must have loaded before each shot (`document.fonts.ready`).
- **Interactive states to capture:** the search dialog open (results, none, empty), the phone menu open, the six sign-up states, `/newsletter/subscribe` in each `status`, the four unsubscribe-page states, the anatomy diagram exploded and assembled, the props table on a phone, the copy button "Copied", and footnote hover.

## 4. Performance budgets

- **JavaScript:** a docs page or note ships less than 150 KB gzipped of JS in total (framework, Chakra and Emotion included), measured in `next build` output. Interactive components' behaviour loads only on pages that use them.
- **Search:** nothing loads until the dialog first opens.
- **Lighthouse (mobile):** Performance ≥ 95; Accessibility, Best Practices and SEO all 100 on Home, a component page, a docs page and a note.
- **CLS:** < 0.02. Fonts use `font-display: swap` with metric-matched fallbacks.

## 5. Launch checklist

- [ ] `git grep PostKit` is empty (PK-001)
- [ ] Every page passes §1 in both themes
- [ ] Privacy facts verified (09, "Facts the copy depends on"), including the hosting-logs line (09, "Copy changes since the boards"); `[DATE]` filled in, and `[contact address]` is `hello@postkit.org`
- [ ] The postal address (09 Q5) is in every email footer, and no `[Postal address]` remains
- [ ] `hello@postkit.org` receives mail (MX for `postkit.org` alongside Resend's SPF, DKIM and DMARC)
- [ ] Resend domain verified; subscribe, confirm and unsubscribe (footer link and one-click) tested on production with a real inbox
- [ ] Fathom site live; goals created; Sentry receiving events with no PII
- [ ] OG images checked with a share debugger (Bluesky, X, LinkedIn, Slack)
- [ ] `www` → apex permanent redirect; old docs and changelog URLs redirect; `robots.txt` and `sitemap.xml` present
- [ ] 0.3.0 is on npm (03 §8 step 12), and every `since: 0.3.0` doc is published
- [ ] Every direct dependency named on Made with OSS is still used (Zag is listed as "Via Chakra"), and nothing notable added since is missing

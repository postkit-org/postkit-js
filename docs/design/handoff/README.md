# postkit.org — build handoff

**Version:** 1, Nov 7, 2026 (first handoff)
**Product:** postkit.org, the site for Postkit, a portable publishing component library (`postkit-org/postkit-js`). It has home, component catalog, docs, notes, changelog and release emails, in light and dark. A Commune Software open-source project.
**Where it's built:** `apps/site` in `postkit-org/postkit-js`, on top of branch `v0.3.0`.
**Designs:** the Postkit canvas: 74 Site boards and 7 Components boards, exported here from version 79 on Nov 7, 2026.

## What's in the box

```
README.md                         this file
specs/
  01-site-spec.md                 routes, chrome, content model, page notes, structured data, search, feeds, theme, meta, a11y
  02-design-system.md             principles, type, colour + dark mode, layout, site components, interaction states
  03-component-system.md          the package spec (v4): what the site needs from @postkit/* (dark mode, renderEmail, footnotes)
  04-emails.md                    release-email list: flow, form states, emails, sending a release
  05-og-images-and-icons.md       5 share-image kinds, the icon set
  06-work-breakdown.md            PK-001 … PK-072 by phase: owns / boards / needs / done when / fallback
  07-acceptance-and-test-plan.md  per-ticket bar, automated tests, visual regression, budgets, launch checklist
  08-agent-brief.md               kick-off prompt, standing rules, questions to bring back
  09-content-callouts.md          open questions with defaults, every [placeholder], the facts the copy depends on
templates/CLAUDE.md               merge into the repo root
tokens/                           tokens.json (source) and ts/theme.ts (Chakra v3 createSystem, light + dark)
content/                          navigation.json, redirects.json, oss.json, search-synonyms.json
assets/brand/                     favicon.svg (the pill), commune-wordmark.svg, oss.svg (+ LICENSES.md)
reference/
  boards.md                       every board → title, frame, route, ticket
  mockups/                        the 81 .dc.html boards + canvas.json
  previews/                       the same boards as openable HTML, with dc-viewer.js running their logic
  renders/                        (separate zip) a full-page JPEG of every board
```

The renders shipped as a separate zip (`postkit-site-handoff-renders.zip`) to keep the bundle small. In this repo both zips are merged here, at `docs/design/handoff/`.

## How to start

1. Read `01`, `02`, and in `03` the sections the site depends on (§5.5, §6.1, §7.1, §8).
2. This folder lives at `docs/design/handoff/` in the repo. Merge `templates/CLAUDE.md` into the root.
3. Give a coding agent the prompt in `specs/08-agent-brief.md` and work through `06` from PK-001.
4. Package work and site work run side by side on `v0.3.0`. The site launches with the 0.3.0 release (03 §8 step 12). Site tickets that need a package step name what to use until it lands, and no fallback ships at launch.

## Settled for this handoff

- **Name:** "Postkit" everywhere. PK-001 fixes 273 "PostKit" occurrences (247 lines in 59 files).
- **Look:** quiet, Apple-like two-tone type, the brand gradient in a few fixed places, and the black Commune band on every page.
- **Font:** Suisse Int'l (Ryan supplies it). Inter Tight is the fallback.
- **Themes:** light and dark from launch. System is the default, and the footer switch overrides it.
- **Search:** a static index plus MiniSearch, lazy-loaded. No hosted search.
- **Structured data:** react-structured, with Article, TechArticle, SoftwareSourceCode and BreadcrumbList.
- **Analytics and errors:** react-fathom with three goals; Sentry with no PII and no replay.
- **Release emails:** double opt-in, Resend for audience and delivery, links valid 7 days, no database. Release emails are sent by hand from a Broadcast draft. Sign-up and unsubscribing live at `/newsletter/subscribe` and `/newsletter/unsubscribe`, with a one-click API route for mail clients (04 §1a–b); the copy still says "release emails".
- **Release:** everything in 03 §8 ships as 0.3.0, and the site launches with it (D19, 10 Nov).
- **Site-wide defaults:** `defaults` in `createPostkit`, mapped to Chakra recipe `defaultVariants` (D18, 10 Nov).
- **`renderEmail()`:** lives in `@postkit/email`, not `@postkit/next` (03 D15).
- **The Next.js guide** uses only APIs that exist today: `createPostkitNextComponents`, `createPostkitRemarkPlugins` and `PostkitProvider`.
- **Default variant** is `subtle` for every component (03 D12). The props tables show that.
- **Hosting:** Vercel, apex `postkit.org`.

## Verified / not verified

**Verified in this bundle:**
- The mockups match the live canvas file for file (81 boards plus `canvas.json`, published as version 79).
- All 81 previews render in Chromium with `dc-viewer.js`, with no horizontal overflow, no unfilled `{{holes}}` and no script errors.
- Package names, exports and the Next.js guide's code were checked against branch `v0.3.0` (`973776a`): `@postkit/chakra` exports `PostkitProvider`, `postkitDefaultTheme` and `createPostkitRemarkPlugins` (also from `/remark`), and `@postkit/next` exports `createPostkitNextComponents`.
- Prop defaults on the boards come from the package recipes. The variant default follows D12.
- `content/search-synonyms.json` targets only components in the manifest or docs pages in the new nav.
- `tokens/ts/theme.ts` type-checks against `@chakra-ui/react` 3.36.1 (checked in the repo on Nov 10, 2026, after the reduced-motion `globalCss` selector was fixed).
- The Made with OSS list covers the repo's dependencies plus what the specs add (next-meta, react-fathom, react-structured, Sentry, next-themes, MiniSearch, the Resend SDK, Playwright and axe). Zag is listed as "Via Chakra".

**Not verified:**
- The renders use Inter, not Inter Tight. Google Fonts was unreachable, so page heights differ a little from the canvas.
- Dark values for each component's internal styles: the dark boards show the intended result, and 03 §5.5 makes it a package requirement.
- Resend Broadcast and audience behaviour hasn't been tested against a live account.

## Open questions

These need Ryan before the tickets that depend on them. Details and defaults are in `specs/09-content-callouts.md`.

1. **Q1:** send subscribe emails inline (the default), or through a queue such as QStash?
2. ~~**Q2:** launch with 0.3.0, or before it?~~ Decided 10 Nov 2026: with 0.3.0 (03 D19).
3. **Q3:** resolve link previews at build time only (the default)?
4. **Q4:** Suisse Int'l delivery: self-hosted files or a Fontstack kit?
5. ~~**Q5:** the postal address for the email footers~~ Answered 10 Nov 2026: 1870 The Exchange SE Ste 220, PMB 980007, Atlanta, GA 30339-2171.
6. **Q6:** which notes exist at launch?
7. **Q7:** is OpenGraphs ready for the share-image templates (the fallback is `@vercel/og`)?
8. **Q8:** Postkit's Bluesky and X handles.
9. **Q9:** the sender address (default `Postkit <releases@postkit.org>`).

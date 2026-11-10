# 06 — Work breakdown

Tickets run in order within a phase, and phases mostly in order. Each ticket is one PR on top of branch `v0.3.0`, green on `npm run site:check` plus the per-ticket bar in 07 §1. "Needs step N" means a step from the package plan (03 §8) has to land first. Site and package work run side by side on `v0.3.0`, and the launch *is* the 0.3.0 release (03 §8 step 12, D19). Until a step lands, build against the ticket's stated stand-in, and remove it before launch: no package fallback ships. (PK-003's Inter Tight is a font fallback, not a package one; it can ship if 09 Q4 is still open.)

Use Nx generators for every new project: `nx g @nx/js:library`, `nx g @nx/react:library`, `nx g @nx/next:page` where it fits. Never hand-write `project.json`.

---

## Phase 0 — Repo and foundations

**PK-001 · Spell it "Postkit"** (03 step 1, D16)
- Owns: all 273 "PostKit" occurrences (247 lines in 59 files): READMEs, `libs/content` frontmatter, bodies and `src`, AGENTS.md, source strings (`packages/chakra/src/lib/component-catalog.ts`), `component-manifest.json`, `tools/*.mjs`, `.github/ISSUE_TEMPLATE`, `examples/`, `apps/site`. Update the tests that assert the old strings (`component-catalog.spec.ts`).
- Done when: `git grep -n PostKit` returns nothing; `check`, `docs:check`, `package:check` and `catalog:check` pass. Regenerate generated files (manifest, agent docs); don't edit them by hand.

**PK-002 · `libs/site-theme`**
- Owns: `nx g @nx/js:library libs/site-theme --name=site-theme --bundler=none` (Nx 23: the directory is the positional argument), `tokens.json` copied in, `theme.ts` from `tokens/ts/theme.ts`, the exported `siteSystem` and `gradients`.
- Tag the new library (and `site-emails` later) so a typecheck target covers it: the root `typecheck` script only runs `tag:npm:public`, so add a `site:typecheck` script (or include these projects in `site:check`).
- Done when: `nx typecheck site-theme` passes. The handoff's `theme.ts` was type-checked against Chakra 3.36.1 after delivery; fix anything a newer Chakra flags here.

**PK-003 · Wire the theme, fonts and colour mode**
- Owns: `apps/site/src/pages/_app.tsx` uses `PostkitProvider system={siteSystem}`; next-themes (class, system default); fonts (Suisse Int'l via the method Ryan supplies, Inter Tight fallback, JetBrains Mono); global CSS from the theme; remove the old `site-theme.ts` and `styles.css` look (cream `#f4f1e8` and so on).
- Needs: Ryan's Suisse Int'l files or kit (09 Q4). Fallback: ship with Inter Tight and swap later.
- Done when: a blank page shows the right fonts and background in light and dark, with no flash on load.

**PK-004 · Stack wiring**
- Owns: next-meta defaults (01 §12); react-structured base (`WebSite`, `BreadcrumbList` helper); react-fathom with the three goals; `@sentry/nextjs` (instrumentation files, `tunnelRoute`, scrubbing, source maps in CI).
- Done when: Sentry receives a test error from a preview deploy with no email or IP in it, and Fathom records a pageview.

## Phase 1 — Chrome

**PK-010 · Header** (boards: every Site*, Phone*)
- Glass header, nav with the bottom-edge gradient bar, search trigger (opens a stub until PK-041), Get started; the phone layout.

**PK-011 · Phone menu** (PhoneMenuOpen, PhoneMenuOpenDark)
- Done when: the menu traps focus, closes on Esc, route change and the close button, and restores focus to the menu button.

**PK-012 · Footer and Commune band** (every board)
- Four columns, the bottom row with the "w/ OSS" badge, the Commune band (always black, 767px switch). Wordmark from `assets/brand/commune-wordmark.svg`.

**PK-013 · Theme switch** (footer; SiteColorTokens; *Dark boards)
- The radiogroup with arrow-key behaviour. Done when: the choice persists across reloads, System follows the OS live, and all chrome matches the dark boards.

**PK-014 · Site primitives** (SiteInteractionStates)
- Button (primary, secondary), SegmentedControl, Kbd, TextField, Tile, the focus ring. Every state on the Interaction states board, as Chakra recipes in `libs/site-theme` (or `apps/site` if only the site uses them).

## Phase 2 — Content

**PK-020 · Docs schema and new IA** (01 §5.1)
- Owns: the `category` enum, `since`, `status`, the draft filter in production; split and merge the 13 existing docs into the new nav; write the new pages, keeping each 0.3.0 page `status: draft` until its package step lands (Email: step 9; Customizing and Reference: step 8; CLI, Eject, New components: step 11); `content/redirects.json` for changed slugs, applied in `next.config.js`.
- Done before launch: every 0.3.0 page is published.
- Done when: every nav item resolves or is marked "Soon"; old slugs return 308 (`permanent: true`).

**PK-021 · Notes collection** (01 §5.3)
- Owns: the schema, and the first note, "One article, four renderers", from the SiteArticle board (its text is complete except the date). Remove the `[Notes titles]` placeholders from the index. Ryan supplies titles, or the index shows only real notes (09 Q6).

**PK-022 · Changelog `subtitle`, `status` and redirects**
- Add `subtitle` and `status: released | upcoming`; slug from `version`; redirects from the old filename slugs (`content/redirects.json`). 0.3.0 is `upcoming` ("In development"); SiteChangelog030 shows its intended content.

**PK-023 · Component content collection** (01 §5.4)
- `libs/content/components/*.md` with `anatomy` frontmatter. Port the layer data for Callout, KeyTakeaway, CodeBlock and Figure from the boards (`reference/mockups/SiteComponent*.dc.html`, the `exploded(...)` layer boxes).

## Phase 3 — Pages

**PK-030 · Home** (SiteHome, PhoneHome, *Dark)
- The renderer panel has four tabs and uses real renderers: Headless, Chakra, Email (the email output in an iframe) and Editor (the Prismark preview, which is headless Postkit with `styles.css`, D10). The stats come from the manifest. The install copy button fires the `copy-install` goal.
- Needs step 7 (headless views) for the Headless tab and step 8 (`createPostkit` renderer, `styles.css`) for the Editor tab. Until then: both show a static render captured from the boards.

**PK-031 · Component catalog** (SiteComponents, PhoneComponents)
- Kit chips, the tile grid with live previews.

**PK-032 · Component page template** (SiteComponentCallout/KeyTakeaway/CodeBlock/Figure + Phone + Dark)
- Breadcrumb, two-tone title, badges, preview with manifest-driven controls, Usage tabs, the Renderers table (from the computed support matrix), Theming, Accessibility, Related, and the right TOC.
- Needs step 9 for the computed support matrix. Until then: compute the email column in the site from the names `@postkit/email` exports (today's hand-written matrix says `not-defined` for all 35, which is wrong).

**PK-033 · Props table** (01 §6.4)
- Needs step 8 (manifest v2 `default`). Until then: a site-side defaults map with the values on the boards. This is the one allowed exception to 08 rule 7; delete the map when step 8 lands.

**PK-034 · Anatomy diagram** (01 §6.3)
- The skewed layers, labels, isolate on hover or focus, the Assemble/Explode toggle, the phone legend, reduced motion. Components without `anatomy` show only the parts grid.

**PK-035 · Docs page template** (SiteDocs*, PhoneDocs*)
- Nav, the phone disclosure, TOC with scroll-spy, prev/next, the `since` badge, and a "Search docs" field that opens the dialog filtered to Docs.

**PK-036 · Notes index** (SiteNotes, PhoneNotes)
- Featured note, the list, the subscribe card (wired in PK-051), feed links.

**PK-037 · Note article** (SiteArticle, PhoneArticle, *Dark)
- The centred column, avatar, lead image with a left-aligned caption, sidenotes in the gutter, Aside in the gutter, end notes below 1200px, inline notes on phones.
- Needs step 10's Footnotes (03 §7.1, D13, with responsive `placement`). Until then: end notes everywhere, with Aside as an in-column block.

**PK-038 · Changelog index and entries** (SiteChangelog, SiteChangelog010/020/030 + Phone)

**PK-039 · Licensing, Privacy, Made with OSS, 404** (boards of the same names)
- Privacy facts must hold (09, "Facts the copy depends on"). Made with OSS reads `content/oss.json`.

## Phase 4 — Search, feeds and llms.txt

**PK-040 · Search records and API** (01 §8)
- Build the search records from the content collections and the manifest, the `@chakra-docs/search` MiniSearch engine with the synonyms file, and `GET /api/search`. Tests per 07.

**PK-041 · Search dialog** (SiteSearch, SiteSearchEmpty, PhoneSearch, SiteSearchDark)
- Calls `/api/search` through `@chakra-docs/search/client` once open; grouped results; keyboard; no-results suggestions; the pre-populated empty state from `content/search-featured.json` ("Jump to" and popular components); opens from ⌘K, the header and "Search docs".

**PK-042 · Feeds and llms.txt** (01 §10)

## Phase 5 — Release emails

**PK-050 · Subscribe API** (04 §1)
- `/api/newsletter/subscribe`, `confirm` and `unsubscribe` routes (04 §1); the sealed confirm and unsubscribe tokens (04 §1); one-click `List-Unsubscribe-Post` handling; the rate limit, the honeypot, the Resend audience and its `unsubscribe_token` contact property.
- Find out whether Resend Broadcasts render custom contact properties (04 §4) and note the answer in the PR. If they don't, brand Resend's hosted unsubscribe page to match SiteUnsubscribed.
- Done when: on a preview deploy with a real inbox, subscribing, confirming, unsubscribing from the footer link and unsubscribing with Gmail's one-click button all work.

**PK-051 · Form states and the newsletter pages** (SiteSignupStates, SiteConfirmed, SiteConfirmExpired, SiteUnsubscribed + Phone)
- All six form states, shared by the card on `/notes` and the subscribe page.
- `/newsletter/subscribe` with its form, Confirmed and Expired views (04 §1b). Confirmed reads the masked address from the fragment.
- `/newsletter/unsubscribe` with its four states (04 §1a).
- Both pages are on the ResultPage layout.

**PK-052 · `libs/site-emails`: confirm and already-subscribed** (EmailConfirm)
- `nx g @nx/react:library libs/site-emails --name=site-emails`. Built with `@postkit/email` and Chakra Email, with hand-written plain-text parts. Open and click tracking off.

**PK-053 · Release email script** (EmailRelease, 04 §4)
- Needs step 9 (`renderEmail`, D15). No fallback: this ticket waits for step 9, and is done before launch so the first release after it can go out. Adds the root `release:email` script.

## Phase 6 — Share images and icons

**PK-060 · Icons and web manifest** (SiteIcons, 05 §2)

**PK-061 · Share images** (Og* boards, 05 §1)
- OpenGraphs templates, or the `@vercel/og` fallback.
- Done when: every route has `og:image` and alt text, and long titles shrink and truncate as specified.

## Phase 7 — Launch

**PK-070 · Accessibility and visual pass**
- 07 §2–3 across every board, in both themes.

**PK-071 · Vercel and DNS**
- The Vercel project for `apps/site`, the `postkit.org` domain (apex plus `www` → apex 301), environment variables (04 §5), Resend domain verification (SPF, DKIM, DMARC), and MX records so `hello@postkit.org` receives mail (Privacy and the unsubscribe page point to it).

**PK-072 · Launch checklist** (07 §5)
- Runs as part of 03 §8 step 12: 0.3.0 goes to npm, then the site goes live.

---

### Package work the site depends on (from 03 §8)

Everything here lands before launch (D19). The last column is what site work uses in the meantime.

| Package step | Site tickets | Until it lands |
|---|---|---|
| 1 Clean-up and casing | PK-001 | Nothing; it's the same work, so do it first |
| 2 `@postkit/chakra` | PK-003 onward | Nothing; branch `v0.3.0` already has it |
| 3 Dark mode in `@postkit/chakra` (§5.5) | PK-013, dark checks for PK-030–039 | Check light only; the dark pass waits for step 3 |
| 7 Headless views | PK-030 Headless tab | A static render from the boards |
| 8 `createPostkit`, `defaults`, manifest v2, `styles.css` | PK-030 Editor tab, PK-033, Customizing and Reference docs | A static render; a site defaults map; the docs stay draft |
| 9 Computed support, `renderEmail` | PK-032, PK-053, Email docs | A site-computed email column; PK-053 waits |
| 10 Footnotes (§7.1, D13) | PK-037 | End notes only |
| 11 CLI and Nx generator | CLI, Eject and New components docs | The docs stay draft |
| 12 Release 0.3.0 | PK-072 | — (the launch is the release) |

### Package issues found while building the site (Nov 10, 2026)

Found by the site build and its axe passes. They live in the packages, so they're fixed there, not worked around in `apps/site`. Each must be done before launch (07 §1 needs a clean axe run on every page).

| # | Package | Issue | Where it shows | Plan step |
|---|---|---|---|---|
| P1 | `@postkit/chakra` (remark preset) | Unknown text directives render an empty block: "4.5:1" is read as a directive `:1`. Unknown inline directives should stay literal text | Component pages' accessibility notes | 8 |
| P2 | `@postkit/chakra` (validation) | Unknown `postkit-*` directives render as a plain `<div>` instead of failing; directive errors carry no file and line (contradicts 03 §3.1) | Docs: Validation | 8 |
| P3 | `@postkit/chakra` | CodeBlock / Terminal content has `aria-expanded` (axe `aria-allowed-attr`, critical) | Home, code-block, code-group, most docs, changelog | 7 |
| P4 | `@postkit/chakra` | Contrast below 4.5:1: LinkPreview domain (2.56:1), Figure credit, KeyTakeaway body on its tint, AppearsOn service labels, NewsletterSignup privacy line, ShareActions buttons (1.09:1), SocialPost badge and timestamp | Component pages, home, the first note | 7 |
| P5 | `@postkit/chakra` | Subtle Callout renders `bg.subtle` grey instead of its tone tint | 404, notes, anatomy (assembled Callout) | 7 |
| P6 | `@postkit/chakra` | Scrollable regions aren't keyboard-focusable (axe `scrollable-region-focusable`): Chart plot, Comparison scroller, Diff code, prose tables | Component pages; docs chakra, validation, compatibility | 7 |
| P7 | `@postkit/chakra` | Stat's `<dl>` structure fails axe `definition-list` | Stat component page | 7 |
| P8 | `@postkit/shiki` | Comment colour `#6a737d` on the dark code surface is below 4.5:1 | Every highlighted code block | 7 |
| P9 | `@postkit/email` | Tone colours come out as raw palette names (`background-color:green.50`): Chakra Email's default theme has no tone palettes | Home Email tab (worked around by passing site tones) | 9 |
| P10 | `@postkit/email` | Callout's left border uses the text colour, not the tone | Home Email tab | 9 |
| P11 | `@postkit/chakra` | Component code (not recipes) still has raw colours: LinkPreview consent scrim text, Chart fallback colours | — | 3 follow-up |
| P12 | `@postkit/core` | `serializePostkitHtml` gives prop-only components no markup: KeyTakeaway, Terminal, CodeBlock, PullQuote, Steps and LinkPreview serialize as empty elements. Feeds fall back to summary + link for entries that use them (the build log names them) | Feeds; blocks `renderEmail` text output and Prismark | 8 |
| P13 | `@postkit/core` | Text carried in props (a Callout `title`) only survives in `data-postkit-props`, which feed readers and plain text don't show; core also doesn't parse directives itself (the site runs the remark preset first) | Feeds, llms | 8 |
| P14 | `@chakra-docs/feed` (owner's package) | `DocsFeedEntry` has no field for an item's full content; the site appends HTML to its output after the fact and fails loudly if that output changes. A `content` field upstream removes the workaround | Feeds | — (chakra-docs) |
| P15 | `@chakra-docs/chakra` (owner's package) | `DocsSearch` owns its open state and trigger (can't be opened programmatically for ⌘K from other pages, `?q=` or a scoped "Search docs") and renders one flat list (no groups, match highlighting, footer hints or no-results state). The site built its own dialog on `@chakra-docs/search/client` instead | Search | — (chakra-docs) |

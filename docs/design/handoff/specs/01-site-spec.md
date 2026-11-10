# 01 — Site spec: postkit.org

The public site for Postkit: home, component catalog, docs, notes, changelog, release emails and the legal pages. It replaces the current `apps/site` in `postkit-org/postkit-js` and stays in that repo, so the site always builds against the packages in the same commit.

Boards are the source of truth for layout and copy. `reference/boards.md` maps every board to its route and ticket.

---

## 1. Ground rules

- **Name:** "Postkit" everywhere, never "PostKit" (PK-001 fixes the repo).
- **Stack:** Nx (generators only), Next.js Pages Router, Chakra UI v3, `@postkit/chakra` for every component shown on the site, `next-meta`, `react-structured`, `react-fathom`, Sentry, Resend. Hosted on Vercel.
- **Dogfood:** every Postkit component on the site, including component previews, the notes article and the release email, is rendered by the published Postkit packages from the same commit. The site never forks a component. If the site needs something a component can't do, that's a package ticket.
- **Static first:** every page is statically generated. The only server code is the three subscription API routes (§9).
- **Light and dark:** both themes from launch (§11, and `02-design-system.md` §3).
- **Width targets:** 1440, 1199 (sidenote breakpoint), 760 (phone breakpoint) and 390. Check 320 for overflow.

## 2. Repo layout

```
apps/site                      Next.js Pages Router app (exists; restructure in place)
  src/pages/                   routes (§3)
  src/pages/api/newsletter/    subscribe.ts · confirm.ts · unsubscribe.ts (§9)
  src/components/              site chrome: Header, Footer, CommuneBand, SearchDialog,
                               ThemeSwitch, DocsNav, Toc, PropsTable, AnatomyDiagram,
                               ComponentPreview, SubscribeForm, …
  src/lib/                     content loaders, search index builder, feeds, structured data
  scripts/                     build-time: search index, feeds, llms.txt
  og/                          share-image templates (05)
libs/content                   content collections + Markdown (exists)
  docs/  changelog/            exist
  notes/  components/          new (§5.3, §5.4); export changelog.ts's nonEmptyString and
                               changelogDateSchema so the new schemas can reuse them
libs/site-theme                NEW (nx g @nx/js:library): tokens + Chakra createSystem,
                               shared by apps/site and the email templates
libs/site-emails               NEW (nx g @nx/react:library): confirm + release emails,
                               rendered with @postkit/email / Chakra Email
```

`libs/site-theme` is separate because the site and the emails use the same tokens. Nothing else is shared, so nothing else gets its own library.

## 3. Routes

| Route | Page | Data | Boards |
|---|---|---|---|
| `/` | Home | static + component manifest counts | SiteHome, PhoneHome, *Dark |
| `/components` | Component catalog, by kit | `component-manifest.json` | SiteComponents, PhoneComponents |
| `/components/[slug]` | Component page | manifest + `libs/content/components/[slug].md` | SiteComponent*, PhoneComponent* |
| `/docs` | Redirects to `/docs/introduction` | — | — |
| `/docs/[slug]` | Docs page | `libs/content/docs` | SiteDocs*, PhoneDocs* |
| `/notes` | Notes index + subscribe | `libs/content/notes` | SiteNotes, PhoneNotes |
| `/notes/[slug]` | Note (article) | `libs/content/notes` | SiteArticle, PhoneArticle |
| `/changelog` | Changelog index | `libs/content/changelog` | SiteChangelog, PhoneChangelog |
| `/changelog/[version]` | One release (`0-2-0`). The slug comes from the `version` field, not the filename | `libs/content/changelog` | SiteChangelog010/020/030 |
| `/newsletter/subscribe` | Sign up for release emails, and the confirm result. `?status=confirmed` shows Confirmed, `?status=expired` shows Expired, no status shows the form (04 §1b) | status from the query; the masked address from the fragment (`#for=r…@example.com`), read client-side; fragments never reach servers or analytics | SiteSignupStates, SiteConfirmed, SiteConfirmExpired (+ Phone) |
| `/newsletter/unsubscribe` | Unsubscribe (opened from an email's Unsubscribe link) | sealed token in `?token=` (the address can't be read from it), posted client-side to `/api/newsletter/unsubscribe`; never changes anything on GET (04 §1a) | SiteUnsubscribed, PhoneUnsubscribed |
| `/licensing` | Licensing | static | SiteLicensing |
| `/privacy` | Privacy | static | SitePrivacy |
| `/withoss` | Made with OSS | static list (`content/oss.json`) | SiteWithOSS |
| `/404` | Not found | static | SiteNotFound |
| `/feeds/notes.xml` · `.atom` · `.json` | Notes feeds | build time | — |
| `/feeds/changelog.xml` · `.atom` · `.json` | Changelog feeds | build time | — |
| `/search-index.json` | Search index | build time (§8) | — |
| `/llms.txt` | Plain-text map of docs and components | build time | — |

`/components/[slug]` and `/docs/[slug]` keep their shapes. Changelog URLs change from the filename (`/changelog/2026-09-03-postkit-0-2-0`) to the version (`/changelog/0-2-0`). Every changed URL gets a permanent redirect (`content/redirects.json`, applied in `next.config.js`; Next sends 308 for `permanent: true`).

## 4. Site chrome

**Header** (every page except the share images and emails)
- Glass: `bg.glass` with `backdrop-filter: saturate(180%) blur(20px)`, 1px `border` bottom, sticky, `z-index` above content and below dialogs.
- Left: logo (gradient pill + "Postkit"). Right: Components, Docs, Notes, GitHub ↗, the search trigger, and "Get started" (primary button, links to `/docs/quick-start`).
- The current section has a 2px gradient bar pinned to the header's bottom edge. Links stretch to the header's full height so the bar sits on the edge, not under the text.
- Under 760px: links hide. Logo, search icon (44px), "Get started" and the menu button remain.
- **Menu (phone):** full-screen sheet under the header (PhoneMenuOpen). Rows: Components, Docs, Notes, Changelog, each with a one-line description, and the current page underlined with the gradient. Then GitHub, npm and Bluesky. Licensing, Privacy and Made with OSS sit at the bottom. The menu button becomes a close button (`aria-expanded`). The sheet traps focus and closes on Esc and on navigation.

**Footer**
- Columns: brand line, Product (Components, Docs, Notes, Changelog), Packages (`@postkit/react`, `@postkit/chakra`, `@postkit/email`, `@postkit/core`), Elsewhere (GitHub, npm, Bluesky, X / Twitter).
- Bottom row: "© 2026 Postkit. MIT licensed." on the left. On the right: Licensing, Privacy, the "w/ OSS" badge (links to `/withoss`) and the theme switch (§11).
- **Commune band:** a full-width 4px gradient rule, then an always-black band (`bg.commune`, both themes). It holds "By" (24px, `#A1A1AA`, 18px under 767px), a 4px gap, and the white Commune wordmark at full width, linking to `https://commune.software/open-source/postkit`.

## 5. Content model

All content lives in `libs/content` as Markdown/MDX with Zod-validated frontmatter (`@content-collections/core`, as today). Builds fail on invalid frontmatter.

### 5.1 Docs (`libs/content/docs`, exists)

Keep the current schema, add two fields (`since`, `status`), and turn `category` into an enum:

```ts
docsEntrySchema = z.object({
  title, summary, order,                                          // exist
  category: z.enum(['Get started', 'Writing', 'Customizing', 'Renderers', 'Frameworks', 'Reference']),  // was free text
  since: z.string().optional(),            // '0.3.0' — shows a version badge
  status: z.enum(['published', 'draft']).default('published'),   // drafts excluded from production builds, search, feeds, sitemap
  content,
})
```

**Information architecture.** The boards show the target nav. Existing docs map onto it like this:

| Group | Page | Source |
|---|---|---|
| Get started | Introduction | `core-concepts.md` (first half) + `choosing-a-package.md` |
| | Installation | `getting-started.md` (install) + `compatibility.md` |
| | Quick start | `getting-started.md` |
| | Kits | new, `since: 0.3.0` |
| Writing | MDX · Markdown directives | `markdown-and-mdx.md`, split |
| | Validation | new (pull from `troubleshooting.md`) |
| | Portable documents and feeds | `portable-documents.md` |
| | Link previews and unfurling | `unfurling.md` |
| | Writing in Prismark | new |
| Customizing | Tokens · Part styles | `theming.md`, split |
| | Defaults and slots · Views · Eject · New components | new, `since: 0.3.0` |
| Renderers | Headless | new, `since: 0.3.0` |
| | Chakra | `choosing-a-package.md` + `theming.md` |
| | Email | new (documents `renderEmail`, see 03 §6) |
| | Web components | nav item marked "Soon", no page |
| Frameworks | Next.js · React Router · TanStack Router · Astro | `framework-guides.md`, split |
| Reference | createPostkit · definePostkitComponent · Manifest · CLI | new, `since: 0.3.0` |
| | API reference | `api-reference.md` (TypeDoc output) |
| | Compatibility · Security · Troubleshooting | existing files |

Nav order is the table order. The two nav items that aren't on the boards (Portable documents, Link previews) and the Reference additions use the same nav style.

**Docs that describe 0.3.0 APIs** (`since: 0.3.0`) stay `status: draft` until their package step lands (06 PK-020), and all of them are published at launch, which is the 0.3.0 release (03 D19). The Next.js guide on the boards already uses only APIs that exist today.

### 5.2 Changelog (`libs/content/changelog`, exists)

Add two fields:

```ts
subtitle: nonEmptyString,                                    // the grey title line: "Portable documents, host-native Chakra and email."
status: z.enum(['released', 'upcoming']).default('released'), // 'upcoming' = "In development"
```

- `upcoming` entries **are** public: the index, their own page and search show them as "In development" (as on SiteChangelog and SiteChangelog030).
- They're left out of feeds, share-image "Latest" badges and release emails.
- The index shows the newest released entry as "Latest". Entry pages render the Markdown body with Postkit components.

### 5.3 Notes (`libs/content/notes`, new collection)

```ts
notesEntrySchema = z.object({
  title: nonEmptyString,              // "One article, four renderers."
  subtitle: z.string().optional(),    // the grey half of the headline
  summary: nonEmptyString,            // index and feeds
  kind: z.enum(['release', 'guide', 'case-study', 'design']),   // the index filters: All · Releases · Guides · Case studies · Design
  date: changelogDateSchema,
  author: z.object({ name: z.string(), avatar: z.string().optional() }),
  cover: z.enum(['gradient']).or(z.string()).default('gradient'),   // image path, or the brand gradient
  footnotes: z.object({ placement: z.enum(['end', 'side', 'popover', 'inline']) }).optional(),
  status: z.enum(['published', 'draft']).default('published'),
  content,
})
```

Notes are MDX (the collection includes `**/*.mdx`; the existing factories only read `.md`). They use the site's Postkit config with footnotes in `side` placement (the site sets `placement: { base: 'inline', md: 'end', xl: 'side' }` with `--postkit-sidenote-width: 192px` and `--postkit-sidenote-gap: 28px`, overriding the package defaults; see the article boards and 03 §7.1).

### 5.4 Component pages

Generated from the manifest (`postkitComponentCatalog` / `component-manifest.json`): name, kit, description, stability, directive, props, slots and the renderer support matrix. Each component can also have `libs/content/components/[slug].md` (a new collection) for usage notes, accessibility notes and related components. Its frontmatter carries `tagline` (the grey half of the page title and the share image: "Make sure the important part gets read.") and `anatomy` (the diagram layers, §6.3). Without a `tagline`, the manifest description is used.

## 6. Page notes

### 6.1 Home
Hero, the live renderer panel (the same article in each renderer, switched by a segmented control with four tabs: Headless, Chakra, Email and Editor, which is the Prismark preview), "Writers keep their tools" (MDX and Markdown sources side by side, with the rendered result), kits, stats (component, kit and renderer counts from the manifest; never hard-coded), install CTA with a copy button, footer.

### 6.2 Component catalog
Kit chips (scroll horizontally on phones), then a grid of tiles. Each tile is a live preview of the component's default state, its name and a two-line description. The whole tile is one link (see interaction states).

### 6.3 Component page
In order: breadcrumb, title (name + grey value line), badges (kit, static/interactive, stability, directive), live preview with controls, Usage (MDX/Markdown tabs plus the rendered result), Props (§6.4), Anatomy, Renderers, Theming, Accessibility, Related. A right rail "On this page" TOC shows above 760px (hidden on phones).

**Preview controls** are generated from the manifest's enum props (tone, variant, size). Changing one re-renders the real component. The code sample updates to match.

**Anatomy diagram** (the exploded view):
- Layers come from frontmatter `anatomy.layers`, listed top to bottom. Each has a part name, element, one-line description and a box (x, y, w, h) on the flat component.
- Each layer sits on a skewed plane (`matrix(0.927, 0.232, -0.375, 0.575)`), with each part outlined by a 1.5px box. Labels are numbered top to bottom.
- Hovering or focusing a label isolates its layer. The Assemble/Explode toggle animates the layers flat (0.55s, `cubic-bezier(.2,.7,.2,1)`).
- On phones the diagram scales down, labels become numbers, and a legend follows.
- Components without `anatomy` frontmatter show only the "Every part" grid. The four designed components (Callout, KeyTakeaway, CodeBlock, Figure) have their layers in the boards (`reference/mockups`).
- With reduced motion, the toggle switches state without animating.

### 6.4 Props table
- Columns: Prop (mono; red "Required" under the name when required), Type (string enums as `"a" | "b"`), Default, Description.
- `size` and `variant` sit last, under an "Appearance" sub-heading.
- Under the table: one line pointing to `unstyled`, the part-styling props, site-wide defaults, and Part styles.
- Under 760px each row stacks: name, then "Type" and "Default" as labelled lines (Default hidden when there is none), then the description.
- **Defaults** come from the manifest v2 per-prop `default` (03 §3.2). Variant defaults to `"subtle"` everywhere (decision D12). The boards show that, even where the 0.2 code still says otherwise.

### 6.5 Docs page
- Left nav (220px, sticky). The current page is marked with the gradient pill on a `bg.subtle` row.
- A "Search docs" field at the top of the nav opens the global search dialog filtered to Docs. It isn't a second search.
- Main column at most 720px. Right TOC above 760px. Prev/next at the bottom.
- Under 760px the nav collapses into a disclosure ("Group / Page ▾") above the content.

### 6.6 Notes index and article
- **Index:** featured note, list (kind · date · title · summary), the subscribe card, and feed links (RSS, Atom, JSON Feed). The card posts to the same API as `/newsletter/subscribe`; the page exists so emails, the unsubscribe page and other sites have a URL to link to.
- **Article:**
  - Centred header (kind · date · read time, title in two tones, author with a circle avatar), then the lead image.
  - The text column is 680px, centred.
  - Sidenotes float in the right gutter (192px wide, 28px from the column) and line up with the image's right edge. The active note gets the gradient edge.
  - `Aside` uses the same gutter, as D14 decides.
  - Below 1200px, sidenotes become end notes and the Aside becomes a grey block in the column.
  - On phones, an inline note opens under its paragraph.
  - The figure caption aligns with the image's left edge.
  - The article ends with "Components in this note" and "Next note".

### 6.7 Changelog
- **Index:** tag filter chips at the top (from `tags`). One row per release: version and date, "Latest" or "In development", the title with its grey `subtitle`, the summary, and its tags.
- **Entry pages:** the release notes, a package list, upgrade notes and prev/next links.

### 6.8 Legal and misc
- **Licensing:** MIT text ("Copyright (c) 2026 Postkit"), plus the "Built on" table of third-party licences, which links to `/withoss`.
- **Privacy:** the light version on the board. It must stay true; see 09 for the facts it depends on.
- **Made with OSS:** four sections from `content/oss.json`. The OSS mark is in `assets/brand/oss.svg`; draw it in `currentColor`.
- **404:** the search field opens the search dialog.

## 7. Structured data (react-structured)

| Page | Types |
|---|---|
| All pages | `WebSite` (with `SearchAction` pointing at `/?q={query}`) on `/` only; `BreadcrumbList` everywhere except `/` |
| Home | `SoftwareSourceCode` for the repo (`codeRepository`, `programmingLanguage: TypeScript`, `license`) |
| Component page | `SoftwareSourceCode` (name, description, `codeSampleType: code snippet`, `isPartOf` the repo) |
| Docs page | `TechArticle` (headline, description, `dependencies` from `since`, `dateModified` from git) |
| Note | `Article` (headline, author, datePublished, image = its OG image) |
| Changelog entry | `TechArticle` with `version` |

## 8. Search

- **Static index**, built after content collections. `scripts/build-search-index.ts` writes `/search-index.json` with one record per component, docs section (h2), note and changelog entry: `{ id, kind, title, section?, text, url }`.
- **Client:** MiniSearch, with prefix and fuzzy matching (0.2). Field boosts: title ×4, section ×2, text ×1. The index loads on first open, never on page load.
- **Synonyms** map common names to Postkit names (`content/search-synonyms.json`: accordion → Disclosure, admonition → Callout, tldr → KeyTakeaway, slideshow → Carousel, tweet → SocialPost, …). Every target must be a real component, doc or concept.
- **Dialog:**
  - ⌘K or Ctrl K, or the header trigger, opens it. On phones it's full screen.
  - Results are grouped: Components, Docs, Notes, Changelog. Up to 4 per group, with the match highlighted in the snippet.
  - The first result is active. ↑/↓ move, ↵ opens, Esc closes.
  - **Empty query:** "Jump to" plus popular components (PhoneSearch).
  - **No results:** the message, three suggestions taken from the closest titles, and "Request it on GitHub" (SiteSearchEmpty).
- **`/?q=`:** loading any page with `?q=` opens the dialog with that query filled in (this is what the `SearchAction` in §7 points at).
- **Accessibility:** a combobox and listbox with `aria-activedescendant`. A focus trap while open. Focus returns to the trigger on close.

## 9. Release emails (summary; full flow in 04)

- `POST /api/newsletter/subscribe` validates the address, seals a token (AES-256-GCM over the email and an expiry 7 days out, so the address never appears in a URL) and sends the confirmation email through Resend. The response never reveals whether the address is already subscribed.
- `GET /api/newsletter/confirm?token=` verifies the token. If it's valid, it adds the contact to the Resend audience and redirects to `/newsletter/subscribe?status=confirmed`. If it has expired or been tampered with, it redirects to `/newsletter/subscribe?status=expired`.
- `POST /api/newsletter/unsubscribe` opens a sealed unsubscribe token and marks the contact unsubscribed in the Resend audience. It also answers one-click requests from mail clients (`List-Unsubscribe-Post`, RFC 8058). Every email to a subscriber links to `/newsletter/unsubscribe`, which posts the token on load (04 §1a).
- Release emails are Resend Broadcasts to that audience, created by a script from a changelog entry (04 §4), and sent by hand.

## 10. Feeds and llms.txt

- RSS 2.0, Atom and JSON Feed 1.1 for notes and the changelog, built at deploy time with full content. Feed items render through `@postkit/core`'s serializer, so feed readers get plain, safe HTML.
- The `<link rel="alternate">` tags go on `/notes` and `/changelog`.
- `/llms.txt` lists docs and components with one-line summaries, and links to the raw Markdown.

## 11. Theme (dark mode)

- `next-themes` (`attribute="class"`, `defaultTheme="system"`, `enableSystem`), wired through Chakra v3's color-mode setup.
- **Footer switch:** a radiogroup labelled "Theme" with System, Light and Dark. The choice persists in `localStorage` (not a cookie, so the Privacy page stays true).
- The first paint has no flash: next-themes' inline script sets the class before hydration.
- **Components on the site** use Chakra semantic tokens, so they follow the theme. That's a package requirement (03 §5.5).
- **Exceptions:** share images, emails and the Commune band don't change with the theme.

## 12. Meta, analytics and errors

- **next-meta:**
  - Title pattern `{Page} · Postkit`; the home page is just "Postkit".
  - Description from the summary.
  - Canonical URLs on `https://postkit.org`.
  - `og:image` from 05.
  - `theme-color` per theme: `#FFFFFF` and `#0F0F11`.
- **react-fathom:**
  - Pageviews, plus three goals: `subscribe-request`, `subscribe-confirmed` and `copy-install`.
  - No other events.
- **Sentry** (`@sentry/nextjs`, current conventions):
  - `instrumentation.ts` with `onRequestError`; `instrumentation-client.ts` for the browser.
  - `tunnelRoute` so ad blockers don't drop events.
  - `sendDefaultPii: false`, and email addresses scrubbed from breadcrumbs and request bodies in `beforeSend`.
  - Source maps uploaded in CI.
  - Tracing at a low sample rate. No session replay (the Privacy page doesn't cover it).

## 13. Accessibility

- WCAG 2.2 AA in both themes. `02-design-system.md` §6 covers focus, targets and motion.
- **Landmarks:** header, main and footer, plus `nav` elements with distinct labels (Main, Docs, Menu, On this page).
- Skip link to main.
- **Every interactive board state has a keyboard path:** search, menu, theme switch, preview controls, anatomy toggle and labels, copy buttons, footnote references and backlinks.
- Footnote references are at least 24px tap targets.

# 02 — Design system: postkit.org

The site's look in one place. Values live in `tokens/tokens.json`, and `tokens/ts/theme.ts` turns them into a Chakra v3 system for `libs/site-theme`. Boards win on layout and copy; the specs win on behaviour and rules (same rule as 08). Note any difference in your ticket summary.

Postkit's **component** styling (`postkitDefaultTheme`, the headless `styles.css`) is separate and lives in the packages (03). The site layers its own system over it through `PostkitProvider`'s `system` prop.

---

## 1. Principles

- **Quiet until touched.** White page, near-black text, one grey for the second half of every headline. Colour shows up only for links, focus, tones, and the brand gradient's few fixed places.
- **Two-tone headlines.** Every title is a statement in `fg`, then a value line in `fg.quiet`: "Callout. Make sure the important part gets read." Write both halves. Never set a page title without the grey half.
- **Show the component, not a picture of it.** Previews on the site are live components.
- **One mark.** The gradient pill is the logo, the favicon, the active indicator and the sidenote edge. No other icon system for the brand.

## 2. Typography

| Style | Size | Weight | Line height | Tracking | Where |
|---|---|---|---|---|---|
| hero | clamp(44, 6.4vw, 88) | 500 | 1.04 | −0.03em | Home |
| pageTitle | clamp(40, 5.6vw, 76) | 500 | 1.04 | −0.03em | Component, note, notes index, result pages (each board sets its own max: 64–80) |
| section | clamp(34, 4.4vw, 56) | 500 | 1.08 | −0.03em | Home sections |
| docsH2 | 28 | 500 | 1.15 | −0.02em | Docs and component page sections |
| prose | 19 (17 under 760) | 400 | 1.65 | — | Notes article |
| body | 17 | 400 | 1.5 | — | Default |
| small | 15 / 14 / 13 | 400 | 1.5 | — | Descriptions, labels, metadata |
| mono | 13–14 | 400/500 | — | — | Package names, props, code |

- **Families:** Suisse Int'l (Ryan provides the licence and files), with Inter Tight as the fallback the boards use. Mono is JetBrains Mono.
- **Weights:** 400 and 500 only. 600 is reserved for the tick and "!" badges.
- **Two tones:** the grey half is `fg.quiet` and the same weight. Use a `<span>` inside the heading, never a second heading.

## 3. Colour and dark mode

The full table is in `tokens.json` → `color`, and on the **Colour tokens** board.

- **Surfaces:** `bg` (page), `bg.subtle` (tiles, code, cards, inputs), `bg.hover`, `bg.pressed`, `bg.raised` (selected segment, kbd), `bg.inverted` (primary buttons), `bg.code` (terminals), `bg.glass` (header), `bg.scrim` (dialogs), `bg.commune` (always black).
- **Text:** `fg`, `fg.secondary`, `fg.muted`, `fg.quiet`, `fg.inverted`, `fg.onCode`.
- **Accent** `#2F5BE3` (dark `#728FEC`): in-copy links and focus rings only. Never a button fill.
- **Tones:** note, tip, important, warning, caution. Each has a matching tint: the tone at 12% over white in light, and 22% over `bg` in dark. Tints are computed so that a host's custom accent still produces the right tint in both themes.
- **Gradient:** `linear-gradient(90deg, #D4B8FF, #F4A3BE 32%, #FF8B57 64%, #F3C460)`. It appears only on:
  - the logo pill (100°);
  - the active header-nav bar;
  - the docs current-page pill (vertical);
  - the active sidenote edge (vertical);
  - the 4px rule above the Commune band;
  - the 12px band on share images;
  - note covers (the softer `cover` stops).

  Never on text, buttons or large fills.

**Dark mode**
- **Mechanism:** semantic tokens with `_dark` values, a class on `<html>` set by next-themes, and System as the default. The footer switch is the only control.
- **What flips:**
  - **Primary buttons:** white with dark text.
  - **Code and terminal blocks:** `#161618`, between the page (`#0F0F11`) and `bg.subtle` (`#1C1C1E`), with `fg.onCode` text, so they still read as code.
  - **Accent and tones:** lifted (mixed about 32% toward white) for contrast.
  - **Tints:** re-mixed over the dark page.
- **What doesn't flip:**
  - the gradient;
  - the Commune band (black in both themes);
  - share images;
  - emails, which are designed light only, and client dark modes may invert them;
  - the OSS mark and icons, which use `currentColor`.
- **Reference boards:** the eight `*Dark` boards: SiteHomeDark, PhoneHomeDark, SiteComponentCalloutDark, SiteArticleDark, PhoneArticleDark, SiteDocsPartStylesDark, SiteSearchDark and PhoneMenuOpenDark. Every other page follows from the tokens. If a page looks wrong in dark, fix the token use rather than the page.

## 4. Layout

- **Widths:** one site width, content 1280 (24px gutters), shared by every page, the header, the footer and the docs shell, so the chrome doesn't shift as readers move around the site (decided 10 Nov 2026; the boards draw most pages at 1120). Docs main column 720, prose 680.
- **Notes sidenotes:** 192px wide, 28px from the column. They switch to end notes at 1199px.
- **Breakpoints:** phone is `max-width: 760px` (Chakra `md` = 761px and up), `xl` 1200 (sidenotes), plus two local media queries: the Commune band at 767 and the Made with OSS rows at 1100.
- **Rhythm:**
  - Sections on Home are 96–120px apart, 64px on phones.
  - Docs `h2`s are 72px apart.
  - Rows in lists and tables are separated by a 1px `border` with 12–18px vertical padding.
- **Radii:**
  - Pill buttons, chips and search: `full`.
  - Tiles and panels: 16–28px (the canvas uses 28 for big panels and 16 for tiles).
  - Code and inputs: 12–14.
  - Kbd: 6.

## 5. Components (site chrome)

Each maps to boards. Build them in `apps/site/src/components` from Chakra primitives and the tokens. They are site components, not Postkit components.

| Component | Notes | Boards |
|---|---|---|
| Header | Glass, sticky, nav bar on the bottom edge, search trigger, Get started, phone menu button | every page |
| PhoneMenu | Full-screen sheet | PhoneMenuOpen |
| SearchTrigger / SearchDialog | Pill with ⌘K; icon on phones. Dialog: input, grouped results, footer hints | SiteSearch, SiteSearchEmpty, PhoneSearch |
| Footer | Four columns, bottom row with OSS badge and theme switch | every page |
| CommuneBand | 4px gradient rule, then the black band, "By" and the wordmark | every page |
| ThemeSwitch | Radiogroup, 3 × 30×24 buttons on a `bg.subtle` track | footer |
| Button | `primary` (bg.inverted) and `secondary` (bg.subtle), 40–48px tall, `full` radius | everywhere |
| SegmentedControl | Track `bg.subtle`, selected `bg.raised` plus the segment shadow, unselected text `fg.muted` (the boards' `#4A4A4E`) | renderer panel, Usage tabs, Assemble/Explode |
| DocsNav / DocsMenu | Sticky list, gradient pill on the current page; a disclosure on phones | Docs boards |
| Toc ("On this page") | Gradient pill on the active section; scroll-spy | Component and docs boards |
| ComponentTile | Live preview on bg.subtle, then name and a two-line description | SiteComponents |
| ComponentPreview | Panel with tweak controls generated from the manifest | Component boards |
| PropsTable | See 01 §6.4 | Component boards |
| AnatomyDiagram | See 01 §6.3 | Component boards |
| SubscribeCard / SubscribeForm | Six states (04 §2) | SiteNotes, SiteSignupStates |
| ResultPage | Mono label, two-tone title, lede, actions | Confirmed, Expired, Unsubscribed, 404 |
| Kbd | 20px tall, 6px radius, `bg.kbd` (white in light, `#0F0F11` in dark, as on the boards) with an inset hairline | search |

## 6. Interaction, focus and motion

These come from the **Interaction states** board, which shows every control in default, hover, focus, pressed or current, and disabled or error.

- **Focus:** a 2px `accent` ring with a 2px offset that follows the control's radius, on `:focus-visible` only. Never remove an outline without replacing it.
- **Hover:** colour only, 120ms ease-out. Nothing moves or grows.
  - Primary buttons go to `bg.invertedHover`; secondary to `bg.hover`.
  - In-copy links thicken their underline from 1px to 2px.
  - Header links get a 2px `border.hover` bar. Tiles go to `bg.hover` and show "›".
- **Pressed:** buttons scale to 0.98 while held. Links and tiles only darken.
- **Current:** the gradient bar (header), the gradient pill (docs nav, TOC), and the raised segment.
- **Disabled:** `aria-disabled` with opacity 0.35–0.45. Don't remove the control. Errors use `tone.caution`, a 2px inset ring and a message below with an "!" badge.
- **Copy:** the label changes to "Copied" with a tip-green tick, is announced through `aria-live="polite"`, and reverts after 1.6s.
- **Footnotes:**
  - Hovering or focusing a reference tints it and lights its sidenote (the gradient edge, `fg` text).
  - Jumping to an end note tints that note, and the tint fades over 1.5s.
  - Backlinks (↩) return focus to the reference.
- **Touch:** no hover states. Every target is at least 44×44, with two exceptions that meet WCAG 2.5.8's 24×24 minimum: inline footnote references, and the footer theme switch (30×24 buttons).
- **Reduced motion:** no scaling, no fades and no anatomy animation. State changes are instant.

## 7. Iconography

- **Brand:** the gradient pill only (05 has the icon set).
- **UI icons:** search, menu and close, theme (monitor, sun, moon), arrows (›, ↗, ↩) and tone marks. Inline SVG at a 1.5–1.6 stroke, using `currentColor`. Use the text glyphs › ↗ ↩ where the boards do.
- **The OSS mark:** `assets/brand/oss.svg`, rendered with `currentColor`.

## 8. Checks before a page is done

1. It matches its board at 1440 and 390, and has no horizontal overflow at 320.
2. It's correct in dark. Toggle the footer switch and compare against the nearest `*Dark` board.
3. Every two-tone heading has its grey half.
4. The gradient appears only in the places listed in §3.
5. Keyboard: every control can be reached and shows a focus ring, and dialogs trap focus and give it back on close.
6. No hard-coded colours outside `libs/site-theme`.

# 03 — Component system (packages)

The package-side spec the site depends on. It was written before the site design and has been updated for it (v4, 7 Nov 2026: §5.5, §6.1, D14 confirmed, D15–D17; v5, 10 Nov 2026: §8 restructured so everything ships in 0.3.0 with the site launch, D18–D19). The site tickets in 06 that need package work point here.

**Repo:** github.com/postkit-org/postkit-js (`main` @ `1bed29a`, v0.2.0)
**Status:** v5. D1–D20 decided between 5 and 10 Nov 2026. Branch `v0.3.0` (`973776a`) holds the `@postkit/chakra` rename.
**Consumers to keep working:** Prismark (Spec 19, `@postkit/prismark`), prismark.app site, commune.software (COM-015 media blocks), playstack.dev

---

## 0. Where things stand

Postkit is already a serious library. It has 35 components in six categories and framework adapters for Next, React Router, TanStack Router and Astro. It also ships an email renderer, a portable document format in `@postkit/core`, `@postkit/unfurl`, and a generated catalog manifest. Theming is Chakra-native, with a typed slot-recipe override contract. The problems are about managing the code, not about missing features.

| # | Finding | Evidence | Cost |
|---|---|---|---|
| F1 | **One component lives in 13 files across 3 packages.** | Adding or changing `KeyTakeaway` touches: `declarations.ts`, `component-catalog.ts`, `theme-contract.ts` (slot map + variant map + override key), `theme.ts` (recipe keys + registration), `publication.recipe.ts`, `publication.tsx`, `mdx-components.ts`, `index.ts`, the Astro `KeyTakeaway.astro`, `react-bridges.tsx`, `components.ts`, the site preview and the docs. | Every change is a scavenger hunt, and the hand-written slot and variant maps can drift from the recipes. |
| F2 | **Category files are monoliths.** | `publication.tsx` is 1,079 lines (10 components), `technical-content.tsx` 877, `declarations.ts` 1,217. | Hard to review, hard to eject, and hard for an agent to edit safely. |
| F3 | **The component set is closed.** | `PostkitComponentName` is a hard-coded union. The remark plugin, catalog and manifest read only the built-in declarations. | A site or Prismark workspace can swap a renderer through `createPostkitMdxComponents({ components })`, but it can't add a component that directives, the manifest and Prismark understand. Commune's `Device` has nowhere to go. |
| F4 | **There's no way to pick a subset.** | `postkitMdxComponents` imports all 35, and the manifest always describes all 35. | Heavier bundles for sites that use five components, and Prismark has to filter by hand. |
| F5 | **The catalog contradicts the code on email.** | Every entry says `email: 'not-defined'`, yet `@postkit/email` ships Callout, Aside, CallToAction, Figure, Audio and Video. | Support is declared by hand instead of detected. |
| F6 | **The contract lives in the React package.** | Declarations, directive validation and the catalog are in `@postkit/react`, which depends on `@postkit/unfurl`, unified and Chakra peers. | Non-React consumers (email builds, Prismark's manifest tooling, a future CLI) take React with them. |
| F7 | **There are leftover scaffold packages.** | `packages/async`, `colors`, `strings` and `utils` are `@org/*` at 0.0.1, unpublished and unused. | Noise in the graph and in agents' context. |
| F8 | **Customization stops at styles.** | Per instance: `slotStyles`, `rootProps`, `unstyled`, a few node props (`icon`). Per site: `preset`, `system`, `createPostkitTheme`. | Nothing sits between "restyle a slot" and "replace the whole component and lose its contract." |
| F9 | **Naming drifts.** | "PostKit" appears 273 times (247 lines, 59 files on `v0.3.0`): docs, AGENTS.md, READMEs, but also source strings (`component-catalog.ts`), `component-manifest.json`, `libs/content`, `tools/`, `.github/`, `examples/` and `apps/site`. | Small, but it shows up on the site and in error messages. |

---

## 1. Goals

1. **One component, one folder, one definition.** Everything else (types, slot maps, MDX map, manifest, Astro bridges, docs stubs, support matrix) is derived from the definition or generated from it.
2. **An open registry.** A site, Prismark workspace or third-party package defines components the same way Postkit does, and they get directives, validation, the manifest and theming for free.
3. **A customization ladder.** Each step up gives more control while keeping the portable contract, so authored MDX and Prismark never break because a site restyled something.
4. **Pay for what you use.** Kits and per-component imports, and a manifest of exactly the enabled set.
5. **Keep what works:** Chakra-native theming, host-native by default, the portable document model, the release gates.

---

## 2. The component unit

### 2.1 Folder layout

```
packages/core/src/components/callout/
  callout.definition.ts        # the contract: props, anatomy, example
  callout.behavior.ts          # framework-free behaviour, if any (none for Callout)
  callout.behavior.spec.ts     # shared behaviour tests every renderer must pass
packages/react/src/components/callout/
  callout.tsx                  # headless view: anatomy + ARIA, no styles
  callout.css                  # its slice of the optional styles.css baseline
  callout.spec.tsx
packages/chakra/src/components/callout/
  callout.recipe.ts            # Chakra slot recipe, slots typed from the anatomy
  callout.tsx                  # Chakra view
  callout.spec.tsx
packages/email/src/components/callout.tsx       # optional email view
packages/astro/src/components/Callout.astro     # GENERATED
libs/content/components/callout.md              # site docs: tagline, anatomy layers, usage notes (site 01 §5.4)
```

That is still one folder per component *per renderer*. The generator (§4, rung 8) creates all of them at once, and `components:generate` fails CI if a definition has no view in a renderer that claims its kit.

Category monoliths (`publication.tsx` and the rest) split into these folders one PR per category, with no API change.

### 2.2 `definePostkitComponent`

The definition is framework-free. It lives in `@postkit/core` (see §5) and replaces both the declaration and the catalog enrichment:

```ts
// callout.definition.ts
import { definePostkitComponent, prop, presentation } from '@postkit/core/components';

export const calloutDefinition = definePostkitComponent({
  name: 'Callout',
  directive: 'postkit-callout',
  category: 'article-structure',
  description: 'A highlighted note, tip, warning, or caution.',
  children: 'mdx',
  runtime: 'static',                 // static | native-controls | client | resolver
  stability: 'initial',              // initial | experimental | stable | deprecated (today's manifest uses 'initial' for all 35)
  props: {
    ...presentation,                 // size, variant
    title: prop.string('An optional heading.'),
    tone: prop.enum(['note', 'tip', 'important', 'warning', 'caution'], {
      description: 'The semantic emphasis.',
      default: 'note',
      themeVariant: true,            // becomes a recipe variant automatically
    }),
  },
  slots: ['root', 'icon', 'content', 'title', 'body'],
  keywords: ['note', 'admonition', 'alert'],
  example: { props: { tone: 'tip', title: 'Keep the content' }, children: 'Change the renderer without changing the article.' },
});
```

From this one object:

| Derived by **types** (no codegen) | Generated by **`npm run components:generate`** |
|---|---|
| Prop types for the view (`PostkitPropsOf<typeof calloutDefinition>`) | `component-manifest.json` (per kit and the full set) |
| Slot union → `PostkitThemeSlotMap['callout']` | Astro `.astro` wrappers and bridge entries |
| Variant union → `PostkitThemeVariantMap['callout']` | The support matrix (which packages export a view) |
| Recipe key `postkitCallout` | Docs frontmatter and the site catalog page |
| MDX map entry and directive registration | `llms.txt` component section |

**Rule:** derive in types wherever possible, and generate only what TypeScript can't express (JSON, `.astro` files, docs). `catalog:check` already fails CI on drift; it extends to every generated file.

### 2.3 Views read the definition

Headless (`@postkit/react`):

```tsx
export const Callout = postkitView(calloutDefinition, ({ props, part }) => (
  <aside {...part('root')}>
    <span {...part('icon')} aria-hidden="true">{props.icon ?? marks[props.tone]}</span>
    <div {...part('content')}>
      {props.title && <p {...part('title')}>{props.title}</p>}
      <div {...part('body')}>{props.children}</div>
    </div>
  </aside>
));
```

Chakra (`@postkit/chakra`), with the same definition plus a recipe:

```tsx
export const Callout = postkitChakraView(calloutDefinition, calloutRecipe, ({ props, part }) => (
  <Alert.Root as="aside" status={toneStatus[props.tone]} {...part('root')}>
    <Alert.Indicator {...part('icon')}>{props.icon ?? marks[props.tone]}</Alert.Indicator>
    <Alert.Content {...part('content')}>
      {props.title && <Alert.Title {...part('title')}>{props.title}</Alert.Title>}
      <Box {...part('body')}>{props.children}</Box>
    </Alert.Content>
  </Alert.Root>
));
```

`part(name)` returns the anatomy attributes, the `classNames` entry, the slot override (rung 5) and, in Chakra, the recipe class and `css` merge. `postkitView` takes over what each component does by hand today: applying `unstyled`, merging `slotStyles` and `rootProps`, validating props in development, and applying site overrides (§4). That boilerplate (`rootParts`, `postkitSlotClassName`, `css={[...]}` arrays) is currently repeated in every component.

---

## 3. The open registry

### 3.1 `createPostkit`

One call configures everything a host needs, from the set it actually uses:

```ts
// libs/content/src/postkit.ts (in a site)
import { createPostkit } from '@postkit/react';
import { article, technical, media } from '@postkit/react/kits';
import { chakra } from '@postkit/chakra';          // omit for headless views
import { deviceDefinition, Device } from './components/device';

export const postkit = createPostkit({
  renderer: chakra,
  kits: [article, technical, media],
  exclude: ['Poll'],
  components: [{ definition: deviceDefinition, view: Device }],   // your own
  defaults: { Callout: { variant: 'plain' } },   // rung 4 (§4)
  overrides: { /* rungs 5–6, §4 */ },
  link: NextLink,                      // or use @postkit/next, which sets this
});

postkit.Provider          // PostkitProvider bound to this set + overrides
postkit.mdxComponents     // only the enabled components + prose
postkit.remarkPlugins     // directives validate against this set
postkit.manifest()        // postkit.component-catalog v2 for this set
```

- **Kits** are the six existing categories as entry points: `@postkit/react/kits/article`, `/technical`, `/media`, `/discovery`, `/engagement`, `/publishing`. Individual components remain importable for full tree-shaking. `@postkit/react` root keeps exporting everything for 0.x compatibility.
- **Third-party packages** export `{ definition, view }` pairs and a manifest. That is exactly what Prismark's per-workspace "component packages" setting (Spec 19) needs.
- **Unknown components** keep today's behaviour: strict mode fails the build with file and line.
- The framework adapters (`@postkit/next` and the others) become thin `createPostkit` presets that set `link`. Today `@postkit/next` exports only `createPostkitNextComponents()` (internal links through `next/link`, native anchors for external URLs, hashes and downloads). That stays as the low-level export. Adapters don't handle images: image optimisation is the host's job.

### 3.2 Manifest v2

`postkit.component-catalog` v2 adds `package`, `kit`, `stability`, computed `support`, `slots` and `variants`, and per-prop `default` and `themeVariant`. v1 stays readable, and Prismark's parser takes either. A package publishes `component-manifest.json`, and a host merges manifests for exactly what it enabled.

---

## 4. The customization ladder

Each rung keeps the definition (props, directive, manifest), so authored content and Prismark keep working at every level.

| Rung | What you change | How | Scope |
|---|---|---|---|
| **1. Props** | One instance | `variant`, `size`, `tone`, `layout`… | Author |
| **2. Tokens** | Fonts, colours, spacing everywhere | Chakra: host `system`, `typography`. Headless: `--postkit-*` custom properties in `styles.css` | Site |
| **3. Part styles** | A component's look | Chakra: `createPostkitTheme({ callout: { base, variants } })` (exists today). Headless: CSS on the anatomy, or `classNames` per part (Tailwind-friendly) | Site or subtree |
| **4. Defaults** | What authors get without asking | `createPostkit({ defaults: { Callout: { variant: 'plain' } } })`. `@postkit/chakra` writes theme-variant props (`variant`, `size`, `tone`) into the recipe's `defaultVariants`, which rung 3 can also set directly; other props become the view's defaults (D18) | Site |
| **5. Slot parts** | One part of the markup | `overrides.Callout.slots = { icon: InkMark }` — the part receives the slot's props and styles | Site |
| **6. View** | The whole render | `overrides.Figure.view = CommuneFigure`, built with `postkitView(figureDefinition, …)`, so it gets the same typed props, recipe and slots | Site |
| **7. Eject** | The source itself | `npx postkit eject figure --renderer chakra --to libs/postkit` copies that renderer's view (and recipe) into your repo, still bound to the upstream definition and behaviour | Repo |
| **8. New component** | Something Postkit doesn't have | `npx postkit new device` or `nx g @postkit/nx:component device` scaffolds the §2.1 folder | Repo |

Rungs 4–6 are new and close the F8 gap. Rung 7 is the shadcn-style escape hatch, with one difference: **the contract stays upstream**. An ejected `Figure` still imports `figureDefinition` from `@postkit/core`, so its directive, validation and manifest entry don't fork. `postkit diff figure` shows what upstream changed since you ejected.

The Commune site is the proving case:
- Rung 3 (recipes) for the all-ink look
- Rung 6 (view) for its peek `Carousel`, if the upstream variant (§7) doesn't cover it
- Rung 8 (new component) for `Device`, upstreamed later if it earns it

---

## 5. Package architecture

**Decided 5 Nov:** Chakra moves out of `@postkit/react` into `@postkit/chakra` (work already in progress). Postkit offers headless, styleable views, with web components possible later. That gives three renderer layers over one contract.

### 5.1 One anatomy, many renderers

The definition's `slots` are the **anatomy**: the named parts every renderer must emit. Every renderer stamps the same two attributes on each part:

```html
<aside data-postkit-component="Callout" data-postkit-part="root" data-tone="tip" data-size="md" data-variant="subtle">
  <span data-postkit-part="icon" aria-hidden="true">…</span>
  <div data-postkit-part="content">…</div>
</aside>
```

So the same names style the component everywhere:

| Renderer | How a part is styled |
|---|---|
| `@postkit/chakra` | Slot recipe keyed by part (`createPostkitTheme({ callout: { base: { icon: … } } })`) |
| `@postkit/react` (headless) | Plain CSS or any CSS-in-JS: `[data-postkit-component="Callout"] [data-postkit-part="icon"]`; or `classNames={{ icon: '…' }}` for Tailwind |
| `@postkit/elements` (web components) | `postkit-callout::part(icon)` plus CSS custom properties |

The anatomy also carries state as data attributes (`data-state="open"`, `data-current`, `data-tone`), following the Ark UI conventions that Chakra v3 already uses. That keeps the headless and Chakra layers aligned.

### 5.2 Packages

```
@postkit/core           document model, parsers, serializers
  └ /components         definePostkitComponent, prop builders, anatomy, validation,
                        manifest types + generation, built-in definitions   ← moved out of react (F6)
@postkit/unfurl         unchanged
@postkit/react          HEADLESS: views emitting the anatomy, behaviour hooks
                        (useCarousel, useCodeCopy, useTabs, usePoll…), createPostkit,
                        kits, MDX map, remark plugin. No Chakra, no Emotion.
  └ /styles.css         optional: a small, token-driven stylesheet (CSS custom properties)
                        so headless isn't unstyled-by-force — the "styleable" baseline
@postkit/chakra         Chakra views + recipes + postkitDefaultTheme + createPostkitTheme
                        + createPostkitSystem. Composes the headless hooks and Chakra
                        primitives (Alert, Card, Carousel…). Today's behaviour, moved.
@postkit/elements       LATER: custom elements generated from definitions; light DOM for
                        prose-flow components, shadow DOM + ::part for interactive ones
@postkit/email          email views keyed by the same definitions
@postkit/shiki          lazy Shiki adapter; feeds a renderer-neutral highlight interface
                        (Chakra's CodeBlock adapter is one consumer of it)
@postkit/next | react-router | tanstack-router   createPostkit presets (link)
@postkit/astro          generated wrappers; picks chakra or headless views
@postkit/cli            add | eject | diff | new | manifest   (bin: postkit)
@postkit/nx             component generator for Nx repos (also used in this repo)
@postkit/prismark       moves in once @prismark/component-protocol is published
```

- **Delete** `packages/async`, `colors`, `strings` and `utils` (F7).
- **Dependency order:** `core` → `react` (headless) → `chakra` and `email` → adapters, `astro`, `elements`, `cli`. `cli` depends only on `core` plus file tooling.
- **Choosing a renderer** is one argument: `createPostkit({ renderer: chakra, kits })`, where `chakra` comes from `@postkit/chakra`. Omitting it gives the headless views. Kits are renderer-neutral lists of definitions; each renderer package supplies the views for them.
- **Migration (D11):** `@postkit/react` is headless from 0.3.0, with no compatibility shim. Today's components are in `@postkit/chakra` (branch `v0.3.0`). This is the one deliberate break before 1.0, and the migration guide leads with it.

### 5.3 What headless owns vs. what Chakra owns

| Concern | Headless (`@postkit/react`) | Chakra (`@postkit/chakra`) |
|---|---|---|
| Semantic markup, landmarks, ARIA | ✓ | Inherits |
| Behaviour (carousel paging, copy, tabs, poll, consent-to-embed, resolvers) | ✓ hooks | Uses the hooks |
| Prop validation, defaults, overrides (rungs 4–5) | ✓ | Inherits |
| Anatomy attributes | ✓ | Adds recipe class names alongside |
| Visual design | `styles.css` baseline (optional) | Recipes, tokens, `postkitDefaultTheme` |
| Host design system integration | Class names or CSS | Host Chakra `system` flows through |

The rule that keeps this manageable: **behaviour is written once, in the headless hook.** A Chakra view, and later a web component, is markup and styling around that hook. Where Chakra already owns the behaviour (its `Carousel` and `Tabs`, which are Ark under the hood), the Chakra view may use Chakra's version. The headless hook must still pass the same behaviour tests, which are shared per component in `component.behavior.spec.ts`.

### 5.4 Web components (later phase)

- Generated from definitions: tag `postkit-{directive-suffix}` (`postkit-callout`), attributes from props, slots from `children: 'mdx'`.
- Static components (most of the catalog) render as light-DOM custom elements, so prose styles and the host's CSS apply.
- Interactive ones (Carousel, Tabs, CodeBlock copy, Poll, the embed consent in LinkPreview and SocialPost) reuse the behaviour logic. That logic must therefore sit in framework-free state machines, not in React hooks. **Implication for now:** write the behaviour in `@postkit/core/behaviors` as plain TypeScript (or Zag machines, which Ark and Chakra use), and make the React hooks thin wrappers. That costs little today and keeps the web-component option open.
- Payoff: one Postkit for Astro without React islands, for plain HTML from `@postkit/core`'s serializer, and for any CMS that can't run React.

### 5.5 Dark mode (from the site, D17)

postkit.org ships light and dark, and every Postkit component on it must follow the host's colour mode without per-site overrides:

- **`@postkit/chakra`:** recipes use semantic tokens only (no raw hex, no `white`/`black`). `postkitDefaultTheme` defines `_dark` values for every semantic colour it introduces, including tone and tint. Tints are computed from the tone, so a host accent still gives correct tints in both modes.
- **`@postkit/react` `styles.css`:** `--postkit-*` properties get dark values under `@media (prefers-color-scheme: dark)` *and* under `.dark, [data-theme="dark"]`, so class-based hosts (next-themes) work.
- **Exceptions:** `@postkit/email` stays light (email clients handle dark themselves). `CodeBlock` and `Terminal` keep their own dark surface in both modes.
- **Done when:** the site's `*Dark` boards render correctly using only the host's tokens, and a fixture with `next-themes` passes visual checks in both modes.

---

## 6. Email parity

- The support matrix becomes computed. A component is `email: supported` when `@postkit/email` exports a view for its definition. Otherwise the email renderer applies a **declared fallback** from the definition (`email: { fallback: 'link' | 'text' | 'omit' }`). This fixes F5 and makes email gaps visible on the site.
- Start with the six that already exist, then add KeyTakeaway, PullQuote, Steps, Stat, ProductCard and LinkPreview (as a static card). These are what Newsbetters and Commune's drop and post emails will want.

### 6.1 `renderEmail()` (D15)

Today `@postkit/email` exports the email views and `PostkitEmailProvider`. The host assembles them and calls Chakra Email's `render()`. Nothing goes straight from an authored post to an email. Add one function:

```ts
import { renderEmail } from '@postkit/email';

const { html, text, warnings } = await renderEmail(source, {
  format: 'mdx',                    // 'mdx' | 'markdown' | 'document' (a @postkit/core document)
  theme,                            // optional Chakra Email theme; defaults to the light Postkit email theme
  baseUrl: 'https://postkit.org',   // resolves relative links and images
  components,                       // optional overrides, keyed by definition (same as the site)
  wrapper,                          // optional layout component (header, footer, unsubscribe)
});
```

- **Pipeline:** parse with `@postkit/core` (same validation as the site), map each node to its email view, or to its declared fallback (§6), then run Chakra Email's `render()`. It returns both HTML and plain text.
- **Unknown or unsupported components:** the definition's fallback applies, and `renderEmail` returns `warnings[]`. It never throws on content the site renders.
- **Where it lives:** `@postkit/email`, not the framework adapters. Email is rendered in scripts, scheduled jobs and queue workers as often as in a Next.js page, so it mustn't depend on a framework.
- **First consumers:** postkit.org's release email (site 04 §4), then Newsbetters.

---

## 7. Catalog changes

These follow from consumers we've already specced:

| Change | Why | Source |
|---|---|---|
| `Carousel` `presentation: 'peek'` (centred item, neighbours at 35%, arrows only, caption in `aria-live`, no auto-advance) | Commune entry hero | COM-015 |
| `Gallery` `presentation: 'row'` (2–3 items, snap rail on phone) instead of a new `FigureRow` | Same need, fewer components | COM-015 |
| `Video`: `captions` (track src), `duration`; a missing `captions` track gives a validation **warning** (development and build output) unless `decorative`, and never fails the build, even in strict mode (D20) | A11y rule already in the Commune spec, softened so sites can embed video they didn't make | COM-015, Commune §11 |
| `Device` (`kind: iphone \| ipad \| mac`, `src`, `alt`, `caption`) | Product pages, Prismark site | COM-015 |
| Figure auto-numbering (`<PostkitProvider figures="numbered">`) | Commune "Fig. 1, 1b…" | Commune §6.10 |
| `Callout`: `tone` stays canonical; accept `type` as an alias in directives | Resolves Prismark Spec 19 Q1 without breaking either side | Prismark Q1 |
| `stability` per component (`experimental` for Poll, Chart, SocialPost until reviewed) | Honest catalog; Prismark can hide experimental ones | — |
| `Footnote` + `Footnotes` join Kit 1; `Aside` becomes the authored sidenote (see §7.1) | Footnotes are a literal-text fallback in core today | Footnotes board |

### 7.1 Footnotes and sidenotes

Today `remark-gfm` parses footnotes in the Chakra preset, but `@postkit/core` keeps `footnoteReference` and `footnoteDefinition` as literal text, so email, feeds, serialization and Prismark lose them.

**Core vocabulary.** Two portable nodes: `footnoteReference { identifier, label }` (inline) and `footnoteDefinition { identifier, children }` (block). Validation: a reference with no definition fails the build with its position; an unreferenced definition is a warning. Numbering follows the order of first reference; source labels are ids, never numbers. Repeated references share one note with backlinks `a`, `b`, … Ids are prefixed per document (`fn-{slug}-1`) so feeds and index pages that show several posts never collide.

**Authoring.** GFM `[^id]` + `[^id]: …` (default), inline directive `:footnote[…]`, and `::footnotes` / `<Footnotes />` to place the list (otherwise it closes the article).

**Components (Kit 1).**

| Component | Parts | Notes |
|---|---|---|
| `Footnote` | root · marker | The reference link. `marker: superscript \| bracket \| pill`. Line height held at 0; 24px minimum tap target. |
| `Footnotes` | root · title · rule · list · item · number · content · backlink | The list. `title` defaults to "Notes", `false` hides it. Jumped-to note gets `--postkit-footnote-target-bg` until the reader returns. |
| `Sidenote` (internal view) | root · number · content | Rendered by `placement: 'side'`; shares the margin column with `Aside`. |

**Props** (site config, overridable per article in front matter): `placement: end | side | popover | inline` (default `end`), or a responsive object such as `{ base: 'inline', md: 'end', xl: 'side' }` (postkit.org uses exactly that); `side` still falls back to `end` when the margin runs out, `marker`, `numbering: decimal | lower-roman | lower-alpha | symbol | fn`, `variant` (default `subtle`), `size`, `title`, `backlinks` (default `true`), `sideBreakpoint` (default 1024px). Popover uses the native `popover` element anchored to the mark; popover and inline enhance the end list and never replace it, so print and no-script still work. `side` falls back to `end` below the breakpoint or when the margin runs out; collisions push the later note down.

**Tokens:** `--postkit-footnote-accent`, `-marker-color`, `-marker-size`, `-number-color`, `-number-size`, `-text-size`, `-text-color`, `-rule`, `-rule-width`, `-target-bg`, `--postkit-sidenote-width` (232px), `--postkit-sidenote-gap` (48px).

**Renderers.** Headless/Chakra: everything above. Email: always end notes, superscript numbers without links (in-message anchors are unreliable across clients). Plain text / llms.txt: `[1]` marks and a numbered list. Prismark: marks as chips, notes edited in place, live renumbering, rendered in the site's house style from the same config.

---

## 8. Plan

Everything below ships together as **0.3.0**, and postkit.org launches the same day (D19). Each step is one PR into branch `v0.3.0`, green on `verify:release`. Nothing is published to npm until step 12, so unreleased APIs can change freely between steps; the one public break (D11) reaches users once, in 0.3.0.

Steps follow their dependencies, and the ones the site is blocked on are pulled forward so site work (06) runs alongside. Once step 2 is in, steps 3 and 4 can run in parallel; 5 and 6 both follow 4.

| # | Step | Needs | Unblocks on the site (06) | Done when |
|---|---|---|---|---|
| 1 | Clean-up: delete `@org/*` packages; "Postkit" casing everywhere (D16, including `libs/content` frontmatter titles); licence (MIT) and domain (postkit.org) in the Commune catalog | — | PK-001 (the same work) | `package:check` and `docs:check` pass; `git grep PostKit` finds nothing |
| 2 | **`@postkit/chakra` lands** (branch `v0.3.0`, already a clean rename); `packages/react` is recreated empty for the headless layer | 1 | PK-003 onward | Every existing example and `consumer:check` pass against `@postkit/chakra` |
| 3 | **Dark mode in `@postkit/chakra`** (§5.5): recipes use semantic tokens only; `_dark` values for every `postkitDefaultTheme` colour, with tints computed from the tone | 2 | Dark checks for PK-013 and PK-030–039 | The site's `*Dark` boards render correctly from the host's tokens; a `next-themes` fixture passes visual checks in both modes |
| 4 | `definePostkitComponent`, prop builders and anatomy in `@postkit/core/components`; build the existing declarations from it | 2 | — | Generated manifest is byte-identical to v1 |
| 5 | `postkitView` (headless) and `postkitChakraView`; migrate **Callout** and **Figure** as the reference pair in both renderers; derive slot and variant maps from the anatomy | 4 | PK-034 (anatomy attributes) | Theme types check (`types:performance:check`) not slower; both renderers emit identical anatomy |
| 6 | Behaviour into `@postkit/core/behaviors` with shared specs: **Carousel**, **CodeBlock copy**, **Tabs**, embed consent | 4 | — | Headless and Chakra both pass the shared behaviour specs |
| 7 | Split the category files into per-component folders, one PR per category; a headless view per component; Astro wrappers generated. Step 3's dark values move with each recipe | 3, 5, 6 | PK-030 Headless tab | 13 touchpoints → 1 definition + 1 view per renderer + generate |
| 8 | `createPostkit` with `renderer`, kits, `defaults` (rung 4, D18) and `overrides` (rungs 5–6); subset manifest v2 with per-prop `default`; the `styles.css` baseline with dark values (§5.5) | 7 | PK-030 Editor tab, PK-033, the Customizing and Reference docs (PK-020) | A fixture site with 3 kits + one custom component passes `consumer:check` in both renderers |
| 9 | Computed support matrix + email fallbacks; remove the hand-written maps; `renderEmail` (§6.1) | 8 | PK-032 Renderers table, PK-053 | Email column correct on the site; the 0.2.0 changelog entry renders to email with no warnings |
| 10 | §7 catalog changes, including Footnotes with responsive placement (§7.1, D13) | 8; 9 for the email footnote view | PK-037 | Commune COM-015 builds on Postkit with no local fork |
| 11 | `@postkit/cli` (`add`, `eject`, `diff`, `new`, `manifest`) + `@postkit/nx` generator | 8 | The CLI, Eject and New components docs (PK-020) | An ejected Chakra Figure still validates directives |
| 12 | **Release 0.3.0 and launch postkit.org**: versions and changesets, the migration guide (leads with D11), the 0.3.0 changelog entry flipped to `released`, then the site goes live | 1–11, and the site's launch checklist (07 §5) | PK-072 | Every package is on npm at 0.3.0, postkit.org is live on it, and `@postkit/react` ships headless for every static component (interactive ones without a behaviour from step 6 are `chakra-only`, per the D11 consequence below) |
| 13 | *After 0.3.0:* `@postkit/elements` from definitions + behaviours, with a thin Zag custom-element adapter (D7) | 12 | — | Static kit renders in Astro without React |

**Sequencing.**
- Branch `v0.3.0` is a clean rename, so the per-component split (step 7) happens directly in `packages/chakra`. Nothing moves twice.
- Dark mode (step 3) goes in before the split because the site can't launch without it and it doesn't depend on definitions. It's written in today's recipe files and moves with each recipe in step 7, so it isn't written twice either.
- Site tickets build against a stated fallback until their step lands (06). No fallback ships at launch.

---

## 9. Decisions and open questions

**Decided 5 Nov 2026**

| # | Decision |
|---|---|
| D1 | Customization goes all the way: overrides (rungs 4–6) **and** eject with `postkit diff` (rung 7), contract kept upstream |
| D2 | Kits are entry points of one package, plus per-component imports |
| D3 | Chakra moves to `@postkit/chakra` (theme + Chakra views). `@postkit/react` becomes headless and styleable. Web components (`@postkit/elements`) stay on the table, so behaviour is written framework-free |
| D4 | Definitions live in `@postkit/core/components` |

| D5 | Postkit's site lives at **postkit.org** (matches the `postkit-org` GitHub org). The Commune catalog entry's domain is now known |
| D6 | Prismark vaults use Postkit's `Callout` with `tone`. `type` is accepted as a directive alias, and Prismark's Standard Callout is retired. This resolves Prismark Spec 19 Q1 |
| D7 | Behaviour engine: **Zag where Chakra uses it** (Carousel, Tabs, and clipboard for code copy), plain TypeScript for Poll and embed consent. Postkit's Zag range follows the Chakra range it supports, so a Chakra host never bundles two copies. Zag has no official vanilla adapter, so `@postkit/elements` will need a thin custom-element adapter we own |
| D8 | The headless `styles.css` baseline carries a **quiet neutral look**: structure, prose rhythm and restrained monochrome, all through `--postkit-*` properties. Postkit's brand identity lives on postkit.org, not in the baseline |
| D9 | The Chakra move is branch **`v0.3.0`**: a clean rename of `@postkit/react` → `@postkit/chakra` (182 files, no component reshaping). The per-component split and definitions work happen inside `packages/chakra`, so nothing moves twice |
| D10 | Once the headless layer ships, Prismark previews use `@postkit/react` + `styles.css`, bundled in its signed build. Its app-owned renderers (Spec 19 §4) are retired, leaving one rendering per component |
| D11 | **`@postkit/react` is headless from 0.3.0.** No shim: anyone upgrading `@postkit/react` from 0.2 must switch to `@postkit/chakra` for today's components. The migration guide and the 0.3.0 changelog lead with this |

| D12 | **Subtle is the default variant** for every component (outline draws an edge, subtle fills a quiet surface, plain keeps structure and type only). Terminal’s subtle surface is ink |
| D13 | **Footnotes are portable.** Core gains `footnoteReference` / `footnoteDefinition`; Kit 1 gains `Footnote` and `Footnotes` with `end`, `side`, `popover` and `inline` placements (§7.1) |
| D14 | **Aside is the authored sidenote:** no tone mark, a step smaller than Callout, placed in the margin beside the text on wide layouts alongside footnotes; a quiet block in the text column below the breakpoint. Confirmed 6 Nov |

**Decided 7 Nov 2026**

| # | Decision |
|---|---|
| D15 | `renderEmail(source, options)` → `{ html, text, warnings }` lives in `@postkit/email` (§6.1). `@postkit/next` doesn't get one |
| D16 | The brand is spelled **Postkit** everywhere. Step 1 renames all 273 "PostKit" occurrences (247 lines, 59 files on `v0.3.0`), in docs, READMEs, AGENTS.md, frontmatter, source strings, the generated manifest, `tools/`, `.github/`, `examples/` and `apps/site`, and updates the tests that assert those strings (e.g. `component-catalog.spec.ts`) |
| D17 | postkit.org ships **light and dark**, so components follow the host's colour mode (§5.5) |

**Decided 10 Nov 2026**

| # | Decision |
|---|---|
| D18 | Site-wide prop defaults are `defaults` in `createPostkit`, keyed by component (`{ Callout: { variant: 'plain' } }`), not `defaultProps`. Chakra v3 has no theme-level `defaultProps` (that was v2); it sets variant defaults with a recipe's `defaultVariants`. So `@postkit/chakra` writes theme-variant defaults into `defaultVariants`, which `createPostkitTheme` already exposes, and keeps other props as view defaults. The same `defaults` object works for the headless renderer |
| D19 | **0.3.0 ships everything in §8, steps 1–12, and postkit.org launches with it** (resolves site 09 Q2). The plan is ordered by dependency with site blockers first, and nothing publishes until step 12 |
| D20 | A `Video` without `captions` warns rather than failing the build, in every mode; `decorative` silences the warning. Not a breaking change in 0.3.0 (decided 10 Nov 2026) |

**Consequence of D11:** 0.3.0 can't publish `@postkit/react` until the headless layer exists. The plan in §8 gates the release (step 12) on that. Either every component has a headless view, or the 0.3.0 headless set is limited to the components that do, with the rest marked `support.react: 'chakra-only'` in the manifest. Default: ship 0.3.0 with all static components headless (most of the catalog). Interactive components whose behaviour isn't in `@postkit/core/behaviors` yet are `chakra-only` until 0.3.x.

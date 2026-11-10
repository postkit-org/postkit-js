# @postkit/site-feeds

Builds the postkit.org notes and changelog feeds (PK-042, handoff 01 §3 and §10):
`/feeds/{notes,changelog}.{xml,atom,json}` as RSS 2.0, Atom and JSON Feed 1.1.

- Entries come from `libs/content`. Drafts are left out in production
  (`selectVisibleNotes`) and `upcoming` changelog entries always are
  (`getReleasedChangelogEntries`).
- Feed documents come from `@chakra-docs/feed`. Its `DocsFeedEntry` has no body
  field, so `createSiteFeed` adds each item's HTML afterwards: RSS
  `<content:encoded>`, Atom `<content type="html">` and JSON Feed
  `content_html`.
- Item HTML goes through `@postkit/core`: the body (directives turned into MDX
  tags by the Postkit remark preset) is parsed by core's safe MDX parser and
  written by `serializePostkitHtml`, with the site as `baseUrl`, so relative
  links and media become absolute.
- Every entry is serialized in full. Each Postkit component becomes core's
  static view: readable markup with its text, including text carried in props
  (a Callout title, KeyTakeaway items, a Terminal command), annotated so
  Postkit-aware readers can rebuild it. The feeds are public, so an
  `AudienceBoundary` shows its fallback, and a `NewsletterSignup` links to
  `/newsletter/subscribe`.
- Every feed is validated before it is written (`validateRss`, `validateAtom`,
  `validateJsonFeed`, with a small strict XML reader). An invalid feed fails the
  build.

The site's `feeds` target (`nx run site:feeds`, which `site:build` depends on)
runs `apps/site/scripts/build-feeds.mts`, which writes the git-ignored
`apps/site/public/feeds/`.

```sh
npx nx test site-feeds
```

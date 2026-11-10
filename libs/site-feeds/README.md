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
  written by `serializePostkitHtml`. Root-relative links become absolute.
- Core renders no markup for components whose content is only in props
  (KeyTakeaway, Steps, PullQuote, Terminal, CodeBlock, LinkPreview, …). An entry
  that uses one gets its summary and a link instead, and the build log says
  which components caused it.
- Every feed is validated before it is written (`validateRss`, `validateAtom`,
  `validateJsonFeed`, with a small strict XML reader). An invalid feed fails the
  build.

The site's `feeds` target (`nx run site:feeds`, which `site:build` depends on)
runs `apps/site/scripts/build-feeds.mts`, which writes the git-ignored
`apps/site/public/feeds/`.

```sh
npx nx test site-feeds
```

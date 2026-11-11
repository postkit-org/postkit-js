// The renderer panel's Headless and Editor documents, rendered at build time. Import from
// `getStaticProps` only: it renders with `react-dom/server` and checks a file on disk.
import { existsSync } from 'node:fs';
import path from 'node:path';

import { Callout } from '@postkit/react';
import { renderToStaticMarkup } from 'react-dom/server';

import { rendererArticle } from './home-content';
import { rendererStylesheetHref } from './renderer-stylesheet';

/** The demo article as `@postkit/react`'s headless views render it: markup and anatomy. */
function HeadlessArticle() {
  const { lead, callout } = rendererArticle;
  return (
    <>
      <p>{lead}</p>
      <Callout tone={callout.tone} title={callout.title}>
        {callout.body}
      </Callout>
    </>
  );
}

function htmlDocument({
  title,
  head = '',
  body,
}: {
  readonly title: string;
  readonly head?: string;
  readonly body: string;
}): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${title}</title>${head}</head><body>${body}</body></html>`;
}

/**
 * The Headless tab: the article through `@postkit/react` with no stylesheet at all, so the
 * browser's defaults are all there is. This is what headless looks like: semantic markup and
 * the named parts (`data-postkit-part`), ready for your CSS. The panel only sets the frame's
 * `color-scheme` to the site's, so the browser draws its dark defaults in dark mode.
 */
export function renderHeadlessArticle(): string {
  return htmlDocument({
    title: 'The article, headless',
    body: `<main>${renderToStaticMarkup(<HeadlessArticle />)}</main>`,
  });
}

/**
 * The editor canvas around the article (the Prismark preview): the page, and the selected
 * block's outline and name tab. Every value is a `--postkit-*` token from the baseline, so
 * the canvas follows its light and dark values with the components.
 */
const editorCanvasCss = `
body {
  margin: 0;
  padding: calc(var(--postkit-space-8) + var(--postkit-space-2)) var(--postkit-space-5) var(--postkit-space-5);
  background: var(--postkit-color-bg);
  color: var(--postkit-color-fg);
  color-scheme: var(--postkit-color-scheme);
  font-family: var(--postkit-font-body, system-ui, sans-serif);
  font-size: var(--postkit-text-md);
  line-height: var(--postkit-leading);
}
main > p { margin: 0 0 var(--postkit-space-8); color: var(--postkit-color-fg-muted); }
[data-editor-block] { position: relative; }
[data-editor-block][data-selected] {
  border-radius: var(--postkit-radius-xl);
  outline: var(--postkit-focus-width) solid var(--postkit-color-accent);
  outline-offset: var(--postkit-space-1);
}
[data-editor-block][data-selected]::before {
  content: attr(data-editor-block);
  position: absolute;
  bottom: calc(100% + var(--postkit-space-2));
  inset-inline-start: calc(-1 * var(--postkit-space-1));
  padding: 0 var(--postkit-space-2);
  border-radius: var(--postkit-radius-sm);
  background: var(--postkit-color-accent);
  color: var(--postkit-color-accent-fg);
  font-size: var(--postkit-text-xs);
  line-height: 1.6;
}
[data-editor-block] > [data-postkit-component] { margin: 0; }
`.trim();

/**
 * The Editor tab: the same article with `@postkit/react` and `@postkit/react/styles.css`,
 * the Prismark preview (03 D10), with the Callout block selected. The stylesheet sets its
 * tokens on `:root`, so it only ever loads inside this frame's own document; the panel sets
 * the frame root's `light` or `dark` class to follow the site.
 */
export function renderEditorArticle(): string {
  assertRendererStylesheet();
  const { lead, callout } = rendererArticle;
  return htmlDocument({
    title: 'The article in the editor preview',
    head: `<link rel="stylesheet" href="${rendererStylesheetHref}"><style>${editorCanvasCss}</style>`,
    body: `<main>${renderToStaticMarkup(
      <>
        <p>{lead}</p>
        <div data-editor-block="Callout" data-selected="">
          <Callout tone={callout.tone} title={callout.title}>
            {callout.body}
          </Callout>
        </div>
      </>,
    )}</main>`,
  });
}

/**
 * The stylesheet is a copy of `@postkit/react/styles.css` that `nx run site:renderer-styles`
 * writes to `public/` before the build. Fail the build, not the page, when it's missing.
 */
function assertRendererStylesheet(): void {
  // A build-time check, not a runtime read: keep it out of the server's file tracing.
  const candidates = [
    path.join(/*turbopackIgnore: true*/ process.cwd(), 'public'),
    path.join(
      /*turbopackIgnore: true*/ process.cwd(),
      'apps',
      'site',
      'public',
    ),
  ].map((directory) =>
    path.join(/*turbopackIgnore: true*/ directory, rendererStylesheetHref),
  );
  if (!candidates.some((file) => existsSync(file))) {
    throw new Error(
      `${rendererStylesheetHref} is missing from apps/site/public. Run \`nx run site:renderer-styles\` (the build and dev targets depend on it).`,
    );
  }
}

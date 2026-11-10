/**
 * Why a warning was raised:
 *
 * - `email-fallback`: a component has no email view, so its definition's
 *   fallback (`text`, `link` or `omit`) was used.
 * - `unknown-component`: a component no definition describes; its authored
 *   content was kept.
 * - `mdx-expression`, `mdx-esm`: MDX code, which never runs in email, was
 *   left out. Literal values (`items={[…]}`) are kept.
 * - `footnote`: a footnote reference without a note, or a note nothing
 *   references.
 * - `parse`: the source couldn't go through Postkit's MDX bridge, so it was
 *   read as plain Markdown.
 * - Any other code is a rule from the site's Markdown validation (the
 *   `remarkPostkit` rule id, such as `unknown-prop`).
 */
export type RenderEmailWarningCode =
  | 'email-fallback'
  | 'footnote'
  | 'mdx-esm'
  | 'mdx-expression'
  | 'parse'
  | 'unknown-component'
  | (string & {});

/** Something `renderEmail` changed or couldn't show, and why. */
export interface RenderEmailWarning {
  readonly code: RenderEmailWarningCode;
  readonly message: string;
  /** The component it concerns, when there is one. */
  readonly component?: string;
  /** The source line and column, when the source is Markdown or MDX. */
  readonly line?: number;
  readonly column?: number;
}

/** Collects warnings once each. */
export class EmailWarnings {
  readonly list: RenderEmailWarning[] = [];
  readonly #seen = new Set<string>();

  add(warning: RenderEmailWarning): void {
    const key = JSON.stringify([
      warning.code,
      warning.message,
      warning.line,
      warning.column,
    ]);
    if (this.#seen.has(key)) return;
    this.#seen.add(key);
    this.list.push(warning);
  }
}

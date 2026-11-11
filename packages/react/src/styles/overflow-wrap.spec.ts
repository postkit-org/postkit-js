// @vitest-environment node
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import postcss, { type Rule } from 'postcss';

/*
 * P18: long identifiers in inline code overflowed a 320px column. The shared
 * component rules let long words break, inline code wrap anywhere, and table
 * cells (which scroll) keep identifiers whole.
 */
const prose = postcss.parse(
  readFileSync(fileURLToPath(new URL('./prose.css', import.meta.url)), 'utf8'),
);

/** The value of `property` in the first top-level `@scope` rule for `selector`. */
function declaration(selector: string, property: string): string | undefined {
  let value: string | undefined;
  prose.walkRules((rule: Rule) => {
    if (value !== undefined || rule.selector !== selector) return;
    if (rule.parent?.type !== 'atrule') return;
    rule.walkDecls(property, (decl) => {
      value ??= decl.value;
    });
  });
  return value;
}

describe('headless overflow wrapping (P18)', () => {
  it('breaks long words in every component', () => {
    expect(declaration(':where(:scope)', 'overflow-wrap')).toBe('break-word');
  });

  it('lets inline code wrap anywhere, but not in code blocks', () => {
    expect(declaration(':where(:not(pre) > code)', 'overflow-wrap')).toBe(
      'anywhere',
    );
  });

  it('keeps identifiers whole in table cells, which scroll', () => {
    expect(declaration(':where(:is(th, td) code)', 'overflow-wrap')).toBe(
      'normal',
    );
  });
});

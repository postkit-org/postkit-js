// @vitest-environment node

import { renderToStaticMarkup } from 'react-dom/server';

import { PostkitProvider } from '../postkit-provider.js';
import { postkitProseRecipe } from '../recipes/prose.recipe.js';
import { createPostkitSystem } from '../create-postkit-system.js';
import { postkitDefaultTheme } from '../theme.js';
import { postkitProseComponents } from './prose.js';

/*
 * P18: long identifiers in inline code overflowed a 320px column (+65px on
 * /docs/create-postkit). Chakra's Code and Link are inline-flex, which size to
 * their longest word unless `overflow-wrap: anywhere` lets them shrink.
 */
const base = postkitProseRecipe.base ?? {};

describe('Prose overflow wrapping (P18)', () => {
  it('breaks long words in the prose column', () => {
    expect(base.root).toMatchObject({ overflowWrap: 'break-word' });
  });

  it('lets inline code and links wrap anywhere', () => {
    expect(base.code).toMatchObject({ overflowWrap: 'anywhere' });
    expect(base.a).toMatchObject({ overflowWrap: 'anywhere' });
  });

  it('keeps code blocks and table cells whole, since they scroll', () => {
    expect(base.pre).toMatchObject({ '& code': { overflowWrap: 'normal' } });
    expect(base.table).toMatchObject({
      '& :is(th, td) :is(code, a)': { overflowWrap: 'normal' },
    });
  });

  it('applies the wrapping to rendered inline code', () => {
    const Code = postkitProseComponents.code;
    const markup = renderToStaticMarkup(
      <PostkitProvider
        system={createPostkitSystem({ preset: postkitDefaultTheme })}
      >
        <Code>createPostkitNextComponents</Code>
      </PostkitProvider>,
    );
    expect(markup).toContain('data-postkit-prose-element="code"');
    expect(markup).toContain('overflow-wrap:anywhere');
  });
});

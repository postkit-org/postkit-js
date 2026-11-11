import { cleanup, render, screen } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { ReactNode } from 'react';

import { PostkitProvider } from '../../lib/provider.js';
import { createPostkitSystem, postkitDefaultTheme } from '../../lib/theme.js';
import { ShareActions } from './share-actions.js';
import { postkitShareActionsRecipe } from './share-actions.recipe.js';

globalThis.structuredClone ??= <T,>(value: T): T =>
  value === undefined ? value : (JSON.parse(JSON.stringify(value)) as T);

const system = createPostkitSystem({ preset: postkitDefaultTheme });

function withProvider(node: ReactNode) {
  return <PostkitProvider system={system}>{node}</PostkitProvider>;
}

afterEach(() => cleanup());

/*
 * P19: axe `label-content-name-mismatch` (WCAG 2.5.3). axe takes every text
 * node in a button as its visible text, aria-hidden ones included, and the
 * accessible name has to contain it, ideally at the start.
 */
describe('Chakra ShareActions names (WCAG 2.5.3)', () => {
  it('names each action by its visible label alone', () => {
    render(
      withProvider(
        <ShareActions
          url="https://x.test"
          label="Share this guide"
          services={['native', 'copy', 'email', 'x']}
        />,
      ),
    );

    for (const label of ['Share', 'Copy link', 'Email', 'X']) {
      const button = screen.getByRole('button', { name: label });
      expect(button.textContent).toBe(label);
      expect(button.hasAttribute('aria-label')).toBe(false);
    }
  });

  it('names the group of actions with the label', () => {
    render(
      withProvider(
        <ShareActions
          url="https://x.test"
          label="Share this guide"
          services={['copy', 'email']}
        />,
      ),
    );

    const group = screen.getByRole('group', { name: 'Share this guide' });
    expect(group.getAttribute('data-postkit-part')).toBe('actions');
    expect(group.querySelectorAll('button')).toHaveLength(2);
  });

  it('draws the initial of a service without an icon from its recipe', () => {
    const markup = renderToStaticMarkup(
      withProvider(
        <ShareActions url="https://x.test" services={['copy', 'email']} />,
      ),
    );

    expect(markup).toMatch(
      /<span aria-hidden="true" data-postkit-initial="C" [^>]*data-postkit-part="icon"[^>]*><\/span>Copy link<\/button>/,
    );
    expect(postkitShareActionsRecipe.base?.icon).toMatchObject({
      '&[data-postkit-initial]::before': {
        content: 'attr(data-postkit-initial)',
      },
    });
  });
});

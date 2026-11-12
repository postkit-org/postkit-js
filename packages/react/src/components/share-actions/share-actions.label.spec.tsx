import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { cleanup, render, screen } from '@testing-library/react';

import { ShareActions } from './share-actions.js';

// jsdom replaces the global `URL`, so resolve the path from a string.
const stylesheet = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), 'share-actions.css'),
  'utf8',
);

afterEach(() => cleanup());

/*
 * P19: axe `label-content-name-mismatch` (WCAG 2.5.3). axe takes every text
 * node in a button as its visible text, aria-hidden ones included, and the
 * accessible name has to contain it, ideally at the start.
 */
describe('headless ShareActions names (WCAG 2.5.3)', () => {
  it('names each action by its visible label alone', () => {
    render(
      <ShareActions
        url="https://x.test"
        label="Share this guide"
        services={['native', 'copy', 'email', 'x']}
      />,
    );

    for (const label of ['Share', 'Copy link', 'Email', 'X']) {
      const button = screen.getByRole('button', { name: label });
      expect(button.textContent).toBe(label);
      expect(button.hasAttribute('aria-label')).toBe(false);
    }
  });

  it('names the group of actions with the label', () => {
    render(<ShareActions url="https://x.test" label="Share this guide" />);

    const group = screen.getByRole('group', { name: 'Share this guide' });
    expect(group.getAttribute('data-postkit-part')).toBe('actions');
    expect(group.querySelectorAll('button')).toHaveLength(3);
  });

  it('leaves the group unnamed when the label is blank', () => {
    const { container } = render(
      <ShareActions url="https://x.test" label="" />,
    );

    const group = container.querySelector('[data-postkit-part="actions"]');
    expect(group?.hasAttribute('aria-labelledby')).toBe(false);
    expect(
      container
        .querySelector('[data-postkit-part="label"]')
        ?.hasAttribute('id'),
    ).toBe(false);
  });

  it('draws the initial of a service without an icon from CSS', () => {
    const { container } = render(
      <ShareActions
        url="https://x.test"
        services={['copy', 'studio']}
        socialServices={{ studio: { label: 'Studio', icon: <svg /> } }}
      />,
    );

    const [copyIcon, studioIcon] = Array.from(
      container.querySelectorAll('[data-postkit-part="icon"]'),
    );
    expect(copyIcon?.getAttribute('data-postkit-initial')).toBe('C');
    expect(copyIcon?.getAttribute('aria-hidden')).toBe('true');
    expect(copyIcon?.textContent).toBe('');
    expect(studioIcon?.hasAttribute('data-postkit-initial')).toBe(false);
    expect(stylesheet).toMatch(
      /:where\(\[data-postkit-part='icon'\]\[data-postkit-initial\]\)::before\s*\{\s*content: attr\(data-postkit-initial\);/,
    );
  });
});

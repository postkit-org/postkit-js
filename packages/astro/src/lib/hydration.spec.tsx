// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import type { ReactNode } from 'react';
import { CodeBlock, CodeGroup, Poll, Tabs } from './react-bridges.js';

afterEach(cleanup);

function hydrate(ui: ReactNode) {
  const container = document.createElement('div');
  container.innerHTML = renderToString(ui);
  document.body.append(container);
  return render(ui, { container, hydrate: true });
}

describe('interactive Astro React bridges', () => {
  it('switches tabs after hydrating server markup', async () => {
    hydrate(
      <Tabs
        items={[
          { label: 'First', content: 'First panel' },
          { label: 'Second', content: 'Second panel' },
        ]}
      />,
    );
    fireEvent.click(screen.getByRole('tab', { name: 'Second' }));
    await waitFor(() =>
      expect(
        screen
          .getByRole('tab', { name: 'Second' })
          .getAttribute('aria-selected'),
      ).toBe('true'),
    );
    expect(screen.getByRole('tabpanel').textContent).toContain('Second panel');
  });

  it('switches code examples after hydration', async () => {
    hydrate(
      <CodeGroup
        items={[
          { label: 'JavaScript', code: 'first()' },
          { label: 'TypeScript', code: 'second()' },
        ]}
      />,
    );
    fireEvent.click(screen.getByRole('tab', { name: 'TypeScript' }));
    await waitFor(() =>
      expect(
        screen
          .getByRole('tab', { name: 'TypeScript' })
          .getAttribute('aria-selected'),
      ).toBe('true'),
    );
    expect(screen.getByRole('tabpanel').textContent).toContain('second()');
  });

  it('copies code and shows confirmation after hydration', async () => {
    const original = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
    try {
      hydrate(<CodeBlock code="const answer = 42" />);
      fireEvent.click(screen.getByRole('button', { name: 'Copy code' }));
      await waitFor(() =>
        expect(writeText).toHaveBeenCalledWith('const answer = 42'),
      );
      await screen.findByText('Copied');
    } finally {
      if (original) Object.defineProperty(navigator, 'clipboard', original);
      else Reflect.deleteProperty(navigator, 'clipboard');
    }
  });

  it('selects a poll option after hydration', async () => {
    hydrate(
      <Poll
        question="Next guide?"
        options={[
          { id: 'one', label: 'First guide' },
          { id: 'two', label: 'Second guide' },
        ]}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Second guide' }));
    await waitFor(() =>
      expect(
        screen
          .getByRole('button', { name: 'Second guide' })
          .getAttribute('aria-pressed'),
      ).toBe('true'),
    );
  });
});

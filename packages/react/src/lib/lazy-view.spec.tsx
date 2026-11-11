import { act, fireEvent } from '@testing-library/react';
import { calloutDefinition } from '@postkit/core/components';
import { useState } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { prerenderToNodeStream } from 'react-dom/static';

import { Callout } from '../components/callout/callout.js';
import { article } from '../kits/index.js';
import { createPostkit } from './create-postkit.js';
import { postkitHeadlessViewNames } from './headless-view-names.js';
import { postkitHeadlessViews } from './headless-views.js';
import {
  postkitLazyView,
  postkitLazyViews,
  preloadPostkitViews,
} from './lazy-view.js';

/** A server render that waits for Suspense, as Next.js's Pages Router does. */
async function renderToHtml(element: React.ReactElement): Promise<string> {
  const { prelude } = await prerenderToNodeStream(element);
  let html = '';
  for await (const chunk of prelude) html += String(chunk);
  return html;
}

function Counter({ label }: { readonly label: string }) {
  const [count, setCount] = useState(0);
  return (
    <button type="button" onClick={() => setCount(count + 1)}>
      {label} {count}
    </button>
  );
}

/** A loader that resolves when the test says so. */
function deferredLoader() {
  let resolve!: () => void;
  const ready = new Promise<void>((done) => {
    resolve = done;
  });
  const load = vi.fn(() => ready.then(() => Counter));
  return { load, resolve };
}

describe('postkitLazyView', () => {
  it('renders the loaded view in a server render that waits for Suspense', async () => {
    const load = vi.fn(async () => Counter);
    const LazyCounter = postkitLazyView(load, { name: 'Counter' });

    const html = await renderToHtml(<LazyCounter label="Votes" />);

    // Inside its own Suspense boundary (`<!--$-->`), complete.
    expect(html).toMatch(
      /^<!--\$--><button type="button">Votes.*0<\/button><!--\/\$-->$/,
    );
    expect(load).toHaveBeenCalledTimes(1);
    expect(LazyCounter.displayName).toBe('PostkitLazy(Counter)');
  });

  it('renders synchronously once preloaded, and loads only once', async () => {
    const load = vi.fn(async () => Counter);
    const LazyCounter = postkitLazyView(load);

    expect(renderToStaticMarkup(<LazyCounter label="Votes" />)).toBe('');
    await LazyCounter.preload();
    await LazyCounter.preload();

    expect(renderToStaticMarkup(<LazyCounter label="Votes" />)).toBe(
      '<button type="button">Votes 0</button>',
    );
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('keeps the server HTML while it loads in the browser, then hydrates', async () => {
    const ServerCounter = postkitLazyView(async () => Counter);
    const html = await renderToHtml(
      <main>
        <p>Before</p>
        <ServerCounter label="Votes" />
        <p>After</p>
      </main>,
    );

    const container = document.createElement('div');
    container.innerHTML = html;
    document.body.append(container);
    const serverButton = container.querySelector('button');
    expect(serverButton?.textContent).toBe('Votes 0');

    // A fresh lazy view, as in the browser: nothing is loaded yet.
    const { load, resolve } = deferredLoader();
    const LazyCounter = postkitLazyView(load);
    const errors: unknown[] = [];
    let root: ReturnType<typeof hydrateRoot> | undefined;
    await act(async () => {
      root = hydrateRoot(
        container,
        <main>
          <p>Before</p>
          <LazyCounter label="Votes" />
          <p>After</p>
        </main>,
        { onRecoverableError: (error) => errors.push(error) },
      );
    });

    // Still the server's button, untouched, while the view downloads.
    expect(container.querySelector('button')).toBe(serverButton);
    expect(container.textContent).toBe('BeforeVotes 0After');

    await act(async () => {
      resolve();
    });

    expect(errors).toEqual([]);
    expect(container.querySelector('button')).toBe(serverButton);
    fireEvent.click(serverButton as HTMLButtonElement);
    expect(serverButton?.textContent).toBe('Votes 1');

    act(() => root?.unmount());
    container.remove();
  });

  it('tries again after a failed load', async () => {
    const load = vi
      .fn<() => Promise<typeof Counter>>()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValue(Counter);
    const LazyCounter = postkitLazyView(load);

    await expect(LazyCounter.preload()).rejects.toThrow('offline');
    await expect(LazyCounter.preload()).resolves.toBe(Counter);
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('rejects a loader that resolves to something other than a component', async () => {
    const LazyThing = postkitLazyView(
      async () => undefined as unknown as typeof Counter,
      { name: 'Thing' },
    );

    await expect(LazyThing.preload()).rejects.toThrow(
      "the loader for Thing didn't resolve to a component",
    );
  });

  it('builds a map of lazy views and preloads the ones a page uses', async () => {
    const loadCounter = vi.fn(async () => Counter);
    const loadCallout = vi.fn(async () => Callout);
    const views = postkitLazyViews(
      { Counter: loadCounter, Callout: loadCallout },
      { Callout: calloutDefinition },
    );

    expect(Object.keys(views)).toEqual(['Counter', 'Callout']);
    expect(views.Callout.definition).toBe(calloutDefinition);
    expect(views.Counter.definition).toBeUndefined();

    await preloadPostkitViews(views, ['Callout', 'Missing', 'toString']);
    expect(loadCallout).toHaveBeenCalledTimes(1);
    expect(loadCounter).not.toHaveBeenCalled();
  });

  it('works as a createPostkit view: defaults come from the provider, not a wrapper', async () => {
    const LazyCallout = postkitLazyView(async () => Callout, {
      name: 'Callout',
      definition: calloutDefinition,
    });
    const postkit = createPostkit({
      kits: [article],
      defaults: { Callout: { tone: 'warning' } },
      overrides: {
        Callout: { view: LazyCallout, classNames: { root: 'site-callout' } },
      },
    });
    expect(postkit.mdxComponents['Callout']).toBe(LazyCallout);

    const View = postkit.mdxComponents['Callout'] as typeof Callout;
    const html = await renderToHtml(
      <postkit.Provider>
        <View title="Heads up">Body</View>
      </postkit.Provider>,
    );
    expect(html).toContain('data-tone="warning"');
    expect(html).toContain('site-callout');
  });
});

describe('postkitHeadlessViewNames', () => {
  it('lists the headless views, in order, without importing them', () => {
    expect(postkitHeadlessViewNames).toEqual(Object.keys(postkitHeadlessViews));
  });
});

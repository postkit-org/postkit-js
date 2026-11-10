import {
  installBehaviorEnvironment,
  settle,
} from '@postkit/core/behaviors/testing';
import { act, cleanup, renderHook } from '@testing-library/react';

import { useCarousel } from './use-carousel.js';
import { useCodeCopy } from './use-code-copy.js';
import { useEmbedConsent } from './use-embed-consent.js';
import { useTabs } from './use-tabs.js';

let restore: () => void = () => undefined;
beforeEach(() => {
  restore = installBehaviorEnvironment();
});
afterEach(() => {
  cleanup();
  restore();
});

// Zag starts machines in effects; let them settle inside `act`.
const settled = () => act(async () => settle());

describe('behaviour hooks', () => {
  it('useTabs selects the clamped initial tab and accepts an id', async () => {
    const { result } = renderHook(() =>
      useTabs({ id: 'install', values: ['a', 'b'], initialIndex: 9 }),
    );
    await settled();
    expect(result.current.value).toBe('b');
    expect(result.current.getListProps().id).toBe('tabs:install:list');
  });

  it('useCarousel starts on the clamped initial page', async () => {
    const { result } = renderHook(() =>
      useCarousel({ slideCount: 3, initialIndex: '2' }),
    );
    await settled();
    expect(result.current.page).toBe(2);
    expect(result.current.getProgressText()).toBe('3 / 3');
  });

  it('useCodeCopy has not copied on render', async () => {
    const { result } = renderHook(() => useCodeCopy({ code: 'x' }));
    await settled();
    expect(result.current.copied).toBe(false);
    expect(result.current.value).toBe('x');
  });

  it('useEmbedConsent waits for a click and reports state changes', () => {
    const onStateChange = vi.fn();
    const { result } = renderHook(() => useEmbedConsent({ onStateChange }));
    expect(result.current.shouldRenderFrame).toBe(false);
    expect(result.current.getPromptProps()).toMatchObject({ hidden: false });

    act(() => result.current.request());
    expect(result.current.state).toBe('requested');
    act(() => result.current.markLoaded());
    expect(result.current.loaded).toBe(true);
    expect(onStateChange.mock.calls).toEqual([
      [{ state: 'requested' }],
      [{ state: 'loaded' }],
    ]);
  });

  it('useEmbedConsent renders the frame at once when immediate', () => {
    const onStateChange = vi.fn();
    const { result } = renderHook(() =>
      useEmbedConsent({ activation: 'immediate', onStateChange }),
    );
    expect(result.current.shouldRenderFrame).toBe(true);
    expect(onStateChange).not.toHaveBeenCalled();
  });
});

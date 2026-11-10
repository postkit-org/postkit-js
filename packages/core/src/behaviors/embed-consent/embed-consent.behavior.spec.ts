// @vitest-environment jsdom
import { normalizeProps, spreadProps } from '../dom.js';
import {
  createBareDriver,
  element,
} from '../testing/bare-driver.spec-support.js';
import { registerBehaviorSpec } from '../testing/harness.js';
import {
  embedConsentBehaviorSpec,
  type EmbedConsentBehaviorFixture,
} from './embed-consent.behavior.spec-suite.js';
import {
  connectEmbedConsent,
  createEmbedConsent,
  embedConsentInitialState,
  embedConsentTransition,
  type EmbedConsentApi,
} from './embed-consent.behavior.js';

const driver = createBareDriver<EmbedConsentBehaviorFixture, EmbedConsentApi>(
  (container, fixture) => {
    const behavior = createEmbedConsent({ activation: fixture.activation });
    const root = element('div');
    const link = element('a', fixture.title);
    link.href = fixture.href;
    container.append(root, link);
    let rendered: 'prompt' | 'frame' | undefined;
    return {
      behavior,
      update(api) {
        spreadProps(root, api.getRootProps());
        const next = api.shouldRenderFrame ? 'frame' : 'prompt';
        if (next === rendered) return;
        rendered = next;
        root.replaceChildren();
        if (next === 'frame') {
          const frame = element('iframe');
          spreadProps(frame, {
            ...api.getFrameProps(),
            src: fixture.src,
            title: fixture.title,
            sandbox: 'allow-scripts allow-same-origin',
          });
          root.append(frame);
          return;
        }
        const prompt = element('div');
        const button = element('button', 'Load embed');
        spreadProps(prompt, api.getPromptProps());
        spreadProps(button, api.getRequestTriggerProps());
        prompt.append(
          element('p', `Load interactive content from ${fixture.provider}?`),
          button,
        );
        root.append(prompt);
      },
    };
  },
);

registerBehaviorSpec(
  embedConsentBehaviorSpec(driver),
  { describe, it },
  {
    label: 'bare machine',
  },
);

describe('embed consent machine', () => {
  it('waits for a click by default and loads at once when immediate', () => {
    expect(embedConsentInitialState()).toBe('idle');
    expect(embedConsentInitialState('click')).toBe('idle');
    expect(embedConsentInitialState('immediate')).toBe('requested');
  });

  it('moves idle → requested → loaded and ignores other events', () => {
    expect(embedConsentTransition('idle', { type: 'LOAD' })).toBe('idle');
    expect(embedConsentTransition('idle', { type: 'REQUEST' })).toBe(
      'requested',
    );
    expect(embedConsentTransition('requested', { type: 'REQUEST' })).toBe(
      'requested',
    );
    expect(embedConsentTransition('requested', { type: 'LOAD' })).toBe(
      'loaded',
    );
    expect(embedConsentTransition('loaded', { type: 'REQUEST' })).toBe(
      'loaded',
    );
  });

  it('runs framework-free, notifying while started', () => {
    const onStateChange = vi.fn();
    const behavior = createEmbedConsent({ onStateChange });
    const listener = vi.fn();
    const unsubscribe = behavior.subscribe(listener);
    behavior.start();
    expect(behavior.api).toMatchObject({
      state: 'idle',
      shouldRenderFrame: false,
      loaded: false,
    });
    expect(behavior.api.getPromptProps()).toMatchObject({
      hidden: false,
      role: 'group',
    });
    behavior.api.request();
    expect(behavior.state).toBe('requested');
    expect(behavior.api.getRootProps()).toMatchObject({
      'data-state': 'requested',
      'aria-busy': true,
    });
    behavior.api.markLoaded();
    expect(behavior.api.loaded).toBe(true);
    expect(onStateChange.mock.calls).toEqual([
      [{ state: 'requested' }],
      [{ state: 'loaded' }],
    ]);
    expect(listener).toHaveBeenCalledTimes(2);
    behavior.send({ type: 'REQUEST' });
    expect(listener).toHaveBeenCalledTimes(2);
    unsubscribe();
    behavior.stop();
  });

  it('connects through a Zag prop normalizer and respects defaultPrevented', () => {
    const send = vi.fn();
    const api = connectEmbedConsent({ state: 'idle', send }, normalizeProps);
    const trigger = api.getRequestTriggerProps() as {
      onClick(event: unknown): void;
    };
    trigger.onClick({ defaultPrevented: true });
    expect(send).not.toHaveBeenCalled();
    trigger.onClick({ defaultPrevented: false });
    expect(send).toHaveBeenCalledWith({ type: 'REQUEST' });
    (api.getFrameProps() as { onLoad(): void }).onLoad();
    expect(send).toHaveBeenLastCalledWith({ type: 'LOAD' });
  });
});

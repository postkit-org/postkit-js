// @vitest-environment jsdom
import { normalizeProps, spreadProps } from '../dom.js';
import {
  createBareDriver,
  element,
} from '../testing/bare-driver.spec-support.js';
import { registerBehaviorSpec } from '../testing/harness.js';
import {
  shareActionsBehaviorSpec,
  type ShareActionsBehaviorFixture,
} from './share-actions.behavior.spec-suite.js';
import {
  connectShareActions,
  createShareActions,
  mergeShareServices,
  postkitShareServices,
  shareActionsInitialState,
  shareActionsTransition,
  shareWithService,
  type ShareActionsApi,
} from './share-actions.behavior.js';

const driver = createBareDriver<ShareActionsBehaviorFixture, ShareActionsApi>(
  (container, fixture) => {
    const behavior = createShareActions({
      ...fixture,
      services: postkitShareServices,
    });
    const root = element('aside');
    const status = element('p');
    const buttons = fixture.services.map((serviceId) => {
      const button = element('button', behavior.api.serviceLabel(serviceId));
      button.dataset['postkitService'] = serviceId;
      return button;
    });
    root.append(element('p', fixture.label), ...buttons, status);
    container.append(root);
    return {
      behavior,
      update(api) {
        buttons.forEach((button, index) =>
          spreadProps(
            button,
            api.getActionProps(fixture.services[index] ?? ''),
          ),
        );
        spreadProps(status, api.getStatusProps());
        status.textContent = api.status;
      },
    };
  },
);

registerBehaviorSpec(
  shareActionsBehaviorSpec(driver),
  { describe, it },
  { label: 'bare machine' },
);

const request = { url: 'https://example.com/a', title: 'A', text: 'About A' };

describe('share actions', () => {
  it('reports the latest status', () => {
    const state = shareActionsInitialState();
    expect(state).toEqual({ status: '' });
    expect(shareActionsTransition(state, { type: 'REPORT', status: '' })).toBe(
      state,
    );
    expect(
      shareActionsTransition(state, { type: 'REPORT', status: 'Done.' }),
    ).toEqual({ status: 'Done.' });
  });

  it('builds the share URLs Postkit has always used', () => {
    const urls = Object.fromEntries(
      Object.entries(postkitShareServices)
        .filter(([, service]) => service.createShareUrl)
        .map(([id, service]) => [id, service.createShareUrl?.(request)]),
    );
    expect(urls).toEqual({
      bluesky: `https://bsky.app/intent/compose?text=${encodeURIComponent('About A\n\nhttps://example.com/a')}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(request.url)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(request.url)}`,
      threads: `https://www.threads.net/intent/post?text=${encodeURIComponent('About A\n\nhttps://example.com/a')}`,
      x: 'https://x.com/intent/post?url=https%3A%2F%2Fexample.com%2Fa&text=About+A',
    });
    expect(postkitShareServices['youtube']).toEqual({ label: 'YouTube' });
  });

  it('opens a mailto link, uses host handlers and explains failures', async () => {
    const location = { href: '' };
    const open = vi.fn();
    const environment = {
      navigator: {} as Navigator,
      window: { location, open } as unknown as Window,
    };
    const onShare = vi.fn();
    await expect(
      shareWithService('email', request, { environment, onShare }),
    ).resolves.toBe('Opened Email.');
    expect(location.href).toBe(
      `mailto:?subject=A&body=${encodeURIComponent('About A\n\nhttps://example.com/a')}`,
    );
    const share = vi.fn();
    const services = mergeShareServices({ studio: { label: 'Studio', share } });
    await expect(
      shareWithService('studio', request, { services, environment }),
    ).resolves.toBe('Opened Studio.');
    expect(share).toHaveBeenCalledWith(request);
    await expect(
      shareWithService('instagram', request, { environment }),
    ).resolves.toBe('Instagram sharing is unavailable.');
    await expect(
      shareWithService('copy', request, { environment }),
    ).resolves.toBe('Clipboard access is unavailable.');
    await expect(
      shareWithService('studio', request, {
        services: {
          studio: { label: 'Studio', share: () => Promise.reject(1) },
        },
        environment,
      }),
    ).resolves.toBe('Sharing is unavailable.');
    expect(onShare).toHaveBeenCalledTimes(1);
  });

  it('ignores prevented clicks and runs framework-free', async () => {
    const send = vi.fn();
    const api = connectShareActions(
      { state: shareActionsInitialState(), send },
      normalizeProps,
      { ...request, label: 'Share' },
    );
    (api.getActionProps('copy') as { onClick(event: unknown): void }).onClick({
      defaultPrevented: true,
    });
    expect(send).not.toHaveBeenCalled();
    expect(api.serviceLabel('unknown')).toBe('unknown');

    const behavior = createShareActions({ ...request, label: 'Share' });
    const listener = vi.fn();
    const unsubscribe = behavior.subscribe(listener);
    behavior.start();
    behavior.send({ type: 'REPORT', status: 'Done.' });
    expect(listener).toHaveBeenCalledTimes(1);
    expect(behavior.state.status).toBe('Done.');
    unsubscribe();
    behavior.stop();
  });
});

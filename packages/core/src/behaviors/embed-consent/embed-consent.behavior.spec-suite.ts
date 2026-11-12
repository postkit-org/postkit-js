import type { EmbedConsentActivation } from './embed-consent.behavior.js';
import {
  check,
  checkEqual,
  click,
  type BehaviorDriver,
  type BehaviorSpec,
} from '../testing/harness.js';
import { installBehaviorEnvironment } from '../testing/environment.js';

/** What an embed renderer draws for the shared spec. */
export interface EmbedConsentBehaviorFixture {
  /** The embed's frame URL. */
  readonly src: string;
  /** The page the embed belongs to, which may be linked before consent. */
  readonly href: string;
  /** The frame's accessible title. */
  readonly title: string;
  /** The provider's name, for the consent prompt. */
  readonly provider: string;
  readonly activation?: EmbedConsentActivation;
}

const fixture: EmbedConsentBehaviorFixture = {
  src: 'https://player.example.com/embed/42',
  href: 'https://video.example.com/watch/42',
  title: 'Launch film',
  provider: 'Example Video',
};

const EMBED_ORIGIN = 'player.example.com';

function frames(root: Element): HTMLIFrameElement[] {
  return Array.from(root.querySelectorAll('iframe'));
}

function expectNothingLoaded(root: Element, requests: readonly string[]): void {
  checkEqual(frames(root).length, 0, 'No iframe before consent');
  checkEqual(
    root.querySelectorAll('script, object, embed').length,
    0,
    'No script, object or embed before consent',
  );
  check(
    !root.innerHTML.includes(EMBED_ORIGIN),
    'Nothing in the markup points at the embed origin before consent',
  );
  check(
    !requests.some((url) => url.includes(EMBED_ORIGIN)),
    'No request reaches the embed origin before consent',
  );
}

function expectFrame(root: Element): HTMLIFrameElement {
  const [frame, ...rest] = frames(root);
  check(frame, 'The iframe appears');
  checkEqual(rest.length, 0, 'Exactly one iframe');
  checkEqual(frame.getAttribute('src'), fixture.src, 'The iframe src');
  checkEqual(frame.getAttribute('title'), fixture.title, 'The iframe title');
  return frame;
}

/**
 * The shared embed consent spec. With the default `click` activation, which
 * the Privacy page relies on, nothing from the embed's origin is in the page
 * (no iframe, no request) until the reader presses the consent button; then
 * the titled iframe replaces the prompt. `immediate` renders it at once.
 */
export function embedConsentBehaviorSpec(
  driver: BehaviorDriver<EmbedConsentBehaviorFixture>,
): BehaviorSpec {
  const run =
    (
      body: (root: Element, requests: readonly string[]) => Promise<void>,
      overrides: Partial<EmbedConsentBehaviorFixture> = {},
    ) =>
    async () => {
      const restore = installBehaviorEnvironment();
      const requests: string[] = [];
      const originalFetch = globalThis.fetch;
      globalThis.fetch = (async (input: RequestInfo | URL) => {
        requests.push(
          typeof input === 'string'
            ? input
            : input instanceof URL
              ? input.href
              : input.url,
        );
        throw new Error('Network access is disabled in behaviour specs.');
      }) as typeof fetch;
      try {
        await body(await driver.render({ ...fixture, ...overrides }), requests);
      } finally {
        await driver.cleanup();
        globalThis.fetch = originalFetch;
        restore();
      }
    };

  const consentButton = (root: Element) => {
    const buttons = Array.from(root.querySelectorAll('button'));
    checkEqual(buttons.length, 1, 'The consent prompt has one button');
    return buttons[0] as HTMLButtonElement;
  };

  return {
    behavior: 'Embed consent',
    cases: [
      {
        name: 'loads nothing from the embed before consent (activation: click)',
        run: run(async (root, requests) => {
          expectNothingLoaded(root, requests);
          const button = consentButton(root);
          checkEqual(button.getAttribute('type'), 'button', 'The button type');
          check(button.textContent?.trim(), 'The consent button has a label');
          // Give effects and lazy work a chance to misbehave.
          await driver.interact(() => undefined);
          expectNothingLoaded(root, requests);
        }),
      },
      {
        name: 'renders the titled iframe after the reader consents',
        run: run(async (root) => {
          await driver.interact(() => click(consentButton(root)));
          await driver.waitFor(() => {
            expectFrame(root);
            checkEqual(
              root.querySelectorAll('button').length,
              0,
              'The consent prompt is gone',
            );
          });
        }),
      },
      {
        name: 'renders the iframe at once with activation: immediate',
        run: run(
          async (root) => {
            await driver.waitFor(() => expectFrame(root));
          },
          { activation: 'immediate' },
        ),
      },
    ],
  };
}

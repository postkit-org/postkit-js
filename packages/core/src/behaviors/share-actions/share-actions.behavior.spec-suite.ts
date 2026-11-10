import type { ShareRequest } from './share-actions.behavior.js';
import {
  accessibleName,
  check,
  checkEqual,
  click,
  visibleText,
  type BehaviorDriver,
  type BehaviorSpec,
} from '../testing/harness.js';
import {
  installBehaviorEnvironment,
  installClipboardStub,
  type ClipboardStub,
} from '../testing/environment.js';

/** What a share actions renderer draws for the shared spec. */
export interface ShareActionsBehaviorFixture {
  readonly url: string;
  readonly title: string;
  readonly text: string;
  /** The heading, and the start of each action's accessible name. */
  readonly label: string;
  /** Service ids, in order; the renderer's default registry labels them. */
  readonly services: readonly string[];
  /** The spec records shares through this. */
  readonly onShare: (service: string, request: ShareRequest) => void;
}

const fixture: Omit<ShareActionsBehaviorFixture, 'onShare'> = {
  url: 'https://postkit.org/notes/launch',
  title: 'Postkit launches',
  text: 'A portable publishing toolkit.',
  label: 'Share this post',
  services: ['native', 'copy', 'email', 'x'],
};

const LABELS = ['Share', 'Copy link', 'Email', 'X'];

const request: ShareRequest = {
  url: fixture.url,
  title: fixture.title,
  text: fixture.text,
};

interface Environment {
  readonly clipboard: ClipboardStub;
  readonly shared: ShareRequest[];
  readonly opened: unknown[][];
  readonly shares: string[];
}

type NativeShare = 'none' | 'shares' | 'cancels';

function action(root: Element, label: string): HTMLButtonElement {
  const button = Array.from(root.querySelectorAll('button')).find(
    (candidate) => accessibleName(candidate) === `${fixture.label}: ${label}`,
  );
  check(button, `An action is named "${fixture.label}: ${label}"`);
  return button;
}

function statusText(root: Element): string {
  const regions = Array.from(root.querySelectorAll('[aria-live="polite"]'));
  checkEqual(regions.length, 1, 'One polite status region');
  return visibleText(regions[0] as Element);
}

/** Replaces `key` on `owner` until the returned function runs. */
function stub(owner: object, key: string, value: unknown): () => void {
  const previous = Object.getOwnPropertyDescriptor(owner, key);
  Object.defineProperty(owner, key, {
    configurable: true,
    writable: true,
    value,
  });
  return () => {
    if (previous) Object.defineProperty(owner, key, previous);
    else delete (owner as Record<string, unknown>)[key];
  };
}

/**
 * The shared share actions spec: one named button per service; `copy`
 * copies the link and says so; `native` opens the system share sheet, or
 * copies the link where there is none; cancelling the sheet changes nothing;
 * a service with a share URL opens it in a new window. Every outcome is
 * announced in one polite status region.
 */
export function shareActionsBehaviorSpec(
  driver: BehaviorDriver<ShareActionsBehaviorFixture>,
): BehaviorSpec {
  const run =
    (
      body: (root: Element, environment: Environment) => Promise<void>,
      nativeShare: NativeShare = 'none',
    ) =>
    async () => {
      const restore = installBehaviorEnvironment();
      const clipboard = installClipboardStub();
      const win = globalThis.window;
      const shared: ShareRequest[] = [];
      const opened: unknown[][] = [];
      const shares: string[] = [];
      const restores = [
        stub(
          win.navigator,
          'share',
          nativeShare === 'none'
            ? undefined
            : async (data: ShareRequest) => {
                shared.push(data);
                if (nativeShare === 'cancels') {
                  throw Object.assign(new Error('Share cancelled'), {
                    name: 'AbortError',
                  });
                }
              },
        ),
        stub(win, 'open', (...args: unknown[]) => {
          opened.push(args);
          return null;
        }),
      ];
      try {
        const root = await driver.render({
          ...fixture,
          onShare: (service) => {
            shares.push(service);
          },
        });
        await body(root, { clipboard, shared, opened, shares });
      } finally {
        await driver.cleanup();
        for (const undo of restores.reverse()) undo();
        clipboard.restore();
        restore();
      }
    };

  return {
    behavior: 'ShareActions',
    cases: [
      {
        name: 'names one button per service after the label',
        run: run(async (root, { clipboard, shares }) => {
          const buttons = Array.from(root.querySelectorAll('button'));
          checkEqual(buttons.length, LABELS.length, 'One action per service');
          for (const label of LABELS) {
            checkEqual(
              action(root, label).getAttribute('type'),
              'button',
              `The ${label} action type`,
            );
          }
          checkEqual(statusText(root), '', 'No status before sharing');
          checkEqual(clipboard.writes.length, 0, 'Nothing copied on render');
          checkEqual(shares.length, 0, 'Nothing shared on render');
        }),
      },
      {
        name: 'copies the link and says so',
        run: run(async (root, { clipboard, shares }) => {
          await driver.interact(() => click(action(root, 'Copy link')));
          await driver.waitFor(() => {
            checkEqual(clipboard.writes.join(','), fixture.url, 'Copied URL');
            checkEqual(statusText(root), 'Link copied.', 'The status');
          });
          checkEqual(shares.join(','), 'copy', 'onShare reports the service');
        }),
      },
      {
        name: 'opens the system share sheet when there is one',
        run: run(async (root, { clipboard, shared, shares }) => {
          await driver.interact(() => click(action(root, 'Share')));
          await driver.waitFor(() => {
            checkEqual(
              JSON.stringify(shared),
              JSON.stringify([request]),
              'The share sheet receives the request',
            );
            checkEqual(statusText(root), 'Opened Share.', 'The status');
          });
          checkEqual(clipboard.writes.length, 0, 'Nothing is copied');
          checkEqual(shares.join(','), 'native', 'onShare reports the service');
        }, 'shares'),
      },
      {
        name: 'copies the link where there is no system share sheet',
        run: run(async (root, { clipboard }) => {
          await driver.interact(() => click(action(root, 'Share')));
          await driver.waitFor(() => {
            checkEqual(clipboard.writes.join(','), fixture.url, 'Copied URL');
            checkEqual(statusText(root), 'Link copied.', 'The status');
          });
        }),
      },
      {
        name: 'changes nothing when the reader cancels the share sheet',
        run: run(async (root, { shared, shares }) => {
          await driver.interact(() => click(action(root, 'Share')));
          await driver.waitFor(() =>
            checkEqual(shared.length, 1, 'The share sheet opened'),
          );
          await driver.interact(() => undefined);
          checkEqual(statusText(root), '', 'No status after cancelling');
          checkEqual(shares.length, 0, 'onShare is not called');
        }, 'cancels'),
      },
      {
        name: "opens a service's share URL in a new window",
        run: run(async (root, { opened }) => {
          await driver.interact(() => click(action(root, 'X')));
          await driver.waitFor(() => {
            const [call] = opened;
            check(call, 'A window opened');
            const url = new URL(String(call[0]));
            checkEqual(
              url.origin + url.pathname,
              'https://x.com/intent/post',
              'URL',
            );
            checkEqual(url.searchParams.get('url'), fixture.url, 'Shared URL');
            checkEqual(url.searchParams.get('text'), fixture.text, 'Text');
            checkEqual(call[1], '_blank', 'Target');
            checkEqual(call[2], 'noopener,noreferrer', 'Features');
            checkEqual(statusText(root), 'Opened X.', 'The status');
          });
        }),
      },
    ],
  };
}

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

/** What a code copy renderer draws for the shared spec. */
export interface CodeCopyBehaviorFixture {
  /** The source to copy. */
  readonly code: string;
  /** The copy button's accessible name and label. */
  readonly label: string;
  /** The feedback shown, and announced, after copying. */
  readonly copiedLabel: string;
}

const fixture: CodeCopyBehaviorFixture = {
  code: 'npm install @postkit/core',
  label: 'Copy code',
  copiedLabel: 'Copied',
};

/** How long a renderer may take to revert the copied state, in ms. */
const REVERT_WITHIN = 3000;

function trigger(root: Element): HTMLButtonElement {
  const button = Array.from(root.querySelectorAll('button')).find(
    (candidate) => accessibleName(candidate) === fixture.label,
  );
  check(button, `A button is named "${fixture.label}"`);
  return button;
}

function announcement(root: Element): Element | undefined {
  return Array.from(root.querySelectorAll('[aria-live="polite"]')).find(
    (region) => visibleText(region).includes(fixture.copiedLabel),
  );
}

function expectIdle(root: Element): void {
  const button = trigger(root);
  checkEqual(button.getAttribute('type'), 'button', 'The trigger type');
  check(!button.hasAttribute('data-copied'), 'The trigger is not data-copied');
  check(
    visibleText(button).includes(fixture.label),
    `The trigger shows "${fixture.label}"`,
  );
  check(
    !visibleText(root).includes(fixture.copiedLabel),
    `"${fixture.copiedLabel}" is not shown`,
  );
}

function expectCopied(root: Element): void {
  const button = trigger(root);
  check(button.hasAttribute('data-copied'), 'The trigger is data-copied');
  check(
    announcement(root),
    `"${fixture.copiedLabel}" is shown in a polite live region`,
  );
}

/**
 * The shared code copy spec: a named button copies the source to the
 * clipboard, shows and announces "Copied", then reverts on its own.
 */
export function codeCopyBehaviorSpec(
  driver: BehaviorDriver<CodeCopyBehaviorFixture>,
): BehaviorSpec {
  const run =
    (body: (root: Element, clipboard: ClipboardStub) => Promise<void>) =>
    async () => {
      const restore = installBehaviorEnvironment();
      const clipboard = installClipboardStub();
      try {
        await body(await driver.render(fixture), clipboard);
      } finally {
        await driver.cleanup();
        clipboard.restore();
        restore();
      }
    };

  return {
    behavior: 'CodeBlock copy',
    cases: [
      {
        name: 'renders a named copy button that has not copied',
        run: run(async (root, clipboard) => {
          expectIdle(root);
          checkEqual(clipboard.writes.length, 0, 'Nothing is copied on render');
        }),
      },
      {
        name: 'copies the source and announces "Copied"',
        run: run(async (root, clipboard) => {
          await driver.interact(() => click(trigger(root)));
          await driver.waitFor(() => {
            checkEqual(
              clipboard.writes.join('\n'),
              fixture.code,
              'Copied text',
            );
            expectCopied(root);
          });
        }),
      },
      {
        name: 'reverts to the copy label after the feedback timeout',
        run: run(async (root) => {
          await driver.interact(() => click(trigger(root)));
          await driver.waitFor(() => expectCopied(root));
          await driver.waitFor(() => expectIdle(root), {
            timeout: REVERT_WITHIN,
          });
        }),
      },
      {
        name: 'copies again while the feedback is showing',
        run: run(async (root, clipboard) => {
          await driver.interact(() => click(trigger(root)));
          await driver.waitFor(() => expectCopied(root));
          await driver.interact(() => click(trigger(root)));
          await driver.waitFor(() => {
            checkEqual(clipboard.writes.length, 2, 'Each click copies');
            expectCopied(root);
          });
        }),
      },
    ],
  };
}

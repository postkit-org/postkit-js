import {
  accessibleName,
  byId,
  check,
  checkEqual,
  click,
  keyDown,
  visibleText,
  type BehaviorDriver,
  type BehaviorSpec,
} from '../testing/harness.js';
import { installBehaviorEnvironment } from '../testing/environment.js';

/** What a tabs renderer draws for the shared spec. */
export interface TabsBehaviorFixture {
  /** The tab list's accessible name. */
  readonly label: string;
  /** Tabs in order; `value` is the item's `id`. */
  readonly items: readonly {
    readonly value: string;
    readonly label: string;
    readonly content: string;
  }[];
  /** A number, or a string from a Markdown directive. */
  readonly initialIndex?: number | string;
}

const fixture: TabsBehaviorFixture = {
  label: 'Install',
  items: [
    { value: 'npm', label: 'npm', content: 'npm install postkit' },
    { value: 'pnpm', label: 'pnpm', content: 'pnpm add postkit' },
    { value: 'yarn', label: 'Yarn', content: 'yarn add postkit' },
  ],
};

function parts(root: Element) {
  const list = root.querySelector('[role="tablist"]');
  check(list, 'Tabs render a tablist');
  const tabs = Array.from(list.querySelectorAll<HTMLElement>('[role="tab"]'));
  return { list, tabs };
}

function selectedLabels(root: Element): string[] {
  return parts(root)
    .tabs.filter((tab) => tab.getAttribute('aria-selected') === 'true')
    .map((tab) => visibleText(tab));
}

function expectSelected(root: Element, index: number): void {
  const { tabs } = parts(root);
  const expected = fixture.items[index];
  check(expected, `Fixture has a tab ${index}`);
  checkEqual(
    selectedLabels(root).join(','),
    expected.label,
    'Exactly the expected tab is aria-selected',
  );
  tabs.forEach((tab, tabIndex) => {
    checkEqual(
      tab.getAttribute('tabindex'),
      tabIndex === index ? '0' : '-1',
      `Tab ${tabIndex} has a roving tabindex`,
    );
  });
  const selected = tabs[index];
  check(selected, `Tab ${index} exists`);
  const panel = byId(root, selected.getAttribute('aria-controls'));
  check(panel, 'The selected tab controls a panel by id');
  checkEqual(
    panel.getAttribute('role'),
    'tabpanel',
    'The controlled panel role',
  );
  check(!panel.hasAttribute('hidden'), 'The selected panel is visible');
  checkEqual(
    panel.getAttribute('aria-labelledby'),
    selected.id,
    'The panel is labelled by its tab',
  );
  check(
    visibleText(panel).includes(expected.content),
    `The selected panel shows "${expected.content}"`,
  );
  const visiblePanels = Array.from(
    root.querySelectorAll('[role="tabpanel"]'),
  ).filter((candidate) => !candidate.hasAttribute('hidden'));
  checkEqual(visiblePanels.length, 1, 'Only one panel is visible');
}

/**
 * The shared tabs spec: ARIA roles and state, a roving tabindex, selection by
 * click, and arrow, Home and End keys that move focus and select (automatic
 * activation), wrapping at the ends.
 */
export function tabsBehaviorSpec(
  driver: BehaviorDriver<TabsBehaviorFixture>,
): BehaviorSpec {
  const run =
    (
      body: (root: Element) => Promise<void>,
      overrides: Partial<TabsBehaviorFixture> = {},
    ) =>
    async () => {
      const restore = installBehaviorEnvironment();
      try {
        await body(await driver.render({ ...fixture, ...overrides }));
      } finally {
        await driver.cleanup();
        restore();
      }
    };

  const focusTab = async (root: Element, index: number) => {
    const tab = parts(root).tabs[index];
    check(tab, `Tab ${index} exists`);
    await driver.interact(() => tab.focus());
    return tab;
  };

  const press = async (root: Element, key: string) => {
    const active = root.ownerDocument.activeElement;
    check(active && root.contains(active), 'Focus is inside the tabs');
    await driver.interact(() => keyDown(active, key));
  };

  const expectFocusedAndSelected = async (root: Element, index: number) => {
    await driver.waitFor(() => {
      const tab = parts(root).tabs[index];
      check(tab, `Tab ${index} exists`);
      checkEqual(
        root.ownerDocument.activeElement,
        tab as Element,
        `Focus moved to tab ${index}`,
      );
      expectSelected(root, index);
    });
  };

  return {
    behavior: 'Tabs',
    cases: [
      {
        name: 'exposes a labelled tablist, tabs and one visible tabpanel',
        run: run(async (root) => {
          const { list, tabs } = parts(root);
          checkEqual(accessibleName(list), fixture.label, 'The tablist label');
          checkEqual(tabs.length, fixture.items.length, 'One tab per item');
          checkEqual(
            tabs.map((tab) => visibleText(tab)).join(','),
            fixture.items.map((item) => item.label).join(','),
            'Tab labels',
          );
          await driver.waitFor(() => expectSelected(root, 0));
        }),
      },
      {
        name: 'starts on initialIndex, clamped to the last tab',
        run: run(
          async (root) => {
            await driver.waitFor(() => expectSelected(root, 2));
          },
          { initialIndex: 99 },
        ),
      },
      {
        name: 'selects a tab when it is clicked',
        run: run(async (root) => {
          const tab = parts(root).tabs[1];
          check(tab, 'Tab 1 exists');
          await driver.interact(() => click(tab));
          await driver.waitFor(() => expectSelected(root, 1));
        }),
      },
      {
        name: 'moves focus and selection with ArrowRight and ArrowLeft, wrapping at the ends',
        run: run(async (root) => {
          await focusTab(root, 0);
          await press(root, 'ArrowRight');
          await expectFocusedAndSelected(root, 1);
          await press(root, 'ArrowRight');
          await expectFocusedAndSelected(root, 2);
          await press(root, 'ArrowRight');
          await expectFocusedAndSelected(root, 0);
          await press(root, 'ArrowLeft');
          await expectFocusedAndSelected(root, 2);
        }),
      },
      {
        name: 'moves to the first and last tab with Home and End',
        run: run(
          async (root) => {
            await focusTab(root, 1);
            await press(root, 'End');
            await expectFocusedAndSelected(root, 2);
            await press(root, 'Home');
            await expectFocusedAndSelected(root, 0);
          },
          { initialIndex: '1' },
        ),
      },
    ],
  };
}

// @vitest-environment jsdom
import { spreadProps } from '../dom.js';
import {
  createBareDriver,
  element,
} from '../testing/bare-driver.spec-support.js';
import { registerBehaviorSpec } from '../testing/harness.js';
import {
  tabsBehaviorSpec,
  type TabsBehaviorFixture,
} from './tabs.behavior.spec-suite.js';
import {
  createTabs,
  postkitTabsConfig,
  tabsProps,
  type TabsBehaviorApi,
} from './tabs.behavior.js';

let count = 0;

const driver = createBareDriver<TabsBehaviorFixture, TabsBehaviorApi>(
  (container, fixture) => {
    const values = fixture.items.map((item) => item.value);
    const behavior = createTabs({
      id: `tabs-${(count += 1)}`,
      values,
      initialIndex: fixture.initialIndex,
    });
    const root = element('div');
    const list = element('div');
    const triggers = fixture.items.map((item) => element('button', item.label));
    const panels = fixture.items.map((item) => element('div', item.content));
    list.append(...triggers);
    root.append(list, ...panels);
    container.append(root);
    return {
      behavior,
      update(api) {
        spreadProps(root, api.getRootProps());
        spreadProps(list, {
          ...api.getListProps(),
          'aria-label': fixture.label,
        });
        fixture.items.forEach((item, index) => {
          const trigger = triggers[index];
          const panel = panels[index];
          if (trigger)
            spreadProps(trigger, api.getTriggerProps({ value: item.value }));
          if (panel)
            spreadProps(panel, api.getContentProps({ value: item.value }));
        });
      },
    };
  },
);

registerBehaviorSpec(
  tabsBehaviorSpec(driver),
  { describe, it },
  {
    label: 'bare machine',
  },
);

describe('tabsProps', () => {
  it('configures Zag as @postkit/chakra does', () => {
    expect(tabsProps({ id: 't', values: ['a', 'b'] })).toEqual({
      ...postkitTabsConfig,
      id: 't',
      defaultValue: 'a',
    });
  });

  it('selects initialIndex, clamped, and nothing when there are no tabs', () => {
    expect(
      tabsProps({ id: 't', values: ['a', 'b'], initialIndex: '1' })
        .defaultValue,
    ).toBe('b');
    expect(
      tabsProps({ id: 't', values: ['a', 'b'], initialIndex: 7 }).defaultValue,
    ).toBe('b');
    expect(tabsProps({ id: 't', values: [] }).defaultValue).toBeNull();
  });

  it('passes callbacks through', () => {
    const onValueChange = vi.fn();
    const getRootNode = () => document;
    expect(
      tabsProps({ id: 't', values: ['a'], onValueChange, getRootNode }),
    ).toMatchObject({
      onValueChange,
      getRootNode,
    });
  });
});

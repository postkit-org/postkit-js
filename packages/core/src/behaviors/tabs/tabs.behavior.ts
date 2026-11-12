import * as tabs from '@zag-js/tabs';

import {
  clampIndex,
  createMachineBehavior,
  type MachineBehavior,
  type MachineSchemaOf,
} from '../behavior.js';
import type { DomPropTypes } from '../dom.js';

/** Options for Postkit's tabs behaviour. */
export interface TabsBehaviorOptions {
  /** A unique id; Zag derives every part's id from it. */
  readonly id: string;
  /** Each tab's value, in order (an item's `id`, or its index). */
  readonly values: readonly string[];
  /** The tab selected first; clamped to the tabs, as the `Tabs` prop is. */
  readonly initialIndex?: number | string;
  /** The root node to query, for shadow DOM hosts. */
  readonly getRootNode?: tabs.Props['getRootNode'];
  /** Called when the selected tab changes. */
  readonly onValueChange?: tabs.Props['onValueChange'];
}

/**
 * How Postkit configures tabs, matching `@postkit/chakra`'s `Tabs` and
 * `CodeGroup`: horizontal, arrow keys select as they move focus, and focus
 * wraps at both ends.
 */
export const postkitTabsConfig = Object.freeze({
  orientation: 'horizontal',
  activationMode: 'automatic',
  loopFocus: true,
} as const);

/** Zag tabs props for Postkit's configuration. */
export function tabsProps(options: TabsBehaviorOptions): tabs.Props {
  return {
    ...postkitTabsConfig,
    id: options.id,
    defaultValue:
      options.values[clampIndex(options.initialIndex, options.values.length)] ??
      null,
    ...(options.getRootNode ? { getRootNode: options.getRootNode } : {}),
    ...(options.onValueChange ? { onValueChange: options.onValueChange } : {}),
  };
}

/** Zag's tabs machine, for framework adapters such as `useMachine`. */
export const tabsMachine: tabs.Machine = tabs.machine;

/** Zag's tabs `connect`, for framework adapters. */
export const connectTabs = tabs.connect;

/** The tabs API for framework-free hosts. */
export type TabsBehaviorApi = tabs.Api<DomPropTypes>;

/** A running tabs behaviour. */
export type TabsBehavior = MachineBehavior<
  MachineSchemaOf<tabs.Machine>,
  TabsBehaviorApi
>;

/** Creates Postkit's tabs behaviour without a UI framework. */
export function createTabs(options: TabsBehaviorOptions): TabsBehavior {
  return createMachineBehavior(tabs.machine, tabs.connect, tabsProps(options));
}

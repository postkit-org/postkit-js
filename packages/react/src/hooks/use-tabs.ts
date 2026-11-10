import {
  connectTabs,
  tabsMachine,
  tabsProps,
  type TabsBehaviorOptions,
} from '@postkit/core/behaviors';
import { normalizeProps, useMachine, type PropTypes } from '@zag-js/react';
import { useId } from 'react';

/** Options for {@link useTabs}: the behaviour's options with an optional id. */
export type UseTabsOptions = Omit<TabsBehaviorOptions, 'id'> & {
  /** Defaults to a `useId` value. */
  readonly id?: string;
};

/** The tabs API for React: spread its prop getters onto your elements. */
export type UseTabsReturn = ReturnType<typeof connectTabs<PropTypes>>;

/**
 * Postkit's tabs behaviour for React: a thin wrapper over the Zag machine in
 * `@postkit/core/behaviors`, configured as `@postkit/chakra`'s `Tabs` and
 * `CodeGroup` (horizontal, automatic activation, looping focus).
 *
 * ```tsx
 * const api = useTabs({ values: ['npm', 'pnpm'] });
 * <div {...api.getRootProps()}>
 *   <div {...api.getListProps()}>
 *     <button {...api.getTriggerProps({ value: 'npm' })}>npm</button>
 *   </div>
 *   <div {...api.getContentProps({ value: 'npm' })}>…</div>
 * </div>;
 * ```
 */
export function useTabs(options: UseTabsOptions): UseTabsReturn {
  const generatedId = useId();
  const service = useMachine(
    tabsMachine,
    tabsProps({ ...options, id: options.id ?? generatedId }),
  );
  return connectTabs(service, normalizeProps);
}

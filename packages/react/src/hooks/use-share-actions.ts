import {
  connectShareActions,
  shareActionsInitialState,
  shareActionsTransition,
  type ShareActionsApi,
  type ShareActionsBehaviorOptions,
} from '@postkit/core/behaviors';
import { normalizeProps, type PropTypes } from '@zag-js/react';
import { useReducer } from 'react';

/** Options for {@link useShareActions}. */
export type UseShareActionsOptions = ShareActionsBehaviorOptions;

/** The share actions API for React. */
export type UseShareActionsReturn = ShareActionsApi<
  PropTypes['button'],
  PropTypes['element']
>;

/**
 * Postkit's share actions for React, over the plain TypeScript behaviour in
 * `@postkit/core/behaviors`: the system share sheet (copying the link where
 * there is none), copy link, email and service share URLs, with a polite
 * status line.
 */
export function useShareActions(
  options: UseShareActionsOptions,
): UseShareActionsReturn {
  const [state, send] = useReducer(
    shareActionsTransition,
    undefined,
    shareActionsInitialState,
  );
  return connectShareActions({ state, send }, normalizeProps, options);
}

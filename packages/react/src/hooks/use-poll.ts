import {
  connectPoll,
  pollInitialState,
  pollTransition,
  type PollApi,
  type PollBehaviorOptions,
} from '@postkit/core/behaviors';
import { normalizeProps, type PropTypes } from '@zag-js/react';
import { useReducer } from 'react';

/** Options for {@link usePoll}. */
export type UsePollOptions = PollBehaviorOptions;

/** The poll API for React. */
export type UsePollReturn = PollApi<PropTypes['button'], PropTypes['element']>;

/**
 * Postkit's poll behaviour for React, over the plain TypeScript machine in
 * `@postkit/core/behaviors`: results, a polite status line and one vote per
 * poll instance. `onVote` is called once per new vote; the host records it.
 * `selectedId` is read on the first render only.
 */
export function usePoll(options: UsePollOptions): UsePollReturn {
  const [state, send] = useReducer(
    pollTransition,
    options.selectedId,
    pollInitialState,
  );
  return connectPoll({ state, send }, normalizeProps, options);
}

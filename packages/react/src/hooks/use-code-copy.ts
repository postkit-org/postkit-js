import {
  codeCopyMachine,
  codeCopyProps,
  connectCodeCopy,
  type CodeCopyBehaviorOptions,
} from '@postkit/core/behaviors';
import { normalizeProps, useMachine, type PropTypes } from '@zag-js/react';
import { useId } from 'react';

/** Options for {@link useCodeCopy}: the behaviour's options with an optional id. */
export type UseCodeCopyOptions = Omit<CodeCopyBehaviorOptions, 'id'> & {
  /** Defaults to a `useId` value. */
  readonly id?: string;
};

/** The code copy API for React: `copied`, `copy()` and prop getters. */
export type UseCodeCopyReturn = ReturnType<typeof connectCodeCopy<PropTypes>>;

/**
 * Postkit's code copy behaviour for React: a thin wrapper over the Zag
 * clipboard machine in `@postkit/core/behaviors`. The copied state lasts one
 * second unless `timeout` says otherwise.
 */
export function useCodeCopy(options: UseCodeCopyOptions): UseCodeCopyReturn {
  const generatedId = useId();
  const service = useMachine(
    codeCopyMachine,
    codeCopyProps({ ...options, id: options.id ?? generatedId }),
  );
  return connectCodeCopy(service, normalizeProps);
}

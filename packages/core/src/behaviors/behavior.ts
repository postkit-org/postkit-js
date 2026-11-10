import type { Machine, MachineSchema, Service } from '@zag-js/core';
import type { NormalizeProps } from '@zag-js/types';

import { normalizeProps, type DomPropTypes } from './dom.js';
import { createMachineService, type MachineService } from './runtime.js';

/**
 * A running, framework-free behaviour: the API a renderer reads props and
 * state from, plus lifecycle and change notification.
 */
export interface Behavior<Api> {
  /** The current API. Read it again after each change notification. */
  readonly api: Api;
  /** Starts effects. Render the parts the API describes first. */
  start(): void;
  /** Stops effects and listeners the behaviour added. */
  stop(): void;
  /** Calls `listener` after each change. Returns an unsubscribe function. */
  subscribe(listener: () => void): () => void;
}

/** The schema of a Zag machine type. */
export type MachineSchemaOf<M> = M extends Machine<infer T> ? T : never;

/** A Zag-backed behaviour; `service` is the running machine. */
export interface MachineBehavior<
  T extends MachineSchema,
  Api,
> extends Behavior<Api> {
  readonly service: MachineService<T>;
}

type Connect<T extends MachineSchema, Api> = (
  service: Service<T>,
  normalize: NormalizeProps<DomPropTypes>,
) => Api;

/** Runs `machine` framework-free and connects it with {@link normalizeProps}. */
export function createMachineBehavior<T extends MachineSchema, Api>(
  machine: Machine<T>,
  connect: Connect<T, Api>,
  props: Partial<NonNullable<T['props']>>,
): MachineBehavior<T, Api> {
  const service = createMachineService(machine, props);
  return {
    service,
    get api() {
      return connect(service, normalizeProps);
    },
    start: () => service.start(),
    stop: () => service.stop(),
    subscribe: (listener) => service.subscribe(listener),
  };
}

/**
 * Clamps an authored `initialIndex` (a number, or a string from a Markdown
 * directive) to a valid index: non-numbers become 0, fractions round down.
 */
export function clampIndex(
  value: number | string | undefined,
  count: number,
): number {
  const parsed =
    typeof value === 'string' ? Number.parseInt(value, 10) : (value ?? 0);
  if (!Number.isFinite(parsed) || count <= 0) return 0;
  return Math.min(Math.max(0, Math.trunc(parsed)), count - 1);
}

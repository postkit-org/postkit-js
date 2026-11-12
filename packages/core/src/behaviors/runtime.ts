import {
  createScope,
  INIT_STATE,
  MachineStatus,
  type Bindable,
  type BindableContext,
  type BindableFn,
  type BindableParams,
  type BindableRefs,
  type ComputedFn,
  type Machine,
  type MachineSchema,
  type Params,
  type PropFn,
  type Service,
  type Transition,
} from '@zag-js/core';

type Dict = Record<string, unknown>;
type EventType<E> = E & { type: string; [key: string]: unknown };
type AnyTransition = Transition<Dict>;

/**
 * A running Zag machine with no UI framework attached.
 *
 * It satisfies Zag's `Service` contract, so a machine's own `connect` function
 * accepts it, and adds `start`, `stop`, `subscribe` and `setProps` for
 * framework-free hosts such as custom elements and tests.
 */
export interface MachineService<T extends MachineSchema> extends Service<T> {
  /** Runs the machine's entry actions and effects. Render its DOM first. */
  start(): void;
  /** Cleans up effects and runs the machine's exit actions. */
  stop(): void;
  /** Calls `listener` after state or context changes. Returns an unsubscribe. */
  subscribe(listener: () => void): () => void;
  /** Merges new props, as a framework would on re-render. */
  setProps(props: Partial<NonNullable<T['props']>>): void;
}

interface Tracker {
  readonly deps: readonly (() => unknown)[];
  readonly effect: VoidFunction;
  previous: unknown[];
}

function compact<T extends object>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined),
  ) as T;
}

function toArray<T>(value: T | readonly T[] | null | undefined): T[] {
  if (value == null) return [];
  return Array.isArray(value) ? [...value] : [value as T];
}

function resolveDep(dep: unknown): unknown {
  return typeof dep === 'function' ? (dep as () => unknown)() : dep;
}

/**
 * Runs a Zag machine without React, Vue or Solid.
 *
 * This is the framework-free adapter decision D7 calls for: it follows
 * `@zag-js/react`'s `useMachine` step for step (deferred `send`, entry and
 * exit actions, state effects, `watch` trackers), with plain variables in place
 * of hooks. It supports the flat machines Postkit uses (carousel, tabs,
 * clipboard); nested states are out of scope.
 */
export function createMachineService<T extends MachineSchema>(
  machine: Machine<T>,
  userProps: Partial<NonNullable<T['props']>> = {},
): MachineService<T> {
  type Props = NonNullable<T['props']>;
  let rawProps: Partial<Props> = userProps;
  const scope = createScope({
    id: rawProps.id,
    ids: rawProps.ids,
    getRootNode: rawProps.getRootNode,
  } as Parameters<typeof createScope>[0]);
  const resolveProps = (): Props =>
    (machine.props?.({ props: compact(rawProps), scope }) ?? rawProps) as Props;
  let props = resolveProps();
  const prop = ((key: PropertyKey) =>
    (props as Record<PropertyKey, unknown>)[key]) as PropFn<T>;

  let status = MachineStatus.NotStarted;
  const listeners = new Set<() => void>();
  const trackers: Tracker[] = [];
  const cleanups: VoidFunction[] = [];
  const effects = new Map<string, VoidFunction>();
  let notifyQueued = false;
  let transition: AnyTransition | null = null;
  let currentEvent: EventType<T['event']> = { type: '' } as EventType<
    T['event']
  >;
  let previousEvent: EventType<T['event']> | null = null;

  const runTrackers = () => {
    for (let pass = 0; pass < 10; pass += 1) {
      let changed = false;
      for (const tracker of trackers) {
        const next = tracker.deps.map(resolveDep);
        if (
          next.some(
            (value, index) => !Object.is(value, tracker.previous[index]),
          )
        ) {
          tracker.previous = next;
          changed = true;
          tracker.effect();
        }
      }
      if (!changed) return;
    }
  };

  const notify = () => {
    if (notifyQueued) return;
    notifyQueued = true;
    queueMicrotask(() => {
      notifyQueued = false;
      if (status !== MachineStatus.Started) return;
      runTrackers();
      for (const listener of [...listeners]) listener();
    });
  };

  const bindable = (<V>(params: () => BindableParams<V>): Bindable<V> => {
    const initial = params().value ?? params().defaultValue;
    let uncontrolled = initial as V;
    const controlled = () => params().value !== undefined;
    const get = () => (controlled() ? params().value : uncontrolled) as V;
    const isEqual = params().isEqual ?? Object.is;
    return {
      initial,
      ref: {
        get current() {
          return get();
        },
      },
      get,
      set(value) {
        const previous = get();
        const next =
          typeof value === 'function'
            ? (value as (previous: V) => V)(previous)
            : value;
        if (!controlled()) uncontrolled = next;
        if (!isEqual(next, previous)) {
          params().onChange?.(next, previous);
          notify();
        }
      },
      invoke(next, previous) {
        params().onChange?.(next, previous);
      },
      hash(value) {
        return params().hash?.(value) ?? String(value);
      },
    };
  }) as BindableFn;
  bindable.cleanup = (fn) => {
    cleanups.push(fn);
  };
  bindable.ref = <V>(defaultValue: V) => {
    let current = defaultValue;
    return {
      get: () => current,
      set: (next: V) => {
        current = next;
      },
    };
  };

  const getEvent = () => ({
    ...currentEvent,
    current: () => currentEvent,
    previous: () => previousEvent ?? ({ type: '' } as EventType<T['event']>),
  });

  // Assigned below; the context factory only reads these lazily.
  let contextBindables = {} as Record<string, Bindable<unknown>>;
  const context: BindableContext<T> = {
    get: (key) => contextBindables[key as string]?.get() as never,
    set: (key, value) => contextBindables[key as string]?.set(value as never),
    initial: (key) => contextBindables[key as string]?.initial as never,
    hash: (key) => {
      const entry = contextBindables[key as string];
      return entry ? entry.hash(entry.get()) : '';
    },
  };

  const refValues = {} as Record<string, unknown>;
  const refs: BindableRefs<T> = {
    get: (key) => refValues[key as string] as never,
    set: (key, value) => {
      refValues[key as string] = value;
    },
  };

  const flush = (fn: VoidFunction) => {
    queueMicrotask(fn);
  };

  const computed = ((key: string) => {
    const fn = (
      machine.computed as Record<string, (params: unknown) => unknown>
    )?.[key];
    if (!fn)
      throw new Error(`[postkit] No computed value "${key}" on machine.`);
    return fn({ context, event: getEvent(), prop, refs, scope, computed });
  }) as ComputedFn<T>;

  const implementation = (
    kind: 'actions' | 'effects' | 'guards',
    key: string,
  ): ((params: Params<T>) => unknown) | undefined =>
    (
      machine.implementations?.[kind] as Record<
        string,
        (params: Params<T>) => unknown
      >
    )?.[key];

  const action = (keys: unknown) => {
    const names =
      typeof keys === 'function' ? keys(getParams()) : (keys as unknown);
    for (const name of toArray(names as string[] | undefined)) {
      implementation('actions', name)?.(getParams());
    }
  };

  const guard = (key: unknown): boolean | undefined => {
    if (typeof key === 'function') return Boolean(key(getParams()));
    const fn = implementation('guards', key as string);
    return fn ? Boolean(fn(getParams())) : undefined;
  };

  const effect = (keys: unknown): VoidFunction | undefined => {
    const names =
      typeof keys === 'function' ? keys(getParams()) : (keys as unknown);
    const list = toArray(names as string[] | undefined);
    if (list.length === 0) return undefined;
    const disposers: VoidFunction[] = [];
    for (const name of list) {
      const dispose = implementation('effects', name)?.(getParams());
      if (typeof dispose === 'function')
        disposers.push(dispose as VoidFunction);
    }
    return () => disposers.forEach((dispose) => dispose());
  };

  const choose = (transitions: unknown): AnyTransition | undefined =>
    toArray(transitions as AnyTransition | AnyTransition[] | undefined).find(
      (candidate) => (candidate.guard ? Boolean(guard(candidate.guard)) : true),
    );

  type StateDefinition = {
    readonly entry?: unknown;
    readonly exit?: unknown;
    readonly effects?: unknown;
    readonly tags?: readonly string[];
    readonly on?: Record<string, unknown>;
  };
  const stateDefinition = (value: unknown): StateDefinition | undefined =>
    (machine.states as Record<string, StateDefinition>)[value as string];

  const addEffect = (key: string, dispose: VoidFunction | undefined) => {
    if (!dispose) return;
    const existing = effects.get(key);
    effects.set(
      key,
      existing
        ? () => {
            existing();
            dispose();
          }
        : dispose,
    );
  };

  const state = bindable<T['state']>(() => ({
    defaultValue: machine.initialState({ prop }),
    onChange(next, previous) {
      if (previous !== undefined && previous !== INIT_STATE) {
        effects.get(previous as string)?.();
        effects.delete(previous as string);
        action(stateDefinition(previous)?.exit);
      }
      action(transition?.actions);
      addEffect(next as string, effect(stateDefinition(next)?.effects));
      if (previous === INIT_STATE) {
        action(machine.entry);
        addEffect(INIT_STATE, effect(machine.effects));
      }
      action(stateDefinition(next)?.entry);
    },
  }));

  const getState = () => ({
    ...state,
    matches: (...values: T['state'][]) => values.includes(state.get()),
    hasTag: (tag: T['tag']) =>
      stateDefinition(state.get())?.tags?.includes(tag as string) ?? false,
  });

  const send = (event: EventType<T['event']>) => {
    queueMicrotask(() => {
      if (status !== MachineStatus.Started) return;
      previousEvent = currentEvent;
      currentEvent = event;
      const current = state.get();
      const transitions =
        stateDefinition(current)?.on?.[event.type] ??
        (machine.on as Record<string, unknown> | undefined)?.[event.type];
      const next = choose(transitions);
      if (!next) return;
      transition = next;
      const target = (next.target ?? current) as T['state'];
      if (target !== current) {
        state.set(target);
      } else if (next.reenter) {
        state.invoke(current, current);
      } else {
        action(next.actions ?? []);
      }
      notify();
    });
  };

  const track = (deps: readonly (() => unknown)[], fn: VoidFunction) => {
    trackers.push({ deps, effect: fn, previous: deps.map(resolveDep) });
  };

  function getParams(): Params<T> {
    return {
      state: getState(),
      context,
      event: getEvent(),
      prop,
      send,
      action,
      guard,
      track,
      refs,
      computed,
      flush,
      scope,
      choose,
    } as unknown as Params<T>;
  }

  contextBindables = (machine.context?.({
    prop,
    bindable,
    scope,
    flush,
    getContext: () => context,
    getComputed: () => computed,
    getRefs: () => refs,
    getEvent,
  }) ?? {}) as Record<string, Bindable<unknown>>;
  Object.assign(refValues, machine.refs?.({ prop, context }) ?? {});
  machine.watch?.(getParams());

  return {
    get state() {
      return getState();
    },
    get event() {
      return getEvent();
    },
    context,
    prop,
    scope,
    refs,
    computed,
    send,
    getStatus: () => status,
    start() {
      if (status === MachineStatus.Started) return;
      const restarted = status === MachineStatus.Stopped;
      status = MachineStatus.Started;
      transition = null;
      state.invoke(
        restarted ? state.get() : (state.initial as T['state']),
        INIT_STATE as T['state'],
      );
      notify();
    },
    stop() {
      if (status !== MachineStatus.Started) return;
      status = MachineStatus.Stopped;
      effects.forEach((dispose) => dispose());
      effects.clear();
      transition = null;
      action(machine.exit);
      cleanups.splice(0).forEach((dispose) => dispose());
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    setProps(next) {
      rawProps = { ...rawProps, ...next };
      props = resolveProps();
      notify();
    },
  };
}

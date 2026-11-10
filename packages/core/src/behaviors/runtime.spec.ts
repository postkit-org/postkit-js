import { MachineStatus, type Machine } from '@zag-js/core';

import { createMachineBehavior, clampIndex } from './behavior.js';
import { createMachineService } from './runtime.js';

interface ToggleSchema {
  props: {
    id?: string;
    on?: boolean;
    defaultOn?: boolean;
    limit: number;
    log: string[];
  };
  context: { on: boolean; count: number };
  refs: { last: string | null };
  computed: { atLimit: boolean };
  state: 'off' | 'on';
  tag: 'active';
  guard: 'belowLimit';
  action:
    | 'toggle'
    | 'count'
    | 'record'
    | 'enter'
    | 'exit'
    | 'leave'
    | 'start'
    | 'stop';
  effect: 'listen' | 'global';
  event: { type: string; value?: number };
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

function toggleMachine(log: string[]): Machine<ToggleSchema> {
  return {
    props: ({ props }) =>
      ({ limit: 2, log, ...props }) as ToggleSchema['props'],
    initialState: ({ prop }) => (prop('defaultOn') ? 'on' : 'off'),
    context: ({ prop, bindable }) => {
      bindable.cleanup(() => log.push('cleanup'));
      const ref = bindable.ref(0);
      ref.set(ref.get() + 1);
      return {
        on: bindable(() => ({
          defaultValue: Boolean(prop('defaultOn')),
          value: prop('on'),
          onChange: (value) => log.push(`on:${value}`),
        })),
        count: bindable(() => ({
          defaultValue: 0,
          hash: (value) => `#${value}`,
        })),
      };
    },
    refs: () => ({ last: null }),
    computed: {
      atLimit: ({ context, prop }) => context.get('count') >= prop('limit'),
    },
    watch: ({ track, context, action }) => {
      track([() => context.get('count')], () => action(['record']));
    },
    entry: ['start'],
    exit: ['stop'],
    effects: ['global'],
    on: {
      COUNT: { actions: ['count'] },
      RESET: { target: 'off', reenter: true, actions: ['record'] },
    },
    states: {
      off: {
        entry: ['enter'],
        exit: ['leave'],
        on: {
          TOGGLE: [
            { guard: 'belowLimit', target: 'on', actions: ['toggle', 'count'] },
            { actions: ['exit'] },
          ],
        },
      },
      on: {
        tags: ['active'],
        effects: ['listen'],
        on: { TOGGLE: { target: 'off', actions: ['toggle'] } },
      },
    },
    implementations: {
      guards: { belowLimit: ({ computed }) => !computed('atLimit') },
      actions: {
        toggle: ({ context }) => context.set('on', (value) => !value),
        count: ({ context, refs, event }) => {
          context.set('count', (value) => value + 1);
          refs.set('last', event.type);
        },
        record: ({ context }) => log.push(`count:${context.get('count')}`),
        enter: () => log.push('enter off'),
        exit: () => log.push('blocked'),
        leave: () => log.push('leave off'),
        start: () => log.push('start'),
        stop: () => log.push('stop'),
      },
      effects: {
        listen: () => {
          log.push('listen');
          return () => log.push('unlisten');
        },
        global: () => () => log.push('global cleanup'),
      },
    },
  };
}

describe('createMachineService', () => {
  it('runs entry, transitions, guards, effects, trackers and exit', async () => {
    const log: string[] = [];
    const service = createMachineService(toggleMachine(log), { id: 'toggle' });
    const listener = vi.fn();
    const unsubscribe = service.subscribe(listener);

    expect(service.getStatus()).toBe(MachineStatus.NotStarted);
    service.send({ type: 'TOGGLE' });
    await flush();
    expect(service.state.get()).toBe('off');

    service.start();
    service.start();
    expect(log).toEqual(['start', 'enter off']);
    expect(service.scope.id).toBe('toggle');

    service.send({ type: 'TOGGLE' });
    await flush();
    expect(service.state.matches('on')).toBe(true);
    expect(service.state.hasTag('active')).toBe(true);
    expect(service.context.get('on')).toBe(true);
    expect(service.context.hash('count')).toBe('#1');
    expect(service.context.initial('count')).toBe(0);
    expect(service.refs.get('last')).toBe('TOGGLE');
    expect(service.event.current().type).toBe('TOGGLE');
    expect(log).toContain('listen');
    expect(log).toContain('count:1');
    expect(listener).toHaveBeenCalled();

    service.send({ type: 'TOGGLE' });
    await flush();
    expect(log).toContain('unlisten');
    expect(service.state.hasTag('active')).toBe(false);

    service.send({ type: 'COUNT' });
    await flush();
    expect(service.computed('atLimit')).toBe(true);
    service.send({ type: 'TOGGLE' });
    await flush();
    expect(log.at(-1)).toBe('blocked');
    expect(service.event.previous().type).toBe('COUNT');

    service.send({ type: 'RESET' });
    await flush();
    expect(log.slice(-3)).toEqual(['leave off', 'count:2', 'enter off']);

    service.send({ type: 'UNKNOWN' });
    await flush();

    unsubscribe();
    service.stop();
    service.stop();
    expect(log.slice(-3)).toEqual(['global cleanup', 'stop', 'cleanup']);
    expect(service.getStatus()).toBe(MachineStatus.Stopped);

    service.start();
    expect(service.getStatus()).toBe(MachineStatus.Started);
    service.stop();
  });

  it('reads controlled context from props and reacts to setProps', async () => {
    const log: string[] = [];
    const service = createMachineService(toggleMachine(log), { on: false });
    service.start();
    service.send({ type: 'TOGGLE' });
    await flush();
    expect(service.context.get('on')).toBe(false);
    expect(log).toContain('on:true');
    service.setProps({ on: true, limit: 5 });
    expect(service.context.get('on')).toBe(true);
    expect(service.prop('limit')).toBe(5);
    service.stop();
  });

  it('starts in the state the props choose', () => {
    const service = createMachineService(toggleMachine([]), {
      defaultOn: true,
    });
    service.start();
    expect(service.state.get()).toBe('on');
    service.stop();
  });

  it('reports a missing computed value', () => {
    const service = createMachineService(toggleMachine([]));
    expect(() => service.computed('missing' as never)).toThrow(
      /No computed value/,
    );
  });

  it('wraps a machine and connect as a behaviour', async () => {
    const behavior = createMachineBehavior(
      toggleMachine([]),
      (service, normalize) => ({
        on: service.context.get('on'),
        root: normalize.element({ 'data-on': service.context.get('on') }),
      }),
      {},
    );
    const listener = vi.fn();
    behavior.subscribe(listener);
    behavior.start();
    expect(behavior.api.on).toBe(false);
    behavior.service.send({ type: 'TOGGLE' });
    await flush();
    expect(behavior.api).toEqual({ on: true, root: { 'data-on': true } });
    expect(listener).toHaveBeenCalled();
    behavior.stop();
  });
});

describe('clampIndex', () => {
  it('parses, truncates and clamps', () => {
    expect(clampIndex(undefined, 3)).toBe(0);
    expect(clampIndex('2', 3)).toBe(2);
    expect(clampIndex(1.7, 3)).toBe(1);
    expect(clampIndex(-4, 3)).toBe(0);
    expect(clampIndex(8, 3)).toBe(2);
    expect(clampIndex('nope', 3)).toBe(0);
    expect(clampIndex(2, 0)).toBe(0);
  });
});

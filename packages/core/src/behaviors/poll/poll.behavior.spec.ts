// @vitest-environment jsdom
import { normalizeProps, spreadProps } from '../dom.js';
import {
  createBareDriver,
  element,
} from '../testing/bare-driver.spec-support.js';
import { registerBehaviorSpec } from '../testing/harness.js';
import {
  pollBehaviorSpec,
  type PollBehaviorFixture,
} from './poll.behavior.spec-suite.js';
import {
  connectPoll,
  createPoll,
  pollInitialState,
  pollStatus,
  pollTotal,
  pollTransition,
  type PollApi,
} from './poll.behavior.js';

const driver = createBareDriver<PollBehaviorFixture, PollApi>(
  (container, fixture) => {
    const behavior = createPoll(fixture);
    const root = element('div');
    container.append(root);
    return {
      behavior,
      update(api) {
        const group = element('div');
        spreadProps(group, api.getOptionGroupProps());
        for (const result of api.results) {
          const button = element('button');
          spreadProps(button, api.getOptionProps(result.option));
          button.append(element('span', result.option.label));
          if (api.showResults) {
            button.append(element('span', `${result.percentage}%`));
            const meter = element('div');
            const bar = element('div');
            spreadProps(meter, api.getProgressProps(result));
            spreadProps(bar, api.getBarProps(result));
            meter.append(bar);
            button.append(meter);
          }
          group.append(button);
        }
        const status = element('p', api.status);
        spreadProps(status, api.getStatusProps());
        root.replaceChildren(element('p', fixture.question), group, status);
      },
    };
  },
);

registerBehaviorSpec(
  pollBehaviorSpec(driver),
  { describe, it },
  { label: 'bare machine' },
);

describe('poll machine', () => {
  it('starts from selectedId and holds one vote', () => {
    expect(pollInitialState()).toEqual({});
    expect(pollInitialState('a')).toEqual({ selectedId: 'a' });
    const state = pollInitialState('a');
    expect(pollTransition(state, { type: 'VOTE', id: 'a' })).toBe(state);
    expect(pollTransition(state, { type: 'VOTE', id: 'b' })).toEqual({
      selectedId: 'b',
    });
  });

  it('totals and describes the votes as Postkit polls do', () => {
    const options = [
      { id: 'a', label: 'A', votes: 2 },
      { id: 'b', label: 'B' },
    ];
    expect(pollTotal(options)).toBe(2);
    expect(pollTotal(options, '10')).toBe(10);
    expect(pollTotal(options, 'many')).toBe(2);
    expect(pollStatus(undefined, 0)).toBe('Select an option');
    expect(pollStatus(undefined, 2)).toBe('2 votes');
    expect(pollStatus('a', 2)).toBe('Vote selected');
  });

  it('ignores unknown options and prevented clicks', () => {
    const send = vi.fn();
    const onVote = vi.fn();
    const api = connectPoll({ state: {}, send }, normalizeProps, {
      question: 'Q',
      options: [{ id: 'a', label: 'A' }],
      onVote,
    });
    api.vote('missing');
    (
      api.getOptionProps({ id: 'a', label: 'A' }) as {
        onClick(event: unknown): void;
      }
    ).onClick({ defaultPrevented: true });
    expect(send).not.toHaveBeenCalled();
    api.vote('a');
    expect(send).toHaveBeenCalledWith({ type: 'VOTE', id: 'a' });
    expect(onVote).toHaveBeenCalledWith({ id: 'a', label: 'A' });
    const [result] = api.results;
    expect(result && api.getBarProps(result)).toEqual({
      style: { width: '0%' },
    });
  });

  it('runs framework-free, notifying while started', () => {
    const behavior = createPoll({
      question: 'Q',
      options: [{ id: 'a', label: 'A' }],
    });
    const listener = vi.fn();
    const unsubscribe = behavior.subscribe(listener);
    behavior.send({ type: 'VOTE', id: 'a' });
    expect(listener).not.toHaveBeenCalled();
    behavior.start();
    behavior.send({ type: 'VOTE', id: 'b' });
    expect(listener).toHaveBeenCalledTimes(1);
    expect(behavior.state).toEqual({ selectedId: 'b' });
    unsubscribe();
    behavior.stop();
  });
});

import type { Behavior } from '../behavior.js';

/** A poll option: a stable id, its label and, optionally, its vote count. */
export interface PollOption {
  readonly id: string;
  readonly label: string;
  readonly votes?: number;
}

/** The poll's state: the option this reader voted for, if any. */
export interface PollState {
  readonly selectedId?: string;
}

/** Events the poll machine accepts. */
export type PollEvent = { readonly type: 'VOTE'; readonly id: string };

/** The state a poll starts in: `selectedId` pre-selects an option. */
export function pollInitialState(selectedId?: string): PollState {
  return selectedId ? { selectedId } : {};
}

/**
 * The poll state machine as a pure function. `VOTE` selects an option; a vote
 * for the option already selected leaves the state unchanged (the same
 * object), so one reader holds a single vote per poll instance.
 */
export function pollTransition(state: PollState, event: PollEvent): PollState {
  if (event.type === 'VOTE' && event.id !== state.selectedId) {
    return { selectedId: event.id };
  }
  return state;
}

/** One option's share of the votes. */
export interface PollResult {
  readonly option: PollOption;
  /** Rounded to a whole percentage; 0 when there are no votes. */
  readonly percentage: number;
  readonly selected: boolean;
}

/**
 * The total votes: `totalVotes` (a number, or a string from a Markdown
 * directive) when it is a positive number, otherwise the sum of the options'
 * counts.
 */
export function pollTotal(
  options: readonly PollOption[],
  totalVotes?: number | string,
): number {
  return (
    Number(totalVotes) ||
    options.reduce((sum, option) => sum + (option.votes ?? 0), 0)
  );
}

/**
 * The status line Postkit's polls show: "Vote selected" after a vote, the
 * total ("12 votes") when there are counts, and "Select an option" otherwise.
 */
export function pollStatus(
  selectedId: string | undefined,
  total: number,
): string {
  return selectedId
    ? 'Vote selected'
    : total
      ? `${total} votes`
      : 'Select an option';
}

/** The current state and a way to send events, from any host. */
export interface PollService {
  readonly state: PollState;
  send(event: PollEvent): void;
}

/**
 * A prop normalizer, as Zag's: `@zag-js/react`'s `normalizeProps` for React,
 * or `normalizeProps` from this module for the DOM.
 */
export interface PollNormalizer<Button, Element> {
  button(props: Record<string, unknown>): Button;
  element(props: Record<string, unknown>): Element;
}

/** What the poll is about, for {@link connectPoll}. */
export interface PollContext {
  /** The question; it names the option group. */
  readonly question: string;
  readonly options: readonly PollOption[];
  /** A total to show instead of the sum of the options' counts. */
  readonly totalVotes?: number | string;
  /** Called once per new vote; the host records it. */
  readonly onVote?: (option: PollOption) => void | Promise<void>;
}

/** What a renderer reads to draw a poll. */
export interface PollApi<
  Button = Record<string, unknown>,
  Element = Record<string, unknown>,
> {
  readonly selectedId: string | undefined;
  readonly total: number;
  /** True when there are counts to show as results. */
  readonly showResults: boolean;
  /** Each option with its share of the votes, in order. */
  readonly results: readonly PollResult[];
  /** "Vote selected", "12 votes" or "Select an option". */
  readonly status: string;
  /** Votes for an option, as its button does. */
  vote(id: string): void;
  /** The group of option buttons, named by the question. */
  getOptionGroupProps(): Element;
  /** An option's button; `aria-pressed` marks the reader's vote. */
  getOptionProps(option: PollOption): Button;
  /** An option's results meter (`role="progressbar"`). */
  getProgressProps(result: PollResult): Element;
  /** The filled part of an option's meter, as wide as its share. */
  getBarProps(result: PollResult): Element;
  /** The status line, announced politely. */
  getStatusProps(): Element;
}

/** Connects poll state to renderer props. */
export function connectPoll<Button, Element>(
  service: PollService,
  normalize: PollNormalizer<Button, Element>,
  context: PollContext,
): PollApi<Button, Element> {
  const { state, send } = service;
  const total = pollTotal(context.options, context.totalVotes);
  const results = context.options.map((option) => ({
    option,
    percentage: total > 0 ? Math.round(((option.votes ?? 0) / total) * 100) : 0,
    selected: state.selectedId === option.id,
  }));
  const vote = (id: string) => {
    if (id === state.selectedId) return;
    const option = context.options.find((candidate) => candidate.id === id);
    if (!option) return;
    send({ type: 'VOTE', id });
    void context.onVote?.(option);
  };
  return {
    selectedId: state.selectedId,
    total,
    showResults: total > 0,
    results,
    status: pollStatus(state.selectedId, total),
    vote,
    getOptionGroupProps: () =>
      normalize.element({ role: 'group', 'aria-label': context.question }),
    getOptionProps: (option) =>
      normalize.button({
        type: 'button',
        'aria-pressed': state.selectedId === option.id,
        onClick(event: { defaultPrevented?: boolean }) {
          if (event?.defaultPrevented) return;
          vote(option.id);
        },
      }),
    getProgressProps: (result) =>
      normalize.element({
        role: 'progressbar',
        'aria-label': `${result.option.label}: ${result.percentage}%`,
        'aria-valuemin': 0,
        'aria-valuemax': 100,
        'aria-valuenow': result.percentage,
      }),
    getBarProps: (result) =>
      normalize.element({ style: { width: `${result.percentage}%` } }),
    getStatusProps: () => normalize.element({ 'aria-live': 'polite' }),
  };
}

/** Options for {@link createPoll}. */
export interface PollBehaviorOptions extends PollContext {
  /** An option selected from the start. */
  readonly selectedId?: string;
}

/** A running poll behaviour. */
export interface PollBehavior extends Behavior<PollApi> {
  readonly state: PollState;
  send(event: PollEvent): void;
}

const identityNormalizer: PollNormalizer<
  Record<string, unknown>,
  Record<string, unknown>
> = {
  button: (props) => props,
  element: (props) => props,
};

/**
 * Creates the poll behaviour without a UI framework. Plain TypeScript, with
 * no Zag dependency (decision D7).
 */
export function createPoll(options: PollBehaviorOptions): PollBehavior {
  let state = pollInitialState(options.selectedId);
  const listeners = new Set<() => void>();
  let running = false;
  const send = (event: PollEvent) => {
    const next = pollTransition(state, event);
    if (next === state) return;
    state = next;
    if (running) for (const listener of [...listeners]) listener();
  };
  return {
    get state() {
      return state;
    },
    send,
    get api() {
      return connectPoll({ state, send }, identityNormalizer, options);
    },
    start() {
      running = true;
    },
    stop() {
      running = false;
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

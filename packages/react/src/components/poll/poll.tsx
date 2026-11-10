import type { PollOption } from '@postkit/core/behaviors';
import { pollDefinition, type PostkitSlotOf } from '@postkit/core/components';

import { usePoll } from '../../hooks/use-poll.js';
import { postkitJsonItems } from '../../lib/json-items.js';
import { mergePostkitPartProps } from '../../lib/merge-part.js';
import { postkitView, type PostkitViewProps } from '../../lib/view.js';

export type { PollOption };
export type PollSlot = PostkitSlotOf<typeof pollDefinition>;

export type PollProps = Omit<
  PostkitViewProps<typeof pollDefinition>,
  'options' | 'totalVotes'
> & {
  /** The options, or authored JSON text for them. */
  readonly options: string | readonly PollOption[];
  /** A total to show instead of the sum of the options' votes. */
  readonly totalVotes?: number | string;
  /** Called once per new vote; record it in your own store. */
  readonly onVote?: (option: PollOption) => void | Promise<void>;
};

/**
 * A reader poll whose votes the host records, from `usePoll`: headless
 * markup only. Each option is a toggle button (`aria-pressed`) in a group
 * named by the question; with vote counts, it shows its share as a
 * percentage and a `role="progressbar"` meter whose `bar` part is as wide as
 * the share. A reader holds one vote per poll.
 */
export const Poll = postkitView<typeof pollDefinition, PollProps>(
  pollDefinition,
  ({ props, part }) => {
    const { question, description } = props;
    const options = postkitJsonItems<PollOption>(props.options, 'Poll options');
    const api = usePoll({
      question,
      options,
      totalVotes: props.totalVotes,
      selectedId: props.selectedId,
      onVote: props.onVote,
    });
    return (
      <div {...part('root')}>
        <p {...part('question')}>{question}</p>
        {description ? <p {...part('description')}>{description}</p> : null}
        <div
          {...mergePostkitPartProps(api.getOptionGroupProps(), part('options'))}
        >
          {api.results.map((result) => (
            <button
              {...mergePostkitPartProps(
                api.getOptionProps(result.option),
                part('option'),
              )}
              key={result.option.id}
            >
              <span {...part('optionLabel')}>
                <span>{result.option.label}</span>
                {api.showResults ? (
                  <span {...part('result')}>{result.percentage}%</span>
                ) : null}
              </span>
              {api.showResults ? (
                <span {...api.getProgressProps(result)}>
                  <span>
                    <span
                      {...mergePostkitPartProps(
                        api.getBarProps(result),
                        part('bar'),
                      )}
                    />
                  </span>
                </span>
              ) : null}
            </button>
          ))}
        </div>
        <p {...mergePostkitPartProps(api.getStatusProps(), part('status'))}>
          {api.status}
        </p>
      </div>
    );
  },
);

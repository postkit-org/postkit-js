'use client';

import {
  Box,
  Button,
  Heading,
  Progress,
  Text,
  type BoxProps,
  type RecipeVariantProps,
  type UnstyledProp,
} from '@chakra-ui/react';
import { pollDefinition } from '@postkit/core/components';
import { useState } from 'react';

import { postkitHeadingSize } from '../../lib/components/heading-size.js';
import { parseJsonProp } from '../../lib/json-props.js';
import type { PostkitSlotStyles } from '../../lib/recipes/types.js';
import { postkitChakraView } from '../../lib/view.js';
import { postkitPollRecipe, type PostkitPollSlot } from './poll.recipe.js';

export interface PollOption {
  readonly id: string;
  readonly label: string;
  readonly votes?: number;
}
export type PollProps = {
  readonly question: string;
  readonly description?: string;
  readonly options: string | readonly PollOption[];
  readonly totalVotes?: number | string;
  readonly selectedId?: string;
  readonly onVote?: (option: PollOption) => void | Promise<void>;
  readonly rootProps?: BoxProps;
  readonly slotStyles?: PostkitSlotStyles<PostkitPollSlot>;
  /** A class per anatomy part, added after the recipe's class. */
  readonly classNames?: Partial<Readonly<Record<PostkitPollSlot, string>>>;
} & RecipeVariantProps<typeof postkitPollRecipe> &
  UnstyledProp;

/**
 * An interactive reader poll whose submission handler is host-owned, styled
 * by its Chakra recipe.
 *
 * Poll is `chakra-only` for now: its voting behaviour isn't in
 * `@postkit/core/behaviors` yet, so `@postkit/react` has no headless view
 * (03 D11; see `chakraOnly` in `@postkit/react`).
 */
export const Poll = postkitChakraView<typeof pollDefinition, PollProps>(
  pollDefinition,
  postkitPollRecipe,
  ({ props, variants, part }) => {
    const { question, description, onVote } = props;
    const options = parseJsonProp<PollOption>(props.options, 'Poll options');
    const [selection, setSelection] = useState(props.selectedId);
    const total =
      Number(props.totalVotes) ||
      options.reduce((sum, option) => sum + (option.votes ?? 0), 0);
    const size = (variants['size'] as PollProps['size']) ?? 'md';
    const vote = (option: PollOption) => {
      setSelection(option.id);
      void onVote?.(option);
    };
    return (
      <Box {...part('root')}>
        <Heading
          as="p"
          size={postkitHeadingSize(variants['size'], {
            sm: 'lg',
            md: 'xl',
            lg: '2xl',
          })}
          {...part('question')}
        >
          {question}
        </Heading>
        {description ? (
          <Text {...part('description')}>{description}</Text>
        ) : null}
        <Box role="group" aria-label={question} {...part('options')}>
          {options.map((option) => {
            const percentage =
              total > 0 ? Math.round(((option.votes ?? 0) / total) * 100) : 0;
            return (
              <Button
                type="button"
                size={size}
                variant="outline"
                aria-pressed={selection === option.id}
                onClick={() => vote(option)}
                {...part('option')}
                key={option.id}
              >
                <Box {...part('optionLabel')}>
                  <span>{option.label}</span>
                  {total ? (
                    <Box as="span" {...part('result')}>
                      {percentage}%
                    </Box>
                  ) : null}
                </Box>
                {total ? (
                  <Progress.Root
                    value={percentage}
                    size="xs"
                    aria-label={`${option.label}: ${percentage}%`}
                  >
                    <Progress.Track>
                      <Progress.Range {...part('bar')} />
                    </Progress.Track>
                  </Progress.Root>
                ) : null}
              </Button>
            );
          })}
        </Box>
        <Text aria-live="polite" {...part('status')}>
          {selection
            ? 'Vote selected'
            : total
              ? `${total} votes`
              : 'Select an option'}
        </Text>
      </Box>
    );
  },
);

'use client';

import {
  Box,
  Button,
  Heading,
  Progress,
  Text,
  type BoxProps,
  type ButtonProps,
  type RecipeVariantProps,
  type UnstyledProp,
} from '@chakra-ui/react';
import { pollDefinition } from '@postkit/core/components';
import { usePoll } from '@postkit/react';

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
 * by its Chakra recipe. Its behaviour (results, one vote per poll, the
 * status line) comes from `usePoll` in `@postkit/react`, which the headless
 * `Poll` uses too.
 */
export const Poll = postkitChakraView<typeof pollDefinition, PollProps>(
  pollDefinition,
  postkitPollRecipe,
  ({ props, variants, part }) => {
    const { question, description } = props;
    const options = parseJsonProp<PollOption>(props.options, 'Poll options');
    const api = usePoll({
      question,
      options,
      totalVotes: props.totalVotes,
      selectedId: props.selectedId,
      onVote: props.onVote,
    });
    const size = (variants['size'] as PollProps['size']) ?? 'md';
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
        <Box {...(api.getOptionGroupProps() as BoxProps)} {...part('options')}>
          {api.results.map((result) => {
            const { option, percentage } = result;
            return (
              <Button
                {...(api.getOptionProps(option) as ButtonProps)}
                size={size}
                variant="outline"
                {...part('option')}
                key={option.id}
              >
                <Box {...part('optionLabel')}>
                  <span>{option.label}</span>
                  {api.showResults ? (
                    <Box as="span" {...part('result')}>
                      {percentage}%
                    </Box>
                  ) : null}
                </Box>
                {api.showResults ? (
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
        <Text {...(api.getStatusProps() as BoxProps)} {...part('status')}>
          {api.status}
        </Text>
      </Box>
    );
  },
);

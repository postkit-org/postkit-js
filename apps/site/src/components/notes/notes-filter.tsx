import { chakra } from '@chakra-ui/react';

import { noteKindFilters, type NoteKind } from '../../lib/notes';

export type NotesFilterValue = NoteKind | 'all';

export interface NotesFilterProps {
  readonly value: NotesFilterValue;
  readonly onChange: (value: NotesFilterValue) => void;
}

const options: readonly { value: NotesFilterValue; label: string }[] = [
  { value: 'all', label: 'All' },
  ...noteKindFilters.map((filter) => ({
    value: filter.kind,
    label: filter.label,
  })),
];

/**
 * The kind chips (SiteNotes): toggle buttons (`aria-pressed`) on a `bg.subtle` track, the
 * pressed one `bg.raised` with the segment shadow. On phones the track runs to the right
 * edge and scrolls sideways rather than wrapping (PhoneNotes).
 */
export function NotesFilter({ value, onChange }: NotesFilterProps) {
  return (
    <chakra.div
      role="group"
      aria-label="Filter notes"
      display={{ base: 'flex', md: 'inline-flex' }}
      flexWrap={{ base: 'nowrap', md: 'wrap' }}
      gap="4px"
      padding="4px"
      borderRadius="full"
      bg="bg.subtle"
      maxW="100%"
      overflowX={{ base: 'auto', md: 'visible' }}
      css={{ scrollbarWidth: 'none' }}
    >
      {options.map((option) => {
        const pressed = option.value === value;
        return (
          <chakra.button
            key={option.value}
            type="button"
            aria-pressed={pressed}
            onClick={() => onChange(option.value)}
            flex="0 0 auto"
            minH="36px"
            paddingInline="16px"
            border="0"
            borderRadius="full"
            fontFamily="inherit"
            fontSize="14px"
            whiteSpace="nowrap"
            cursor="pointer"
            bg={pressed ? 'bg.raised' : 'transparent'}
            boxShadow={pressed ? 'segment' : 'none'}
            color={pressed ? 'fg' : 'fg.muted'}
            transitionProperty="color, background-color"
            transitionDuration="hover"
            transitionTimingFunction="ease-out"
            _hover={{ color: 'fg' }}
            _focusVisible={{
              outline: '2px solid',
              outlineColor: 'accent',
              outlineOffset: '-2px',
            }}
          >
            {option.label}
          </chakra.button>
        );
      })}
    </chakra.div>
  );
}

import { Box, chakra } from '@chakra-ui/react';
import { useState } from 'react';

import { noteKindFilters, type NoteSummary } from '../../lib/notes';
import { FeaturedNote, NoteList } from './note-list';
import { NotesFilter, type NotesFilterValue } from './notes-filter';

export interface NotesIndexProps {
  /** Newest first, drafts already left out in production (`getNotes`). */
  readonly notes: readonly NoteSummary[];
}

function EmptyState({ children }: { readonly children: string }) {
  return (
    <chakra.p
      role="status"
      margin="0"
      paddingBlock="32px"
      borderBlockWidth="1px"
      borderColor="border"
      fontSize="17px"
      color="fg.muted"
    >
      {children}
    </chakra.p>
  );
}

/**
 * The filter chips, the featured note and the list. The featured slot is the newest note
 * in the current filter; the list is the rest. With no notes at all (only drafts, in
 * production) the chips are left out and an empty state stands in.
 */
export function NotesIndex({ notes }: NotesIndexProps) {
  const [filter, setFilter] = useState<NotesFilterValue>('all');

  if (notes.length === 0) {
    return (
      <Box marginTop="40px">
        <EmptyState>
          No notes yet. The first ones are on the way: subscribe below, or add a
          feed to your reader.
        </EmptyState>
      </Box>
    );
  }

  const shown =
    filter === 'all' ? notes : notes.filter((note) => note.kind === filter);
  const [featured, ...rest] = shown;
  const filterLabel =
    noteKindFilters.find((option) => option.kind === filter)?.label ?? '';

  return (
    <>
      <Box marginTop="40px">
        <NotesFilter value={filter} onChange={setFilter} />
      </Box>

      {featured ? (
        <>
          <Box marginTop="32px">
            <FeaturedNote note={featured} />
          </Box>
          {rest.length > 0 ? (
            <Box marginTop="72px">
              <NoteList notes={rest} />
            </Box>
          ) : null}
        </>
      ) : (
        <Box marginTop="32px">
          <EmptyState>{`No ${filterLabel.toLowerCase()} yet.`}</EmptyState>
        </Box>
      )}
    </>
  );
}

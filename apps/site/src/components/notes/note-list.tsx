import { Box, chakra } from '@chakra-ui/react';
import NextLink from 'next/link';

import {
  formatNoteDate,
  formatReadingTime,
  noteHref,
  noteKindLabel,
  type NoteSummary,
} from '../../lib/notes';
import { TwoToneHeading } from '../layout';
import { AuthorAvatar } from './author-avatar';
import { NoteCover } from './note-cover';

const RowLink = chakra(NextLink);

const rowLinkStyles = {
  textDecoration: 'none',
  color: 'fg',
  borderRadius: 'xl',
} as const;

export interface FeaturedNoteProps {
  readonly note: NoteSummary;
}

/** The newest note, large: cover on the left, meta, two-tone title and author (SiteNotes). */
export function FeaturedNote({ note }: FeaturedNoteProps) {
  return (
    <RowLink
      href={noteHref(note)}
      prefetch={false}
      display="flex"
      flexWrap="wrap"
      gap="24px 40px"
      alignItems="center"
      {...rowLinkStyles}
    >
      <NoteCover
        note={note}
        flex="1 1 520px"
        minW="0"
        aspectRatio="16 / 9"
        borderRadius="24px"
      />
      <Box flex="1 1 320px" minW="0">
        <chakra.span display="block" fontSize="14px" color="fg.muted">
          Featured · {formatNoteDate(note.date)} ·{' '}
          {formatReadingTime(note.readingMinutes)}
        </chakra.span>
        <TwoToneHeading
          as="h2"
          title={note.title}
          quiet={note.subtitle}
          marginTop="10px"
          fontSize="clamp(28px, 3.2vw, 40px)"
          fontWeight="medium"
          lineHeight="1.1"
          letterSpacing="heading"
          css={{ textWrap: 'pretty' }}
        />
        <chakra.span
          display="flex"
          alignItems="center"
          gap="10px"
          marginTop="18px"
          fontSize="15px"
        >
          <AuthorAvatar author={note.author} size={28} />
          {note.author.name}
        </chakra.span>
      </Box>
    </RowLink>
  );
}

export interface NoteListProps {
  readonly notes: readonly NoteSummary[];
}

/** One row per note: thumbnail, kind · date, title and summary (SiteNotes, PhoneNotes). */
export function NoteList({ notes }: NoteListProps) {
  return (
    <chakra.ul
      margin="0"
      padding="0"
      listStyleType="none"
      borderBottomWidth="1px"
      borderBottomColor="border"
    >
      {notes.map((note) => (
        <chakra.li key={note.slug} borderTopWidth="1px" borderTopColor="border">
          <RowLink
            href={noteHref(note)}
            prefetch={false}
            display="flex"
            flexWrap="wrap"
            gap="12px 32px"
            alignItems="center"
            paddingBlock="24px"
            {...rowLinkStyles}
          >
            <NoteCover
              note={note}
              flex="0 0 160px"
              maxW="100%"
              aspectRatio="16 / 10"
              borderRadius="lg"
            />
            <Box flex="1 1 360px" minW="0">
              <chakra.span display="block" fontSize="14px" color="fg.muted">
                {noteKindLabel(note.kind)} · {formatNoteDate(note.date)}
              </chakra.span>
              <chakra.h2
                margin="4px 0 0"
                fontSize="22px"
                fontWeight="medium"
                lineHeight="1.2"
                letterSpacing="tight"
              >
                {note.title}
              </chakra.h2>
              <chakra.span
                display="block"
                marginTop="6px"
                fontSize="16px"
                lineHeight="body"
                color="fg.muted"
              >
                {note.summary}
              </chakra.span>
            </Box>
          </RowLink>
        </chakra.li>
      ))}
    </chakra.ul>
  );
}

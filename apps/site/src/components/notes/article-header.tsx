import { Box, chakra } from '@chakra-ui/react';
import type { ReactNode } from 'react';

import {
  formatNoteDate,
  formatReadingTime,
  hasGradientCover,
  noteKindLabel,
  type NoteSummary,
} from '../../lib/notes';
import { PageContainer, TwoToneHeading } from '../layout';
import { AuthorAvatar } from './author-avatar';
import { NoteCover } from './note-cover';

export interface ArticleHeaderProps {
  readonly note: NoteSummary;
  /**
   * The lead image's caption. Notes have no caption field yet, so nothing passes one; when
   * one does, it sits under the image, aligned with its left edge (01 §6.6).
   */
  readonly caption?: ReactNode;
}

/**
 * The centred article header (SiteArticle): kind · date · read time, the two-tone title,
 * the author with a circle avatar, then the lead image (or the `cover` gradient) at the
 * content width.
 */
export function ArticleHeader({ note, caption }: ArticleHeaderProps) {
  const published = (
    <chakra.time dateTime={note.date}>{formatNoteDate(note.date)}</chakra.time>
  );

  return (
    <>
      <PageContainer
        as="header"
        paddingTop={{ base: '64px', md: '112px' }}
        textAlign="center"
      >
        <chakra.p margin="0 0 18px" fontSize="15px" color="fg.muted">
          {noteKindLabel(note.kind)} · {published} ·{' '}
          {formatReadingTime(note.readingMinutes)}
        </chakra.p>
        <TwoToneHeading
          as="h1"
          textStyle="pageTitle"
          title={note.title}
          quiet={note.subtitle}
          maxW="26ch"
          marginInline="auto"
        />
        <chakra.p
          margin="28px 0 0"
          display="inline-flex"
          alignItems="center"
          gap="10px"
          fontSize="15px"
          color="fg"
        >
          <AuthorAvatar author={note.author} size={36} />
          {note.author.name}
        </chakra.p>
      </PageContainer>

      <PageContainer paddingTop={{ base: '40px', md: '72px' }}>
        <chakra.figure margin="0">
          <NoteCover
            note={note}
            alt={hasGradientCover(note) ? '' : note.title}
            height="clamp(240px, 36vw, 520px)"
            borderRadius="3xl"
          />
          {caption ? (
            <Box
              as="figcaption"
              margin="14px 0 0"
              maxW="prose"
              fontSize="14px"
              color="fg.muted"
              textAlign="start"
            >
              {caption}
            </Box>
          ) : null}
        </chakra.figure>
      </PageContainer>
    </>
  );
}

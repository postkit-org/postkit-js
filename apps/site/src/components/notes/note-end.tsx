import { Box, chakra } from '@chakra-ui/react';
import NextLink from 'next/link';
import { Fragment } from 'react';

import {
  noteHref,
  type NoteComponentLink,
  type NoteSummary,
} from '../../lib/notes';

const PlainLink = chakra(NextLink);

export interface NoteEndProps {
  /** The Postkit components the note's MDX uses. Hidden when there are none. */
  readonly components: readonly NoteComponentLink[];
  /** The note after this one on the index. "Next note" is hidden when there isn't one. */
  readonly next: Pick<NoteSummary, 'slug' | 'title'> | null;
}

/** The article's last row (SiteArticle): "Components in this note", then "Next note". */
export function NoteEnd({ components, next }: NoteEndProps) {
  if (components.length === 0 && !next) return null;

  return (
    <Box
      marginTop="96px"
      paddingTop="24px"
      borderTopWidth="1px"
      borderTopColor="border"
      display="flex"
      flexWrap="wrap"
      gap="32px"
      justifyContent="space-between"
    >
      {components.length > 0 ? (
        <chakra.nav aria-labelledby="note-components" flex="1 1 260px">
          <chakra.h2
            id="note-components"
            margin="0 0 8px"
            fontSize="14px"
            fontWeight="regular"
            color="fg.muted"
          >
            Components in this note
          </chakra.h2>
          <chakra.p
            margin="0"
            fontFamily="mono"
            fontSize="13.5px"
            lineHeight="1.8"
          >
            {components.map((component, index) => (
              <Fragment key={component.name}>
                {/* The separator trails its name, so a wrapped line never starts with "·". */}
                <chakra.span whiteSpace="nowrap">
                  <PlainLink
                    href={component.href}
                    prefetch={false}
                    color="fg"
                    textDecoration="none"
                    borderRadius="xs"
                    transitionProperty="color"
                    transitionDuration="hover"
                    transitionTimingFunction="ease-out"
                    _hover={{ color: 'accent' }}
                  >
                    {component.name}
                  </PlainLink>
                  {index < components.length - 1 ? (
                    <chakra.span aria-hidden="true" color="fg.quiet">
                      {' ·'}
                    </chakra.span>
                  ) : null}
                </chakra.span>{' '}
              </Fragment>
            ))}
          </chakra.p>
        </chakra.nav>
      ) : null}

      {next ? (
        <PlainLink
          href={noteHref(next)}
          prefetch={false}
          flex="0 1 220px"
          marginInlineStart="auto"
          display="flex"
          flexDirection="column"
          textAlign="right"
          textDecoration="none"
          borderRadius="sm"
          color="fg"
        >
          <chakra.span fontSize="14px" color="fg.muted">
            Next note
          </chakra.span>
          <chakra.span fontSize="19px">
            {next.title} <span aria-hidden="true">›</span>
          </chakra.span>
        </PlainLink>
      ) : null}
    </Box>
  );
}

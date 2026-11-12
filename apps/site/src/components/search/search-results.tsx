import { Box, chakra } from '@chakra-ui/react';
import {
  highlightSegments,
  type SearchResultGroup,
  type SearchResultGroupId,
  type SiteSearchResult,
} from '@postkit/site-search/client';
import type { MouseEvent } from 'react';

import { Kbd } from '../primitives';

export interface SearchOption {
  readonly id: string;
  readonly group: SearchResultGroupId;
  readonly result: SiteSearchResult;
}

/** The boards' row marks: ◧ component, ¶ docs, ✎ note, ↻ changelog. */
const marks: Record<string, string> = {
  components: '◧',
  docs: '¶',
  notes: '✎',
  changelog: '↻',
};

export function Highlighted({
  text,
  query,
}: {
  readonly text: string;
  readonly query: string;
}) {
  return (
    <>
      {highlightSegments(text, query).map((segment, index) =>
        segment.match ? (
          // `fg`, not the snippet's grey: grey on the highlight is under 4.5:1.
          <chakra.mark
            key={index}
            bg="highlight"
            color="fg"
            borderRadius="3px"
            paddingInline="1px"
          >
            {segment.text}
          </chakra.mark>
        ) : (
          segment.text
        ),
      )}
    </>
  );
}

/** A docs section result reads "Page · Section"; everything else is its title. */
function resultTitle(result: SiteSearchResult): string {
  return result.kind === 'heading' && result.sectionTitle
    ? `${result.title} · ${result.sectionTitle}`
    : result.title;
}

export interface SearchResultListProps {
  readonly id: string;
  readonly label: string;
  readonly groups: readonly SearchResultGroup[];
  readonly options: readonly SearchOption[];
  readonly activeId: string | undefined;
  /** The query to highlight; empty for the featured list. */
  readonly query: string;
  readonly onHover: (index: number) => void;
  readonly onSelect: (
    event: MouseEvent<HTMLAnchorElement>,
    result: SiteSearchResult,
  ) => void;
}

/**
 * The listbox: one `group` per heading, one `option` per result. Options are links, so a
 * modified click opens a new tab; focus stays in the input and `aria-activedescendant`
 * points here (01 §8).
 */
export function SearchResultList({
  id,
  label,
  groups,
  options,
  activeId,
  query,
  onHover,
  onSelect,
}: SearchResultListProps) {
  return (
    <Box
      id={id}
      role="listbox"
      aria-label={label}
      paddingTop={groups.length > 0 ? '4px' : '0'}
      paddingBottom={groups.length > 0 ? '10px' : '0'}
      paddingInline="8px"
    >
      {groups.map((group) => {
        const labelId = `${id}-${group.id}`;
        return (
          <Box key={group.id} role="group" aria-labelledby={labelId}>
            {/* `fg.muted`, not the boards' `fg.quiet`, which is 3.6:1 at 12.5px. */}
            <Box
              id={labelId}
              paddingTop="14px"
              paddingBottom="6px"
              paddingInline="12px"
              fontSize="12.5px"
              lineHeight="body"
              color="fg.muted"
            >
              {group.label}
            </Box>
            {group.results.map((result) => {
              const index = options.findIndex(
                (option) => option.result === result,
              );
              const option = options[index];
              const selected = option?.id === activeId;
              return (
                <SearchResultRow
                  key={result.id}
                  id={option?.id}
                  result={result}
                  selected={selected}
                  query={query}
                  onMouseMove={() => {
                    if (!selected) onHover(index);
                  }}
                  onClick={(event) => onSelect(event, result)}
                />
              );
            })}
          </Box>
        );
      })}
    </Box>
  );
}

interface SearchResultRowProps {
  readonly id: string | undefined;
  readonly result: SiteSearchResult;
  readonly selected: boolean;
  readonly query: string;
  readonly onMouseMove: () => void;
  readonly onClick: (event: MouseEvent<HTMLAnchorElement>) => void;
}

function SearchResultRow({
  id,
  result,
  selected,
  query,
  onMouseMove,
  onClick,
}: SearchResultRowProps) {
  const upcoming = result.tags?.includes('upcoming');

  return (
    <chakra.a
      id={id}
      role="option"
      aria-selected={selected}
      href={result.route}
      tabIndex={-1}
      onMouseMove={onMouseMove}
      onClick={onClick}
      display="flex"
      alignItems="center"
      gap="14px"
      paddingBlock="10px"
      paddingInline="12px"
      borderRadius="md"
      bg={selected ? 'bg.subtle' : 'transparent'}
      color="fg"
      textDecoration="none"
      cursor="pointer"
      css={{ '&:focus-visible': { outlineOffset: '-2px' } }}
    >
      <Box
        as="span"
        aria-hidden="true"
        flex="0 0 36px"
        height="36px"
        borderRadius="10px"
        bg={selected ? 'bg' : 'bg.subtle'}
        display="inline-flex"
        alignItems="center"
        justifyContent="center"
        fontSize="md"
        color="fg.muted"
      >
        {marks[result.collectionId ?? ''] ?? '¶'}
      </Box>
      <Box as="span" flex="1" minWidth="0">
        <Box
          as="span"
          display="block"
          fontSize="md"
          fontWeight="medium"
          lineHeight="snug"
          overflow="hidden"
          textOverflow="ellipsis"
          whiteSpace="nowrap"
        >
          <Highlighted text={resultTitle(result)} query={query} />
          {upcoming ? (
            <Box as="span" color="fg.muted" fontWeight="regular">
              {' · In development'}
            </Box>
          ) : null}
        </Box>
        {result.description ? (
          <Box
            as="span"
            display="block"
            marginTop="2px"
            fontSize="13.5px"
            lineHeight="1.45"
            color="fg.muted"
            overflow="hidden"
            textOverflow="ellipsis"
            whiteSpace="nowrap"
          >
            <Highlighted text={result.description} query={query} />
          </Box>
        ) : null}
      </Box>
      {selected ? (
        <Kbd display={{ base: 'none', md: 'inline-flex' }} aria-hidden="true">
          ↵
        </Kbd>
      ) : null}
    </chakra.a>
  );
}

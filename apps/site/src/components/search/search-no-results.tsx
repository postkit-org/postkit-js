import { Box, chakra } from '@chakra-ui/react';
import type { SiteSearchSuggestion } from '@postkit/site-search/client';
import type { MouseEvent } from 'react';

const REQUEST_URL = 'https://github.com/postkit-org/postkit-js/issues/new';

export interface NoResultsProps {
  readonly query: string;
  readonly suggestions: readonly SiteSearchSuggestion[];
  readonly onNavigate: (route: string) => void;
}

/** SiteSearchEmpty: the message, the three closest titles and "Request it on GitHub". */
export function NoResults({ query, suggestions, onNavigate }: NoResultsProps) {
  const onClick = (event: MouseEvent<HTMLAnchorElement>, route: string) => {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }
    event.preventDefault();
    onNavigate(route);
  };

  return (
    <Box
      paddingTop="40px"
      paddingBottom="36px"
      paddingInline={{ base: '24px', md: '32px' }}
      textAlign="center"
    >
      <chakra.p
        margin="0"
        fontSize="lg"
        fontWeight="medium"
        overflowWrap="anywhere"
      >
        No results for &ldquo;{query}&rdquo;
      </chakra.p>
      <chakra.p
        marginTop="8px"
        marginInline="auto"
        maxWidth="34em"
        fontSize="md"
        lineHeight="body"
        color="fg.muted"
      >
        {suggestions.length > 0
          ? 'Check the spelling, or try a broader word. These might be close:'
          : 'Check the spelling, or try a broader word.'}
      </chakra.p>
      {suggestions.length > 0 ? (
        <chakra.ul
          listStyleType="none"
          margin="0"
          marginTop="20px"
          padding="0"
          display="flex"
          flexWrap="wrap"
          justifyContent="center"
          gap="8px"
          aria-label="Suggestions"
        >
          {suggestions.map((suggestion) => (
            <li key={suggestion.route}>
              <chakra.a
                href={suggestion.route}
                onClick={(event) => onClick(event, suggestion.route)}
                display="inline-flex"
                alignItems="center"
                minHeight="36px"
                paddingBlock="7px"
                paddingInline="14px"
                borderRadius="full"
                bg="bg.subtle"
                color="fg"
                textDecoration="none"
                fontSize="14px"
                transitionProperty="background-color"
                transitionDuration="120ms"
                _hover={{ bg: 'bg.hover' }}
              >
                {suggestion.title}
              </chakra.a>
            </li>
          ))}
        </chakra.ul>
      ) : null}
      <chakra.p
        marginTop="28px"
        paddingTop="20px"
        borderTopWidth="1px"
        borderColor="border"
        fontSize="md"
        color="fg.secondary"
      >
        Missing a component?{' '}
        <chakra.a
          href={REQUEST_URL}
          color="accent"
          textDecoration="underline"
          textDecorationThickness="1px"
          textUnderlineOffset="3px"
        >
          Request it on GitHub
        </chakra.a>
      </chakra.p>
    </Box>
  );
}

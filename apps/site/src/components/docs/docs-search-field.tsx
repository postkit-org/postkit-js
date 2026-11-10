import { chakra } from '@chakra-ui/react';

import { useSearch } from '../../lib/search';

/**
 * "Search docs" at the top of the docs nav (01 §6.5). It looks like a field but is a button:
 * it opens the site's one search dialog filtered to Docs (`openSearch({ scope: 'docs' })`),
 * so there is no second search. chakra-docs' layout takes it as `sidebarContent`.
 */
export function DocsSearchField() {
  const { openSearch } = useSearch();

  return (
    <chakra.button
      type="button"
      aria-haspopup="dialog"
      onClick={() => openSearch({ scope: 'docs' })}
      display="flex"
      alignItems="center"
      width="100%"
      minHeight="40px"
      marginBottom="24px"
      paddingInline="14px"
      border="0"
      borderRadius="full"
      background="bg.subtle"
      color="fg.muted"
      font="inherit"
      fontSize="14px"
      textAlign="start"
      cursor="pointer"
      transitionProperty="background-color, color"
      transitionDuration="hover"
      transitionTimingFunction="ease-out"
      _hover={{ background: 'bg.hover', color: 'fg' }}
    >
      Search docs
    </chakra.button>
  );
}

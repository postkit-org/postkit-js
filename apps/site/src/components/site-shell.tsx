import { Box, Flex } from '@chakra-ui/react';
import type { ReactNode } from 'react';

import { CommuneBand } from './commune-band';
import { Footer } from './footer';
import { Header } from './header';
import { useSearch } from '../lib/search';

export interface SiteShellProps {
  readonly children: ReactNode;
}

export function SiteShell({ children }: SiteShellProps) {
  const { openSearch } = useSearch();

  return (
    <Flex minH="100vh" direction="column">
      <Header onOpenSearch={() => openSearch()} />

      <Box
        as="main"
        id="main"
        tabIndex={-1}
        flex="1"
        css={{ '&:focus': { outline: 'none' } }}
      >
        {children}
      </Box>

      <Footer />
      <CommuneBand />
    </Flex>
  );
}

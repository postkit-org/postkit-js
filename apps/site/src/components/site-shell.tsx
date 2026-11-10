import { Box, Container, Flex, Text } from '@chakra-ui/react';
import type { ReactNode } from 'react';

import { Header } from './header';

export interface SiteShellProps {
  readonly children: ReactNode;
}

export function SiteShell({ children }: SiteShellProps) {
  return (
    <Flex minH="100vh" direction="column">
      <Header />

      <Box
        as="main"
        id="main"
        tabIndex={-1}
        flex="1"
        css={{ '&:focus': { outline: 'none' } }}
      >
        {children}
      </Box>

      <Box
        as="footer"
        borderTopColor="border"
        borderTopWidth="1px"
        paddingBlock="8"
      >
        <Container maxW="7xl">
          <Flex
            align={{ base: 'flex-start', md: 'center' }}
            direction={{ base: 'column', md: 'row' }}
            gap="3"
            justify="space-between"
          >
            <Text color="fg.muted" fontSize="sm">
              Portable publishing components for the open web.
            </Text>
            <Text color="fg.muted" fontFamily="mono" fontSize="xs">
              MIT licensed · Built with Postkit
            </Text>
          </Flex>
        </Container>
      </Box>
    </Flex>
  );
}

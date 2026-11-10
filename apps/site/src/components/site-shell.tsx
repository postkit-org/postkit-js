import { Box, Container, Flex, Link as ChakraLink } from '@chakra-ui/react';
import NextLink from 'next/link';
import type { ReactNode } from 'react';

import { CommuneBand } from './commune-band';
import { Footer } from './footer';

export interface SiteShellProps {
  readonly children: ReactNode;
}

const navigation = [
  { href: '/', label: 'Home' },
  { href: '/docs', label: 'Docs' },
  { href: '/components', label: 'Components' },
  { href: '/changelog', label: 'Changelog' },
] as const;

export function SiteShell({ children }: SiteShellProps) {
  return (
    <Flex minH="100vh" direction="column">
      <Box
        as="header"
        bg="bg.glass"
        borderBottomColor="border.header"
        borderBottomWidth="1px"
        position="sticky"
        top="0"
        zIndex="sticky"
        css={{ backdropFilter: 'saturate(180%) blur(20px)' }}
      >
        <Container maxW="7xl">
          <Flex align="center" height="16" justify="space-between" gap="6">
            <ChakraLink
              asChild
              color="fg"
              fontFamily="heading"
              fontSize="xl"
              fontWeight="600"
              letterSpacing="-0.035em"
              textDecoration="none"
            >
              <NextLink href="/">
                Postkit
                <Box as="span" color="accent">
                  .
                </Box>
              </NextLink>
            </ChakraLink>

            <Flex align="center" gap={{ base: '3', md: '7' }}>
              <Box as="nav" aria-label="Primary">
                <Flex gap={{ base: '3', md: '6' }}>
                  {navigation.map((item) => (
                    <ChakraLink
                      asChild
                      color="fg.secondary"
                      display={{
                        base: item.href === '/' ? 'none' : 'inline-flex',
                        sm: 'inline-flex',
                      }}
                      fontSize="sm"
                      fontWeight="600"
                      key={item.href}
                      textDecoration="none"
                      _hover={{ color: 'fg' }}
                    >
                      <NextLink href={item.href}>{item.label}</NextLink>
                    </ChakraLink>
                  ))}
                </Flex>
              </Box>

              <ChakraLink
                display={{ base: 'none', sm: 'inline-flex' }}
                fontFamily="mono"
                fontSize="xs"
                fontWeight="700"
                href="https://github.com/postkit-org/postkit-js"
                rel="noreferrer"
                target="_blank"
                textDecoration="none"
              >
                GitHub ↗
              </ChakraLink>
            </Flex>
          </Flex>
        </Container>
      </Box>

      <Box as="main" flex="1">
        {children}
      </Box>

      <Footer />
      <CommuneBand />
    </Flex>
  );
}

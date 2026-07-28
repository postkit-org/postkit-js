import {
  Box,
  Container,
  Flex,
  Link as ChakraLink,
  Text,
} from '@chakra-ui/react';
import NextLink from 'next/link';
import type { ReactNode } from 'react';

export interface SiteShellProps {
  readonly children: ReactNode;
}

const navigation = [
  { href: '/', label: 'Home' },
  { href: '/changelog', label: 'Changelog' },
] as const;

export function SiteShell({ children }: SiteShellProps) {
  return (
    <Flex minH="100vh" direction="column">
      <Box
        as="header"
        bg="rgba(244, 241, 232, 0.88)"
        borderBottomColor="blackAlpha.200"
        borderBottomWidth="1px"
        position="sticky"
        top="0"
        zIndex="sticky"
        css={{ backdropFilter: 'blur(18px)' }}
      >
        <Container maxW="7xl">
          <Flex align="center" height="16" justify="space-between" gap="6">
            <ChakraLink
              asChild
              color="postkitInk"
              fontFamily="heading"
              fontSize="xl"
              fontWeight="600"
              letterSpacing="-0.035em"
              textDecoration="none"
            >
              <NextLink href="/">
                PostKit
                <Box as="span" color="postkitAccent">
                  .
                </Box>
              </NextLink>
            </ChakraLink>

            <Flex align="center" gap={{ base: '4', md: '7' }}>
              <Box as="nav" aria-label="Primary">
                <Flex gap={{ base: '4', md: '6' }}>
                  {navigation.map((item) => (
                    <ChakraLink
                      asChild
                      color="blackAlpha.700"
                      fontSize="sm"
                      fontWeight="600"
                      key={item.href}
                      textDecoration="none"
                      _hover={{ color: 'postkitInk' }}
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
                href="https://github.com/org-postkit/postkit-js"
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

      <Box
        as="footer"
        borderTopColor="blackAlpha.200"
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
            <Text color="blackAlpha.600" fontSize="sm">
              Portable publishing components for the open web.
            </Text>
            <Text color="blackAlpha.600" fontFamily="mono" fontSize="xs">
              MIT licensed · Built with PostKit
            </Text>
          </Flex>
        </Container>
      </Box>
    </Flex>
  );
}

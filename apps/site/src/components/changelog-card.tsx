import {
  Badge,
  Box,
  Flex,
  Heading,
  Link as ChakraLink,
  Text,
} from '@chakra-ui/react';
import NextLink from 'next/link';

import {
  formatChangelogDate,
  type ChangelogEntrySummary,
} from '../lib/changelog';

export interface ChangelogCardProps {
  readonly entry: ChangelogEntrySummary;
  readonly featured?: boolean;
}

export function ChangelogCard({ entry, featured = false }: ChangelogCardProps) {
  return (
    <Box
      as="article"
      bg={featured ? 'postkitInk' : 'whiteAlpha.700'}
      borderColor={featured ? 'postkitInk' : 'blackAlpha.200'}
      borderRadius="2xl"
      borderWidth="1px"
      color={featured ? 'white' : 'postkitInk'}
      padding={{ base: '6', md: featured ? '9' : '7' }}
    >
      <Flex
        align={{ base: 'flex-start', md: 'center' }}
        direction={{ base: 'column', md: 'row' }}
        gap="3"
        justify="space-between"
      >
        <Flex align="center" gap="3" flexWrap="wrap">
          <Badge colorPalette={featured ? 'green' : 'gray'} variant="subtle">
            {entry.version}
          </Badge>
          <Text
            color={featured ? 'whiteAlpha.700' : 'blackAlpha.600'}
            fontFamily="mono"
            fontSize="xs"
          >
            {formatChangelogDate(entry.date)}
          </Text>
        </Flex>
        <Flex gap="2" flexWrap="wrap">
          {entry.tags.map((tag) => (
            <Text
              color={featured ? 'whiteAlpha.600' : 'blackAlpha.500'}
              fontFamily="mono"
              fontSize="xs"
              key={tag}
            >
              #{tag}
            </Text>
          ))}
        </Flex>
      </Flex>

      <Heading
        as="h2"
        fontFamily="heading"
        fontSize={{ base: '2xl', md: featured ? '4xl' : '3xl' }}
        fontWeight="500"
        marginTop="5"
      >
        {entry.title}
      </Heading>
      <Text
        color={featured ? 'whiteAlpha.800' : 'blackAlpha.700'}
        lineHeight="1.7"
        marginTop="3"
        maxW="3xl"
      >
        {entry.summary}
      </Text>
      <ChakraLink
        asChild
        color={featured ? 'green.200' : 'green.700'}
        display="inline-flex"
        fontWeight="700"
        marginTop="6"
        textDecoration="none"
      >
        <NextLink href={`/changelog/${entry.slug}`}>
          Read release notes →
        </NextLink>
      </ChakraLink>
    </Box>
  );
}

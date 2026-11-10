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
  changelogHref,
  formatChangelogRelease,
  type ChangelogEntrySummary,
} from '../lib/changelog';
import { asStatement } from './changelog/release-row';
import { ReleaseStatusBadge } from './changelog/release-status-badge';

export interface ChangelogCardProps {
  readonly entry: ChangelogEntrySummary;
  readonly featured?: boolean;
  /** Marks the newest released entry. Upcoming entries are marked "In development" instead. */
  readonly latest?: boolean;
}

export function ChangelogCard({
  entry,
  featured = false,
  latest = false,
}: ChangelogCardProps) {
  return (
    <Box
      as="article"
      bg={featured ? 'bg.inverted' : 'bg.subtle'}
      borderColor={featured ? 'fg' : 'border'}
      borderRadius="2xl"
      borderWidth="1px"
      color={featured ? 'fg.inverted' : 'fg'}
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
            color={featured ? 'fg.inverted' : 'fg.muted'}
            fontFamily="mono"
            fontSize="xs"
          >
            {formatChangelogRelease(entry)}
          </Text>
          <ReleaseStatusBadge status={entry.status} latest={latest} />
        </Flex>
        <Flex gap="2" flexWrap="wrap">
          {entry.tags.map((tag) => (
            <Text
              color={featured ? 'fg.inverted' : 'fg.quiet'}
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
        {asStatement(entry.title)}{' '}
        <Text as="span" color={featured ? 'fg.inverted' : 'fg.muted'}>
          {entry.subtitle}
        </Text>
      </Heading>
      <Text
        color={featured ? 'fg.inverted' : 'fg.secondary'}
        lineHeight="1.7"
        marginTop="3"
        maxW="3xl"
      >
        {entry.summary}
      </Text>
      <ChakraLink
        asChild
        color={featured ? 'fg.inverted' : 'accent'}
        display="inline-flex"
        fontWeight="700"
        marginTop="6"
        textDecoration="none"
      >
        <NextLink href={changelogHref(entry)}>Read release notes →</NextLink>
      </ChakraLink>
    </Box>
  );
}

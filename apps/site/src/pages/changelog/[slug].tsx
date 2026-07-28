import {
  Badge,
  Box,
  Container,
  Flex,
  Link as ChakraLink,
  Stack,
  Text,
} from '@chakra-ui/react';
import { createPostkitNextComponents } from '@postkit/next';
import type {
  GetStaticPaths,
  GetStaticProps,
  InferGetStaticPropsType,
} from 'next';
import Head from 'next/head';
import NextLink from 'next/link';
import { MDXRemote } from 'next-mdx-remote';

import { formatChangelogDate, type ChangelogEntry } from '../../lib/changelog';
import {
  getChangelogEntries,
  getChangelogEntry,
} from '../../lib/changelog.server';

const postkitComponents = createPostkitNextComponents({
  link: {
    linkProps: { prefetch: false },
  },
});

interface ChangelogEntryPageProps {
  readonly entry: ChangelogEntry;
}

interface ChangelogEntryParams extends Record<string, string> {
  readonly slug: string;
}

export const getStaticPaths: GetStaticPaths<
  ChangelogEntryParams
> = async () => ({
  fallback: false,
  paths: getChangelogEntries().map((entry) => ({
    params: { slug: entry.slug },
  })),
});

export const getStaticProps: GetStaticProps<
  ChangelogEntryPageProps,
  ChangelogEntryParams
> = async ({ params }) => ({
  props: {
    entry: await getChangelogEntry(params?.slug ?? ''),
  },
});

export default function ChangelogEntryPage({
  entry,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  return (
    <>
      <Head>
        <title>{entry.title} · PostKit changelog</title>
        <meta name="description" content={entry.summary} />
      </Head>

      <Container maxW="4xl" paddingBlock={{ base: '12', md: '20' }}>
        <Stack gap="8">
          <ChakraLink
            alignSelf="flex-start"
            asChild
            color="green.700"
            fontSize="sm"
            fontWeight="700"
            textDecoration="none"
          >
            <NextLink href="/changelog">← All releases</NextLink>
          </ChakraLink>

          <Box>
            <Flex align="center" gap="3" flexWrap="wrap">
              <Badge colorPalette="green" variant="subtle">
                {entry.version}
              </Badge>
              <Text color="blackAlpha.600" fontFamily="mono" fontSize="xs">
                {formatChangelogDate(entry.date)}
              </Text>
            </Flex>
          </Box>

          <MDXRemote {...entry.source} components={postkitComponents} />
        </Stack>
      </Container>
    </>
  );
}

import {
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

import type { DocsEntry, DocsEntrySummary } from '../../lib/docs';
import {
  getDocsEntries,
  getDocsEntry,
  getDocsNavigation,
} from '../../lib/docs.server';

const postkitComponents = createPostkitNextComponents({
  link: {
    linkProps: { prefetch: false },
  },
});

interface DocsEntryPageProps {
  readonly entry: DocsEntry;
  readonly previous: DocsEntrySummary | null;
  readonly next: DocsEntrySummary | null;
}

interface DocsEntryParams extends Record<string, string> {
  readonly slug: string;
}

export const getStaticPaths: GetStaticPaths<DocsEntryParams> = async () => {
  // Reports unresolved nav items as a build warning (PK-035 renders the nav).
  getDocsNavigation();

  return {
    fallback: false,
    paths: getDocsEntries().map((entry) => ({
      params: { slug: entry.slug },
    })),
  };
};

export const getStaticProps: GetStaticProps<
  DocsEntryPageProps,
  DocsEntryParams
> = async ({ params }) => {
  const entries = getDocsEntries();
  const slug = params?.slug ?? '';
  const index = entries.findIndex((entry) => entry.slug === slug);
  if (index < 0) {
    return { notFound: true };
  }

  return {
    props: {
      entry: await getDocsEntry(slug),
      previous: entries[index - 1] ?? null,
      next: entries[index + 1] ?? null,
    },
  };
};

export default function DocsEntryPage({
  entry,
  previous,
  next,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  return (
    <>
      <Head>
        <title>{entry.title} · Postkit documentation</title>
        <meta name="description" content={entry.summary} />
      </Head>

      <Container maxW="4xl" paddingBlock={{ base: '12', md: '20' }}>
        <Stack gap="8">
          <Flex align="baseline" gap="3" wrap="wrap">
            <Text
              color="accent"
              fontFamily="mono"
              fontSize="xs"
              fontWeight="700"
              letterSpacing="0.1em"
              textTransform="uppercase"
            >
              {entry.category}
            </Text>
            {entry.since ? (
              <Text color="fg.secondary" fontFamily="mono" fontSize="xs">
                Since {entry.since}
              </Text>
            ) : null}
            {entry.status === 'draft' ? (
              <Text color="fg.secondary" fontFamily="mono" fontSize="xs">
                Draft
              </Text>
            ) : null}
          </Flex>

          <MDXRemote {...entry.source} components={postkitComponents} />

          <Flex
            borderTopColor="border"
            borderTopWidth="1px"
            gap="6"
            justify="space-between"
            paddingTop="8"
          >
            <Box>
              {previous ? (
                <ChakraLink asChild color="accent" fontWeight="700">
                  <NextLink href={`/docs/${previous.slug}`}>
                    ← {previous.title}
                  </NextLink>
                </ChakraLink>
              ) : null}
            </Box>
            <Box textAlign="right">
              {next ? (
                <ChakraLink asChild color="accent" fontWeight="700">
                  <NextLink href={`/docs/${next.slug}`}>
                    {next.title} →
                  </NextLink>
                </ChakraLink>
              ) : null}
            </Box>
          </Flex>
        </Stack>
      </Container>
    </>
  );
}

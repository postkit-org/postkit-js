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

import {
  formatChangelogRelease,
  type ChangelogEntry,
} from '../../lib/changelog';
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

/** `0-2-0`: the slug comes from the entry's `version`, not its filename (01 §3). */
interface ChangelogEntryParams extends Record<string, string> {
  readonly version: string;
}

export const getStaticPaths: GetStaticPaths<
  ChangelogEntryParams
> = async () => ({
  fallback: false,
  paths: getChangelogEntries().map((entry) => ({
    params: { version: entry.slug },
  })),
});

export const getStaticProps: GetStaticProps<
  ChangelogEntryPageProps,
  ChangelogEntryParams
> = async ({ params }) => ({
  props: {
    entry: await getChangelogEntry(params?.version ?? ''),
  },
});

export default function ChangelogEntryPage({
  entry,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  return (
    <>
      <Head>
        <title>{`${entry.title} · Postkit changelog`}</title>
        <meta name="description" content={entry.summary} />
      </Head>

      <Container maxW="4xl" paddingBlock={{ base: '12', md: '20' }}>
        <Stack gap="8">
          <ChakraLink
            alignSelf="flex-start"
            asChild
            color="accent"
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
              <Text color="fg.muted" fontFamily="mono" fontSize="xs">
                {formatChangelogRelease(entry)}
              </Text>
              {entry.status === 'upcoming' ? (
                <Badge colorPalette="orange" variant="subtle">
                  In development
                </Badge>
              ) : null}
            </Flex>
            <Text color="fg.muted" fontSize="lg" marginTop="3">
              {entry.subtitle}
            </Text>
          </Box>

          <MDXRemote {...entry.source} components={postkitComponents} />
        </Stack>
      </Container>
    </>
  );
}

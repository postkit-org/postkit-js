import { Box, Container, Heading, Stack, Text } from '@chakra-ui/react';
import type { GetStaticProps, InferGetStaticPropsType } from 'next';
import Head from 'next/head';

import { ChangelogCard } from '../../components/changelog-card';
import type { ChangelogEntrySummary } from '../../lib/changelog';
import { getChangelogEntries } from '../../lib/changelog.server';

interface ChangelogPageProps {
  readonly entries: readonly ChangelogEntrySummary[];
}

export const getStaticProps: GetStaticProps<ChangelogPageProps> = async () => ({
  props: { entries: getChangelogEntries() },
});

export default function ChangelogPage({
  entries,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  return (
    <>
      <Head>
        <title>Changelog · PostKit</title>
        <meta
          name="description"
          content="Release notes and changes across the PostKit packages."
        />
      </Head>

      <Container maxW="5xl" paddingBlock={{ base: '16', md: '24' }}>
        <Box maxW="3xl">
          <Text
            color="green.700"
            fontFamily="mono"
            fontSize="sm"
            fontWeight="700"
            letterSpacing="0.12em"
            textTransform="uppercase"
          >
            Release notes
          </Text>
          <Heading
            as="h1"
            fontFamily="heading"
            fontSize={{ base: '5xl', md: '6xl' }}
            fontWeight="500"
            letterSpacing="-0.045em"
            marginTop="3"
          >
            Changelog
          </Heading>
          <Text
            color="blackAlpha.700"
            fontSize={{ base: 'lg', md: 'xl' }}
            lineHeight="1.7"
            marginTop="5"
          >
            New components, framework integrations, and improvements to the
            portable publishing contract.
          </Text>
        </Box>

        <Stack gap="6" marginTop={{ base: '12', md: '16' }}>
          {entries.map((entry) => (
            <ChangelogCard entry={entry} key={entry.slug} />
          ))}
        </Stack>
      </Container>
    </>
  );
}

import { Box, Container, Heading, Stack, Text } from '@chakra-ui/react';
import type { GetStaticProps, InferGetStaticPropsType } from 'next';
import { ChangelogCard } from '../../components/changelog-card';
import { BreadcrumbJsonLd, PageMeta } from '../../components/layout';
import type { ChangelogEntrySummary } from '../../lib/changelog';
import {
  getChangelogEntries,
  getLatestChangelogRelease,
} from '../../lib/changelog.server';

interface ChangelogPageProps {
  readonly entries: readonly ChangelogEntrySummary[];
  /** The newest released entry's slug; upcoming entries never take "Latest". */
  readonly latestSlug: string | null;
}

export const getStaticProps: GetStaticProps<ChangelogPageProps> = async () => ({
  props: {
    entries: getChangelogEntries(),
    latestSlug: getLatestChangelogRelease()?.slug ?? null,
  },
});

export default function ChangelogPage({
  entries,
  latestSlug,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  return (
    <>
      <PageMeta
        title="Changelog"
        description="Release notes and changes across the Postkit packages."
      />
      <BreadcrumbJsonLd items={[{ name: 'Changelog', path: '/changelog' }]} />

      <Container maxW="5xl" paddingBlock={{ base: '16', md: '24' }}>
        <Box maxW="3xl">
          <Text
            color="accent"
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
            color="fg.secondary"
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
            <ChangelogCard
              entry={entry}
              key={entry.slug}
              latest={entry.slug === latestSlug}
            />
          ))}
        </Stack>
      </Container>
    </>
  );
}

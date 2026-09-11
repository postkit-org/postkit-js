import {
  Box,
  Container,
  Heading,
  LinkBox,
  LinkOverlay,
  SimpleGrid,
  Stack,
  Text,
} from '@chakra-ui/react';
import type { GetStaticProps, InferGetStaticPropsType } from 'next';
import Head from 'next/head';
import NextLink from 'next/link';

import type { DocsEntrySummary } from '../../lib/docs';
import { getDocsEntries } from '../../lib/docs.server';

interface DocsPageProps {
  readonly entries: readonly DocsEntrySummary[];
}

export const getStaticProps: GetStaticProps<DocsPageProps> = async () => ({
  props: { entries: getDocsEntries() },
});

export default function DocsPage({
  entries,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  const categories = [...new Set(entries.map((entry) => entry.category))];

  return (
    <>
      <Head>
        <title>Documentation · PostKit</title>
        <meta
          name="description"
          content="Learn how to use PostKit components, Markdown tooling, framework adapters, and metadata resolvers."
        />
      </Head>

      <Container maxW="6xl" paddingBlock={{ base: '16', md: '24' }}>
        <Box maxW="3xl">
          <Text
            color="green.700"
            fontFamily="mono"
            fontSize="sm"
            fontWeight="700"
            letterSpacing="0.12em"
            textTransform="uppercase"
          >
            Guides and reference
          </Text>
          <Heading
            as="h1"
            fontFamily="heading"
            fontSize={{ base: '5xl', md: '6xl' }}
            fontWeight="500"
            letterSpacing="-0.045em"
            marginTop="3"
          >
            Documentation
          </Heading>
          <Text
            color="blackAlpha.700"
            fontSize={{ base: 'lg', md: 'xl' }}
            lineHeight="1.7"
            marginTop="5"
          >
            Start with a working render, then explore the portable content
            contract, framework integrations, styling, and metadata pipeline.
          </Text>
        </Box>

        <Stack
          gap={{ base: '12', md: '16' }}
          marginTop={{ base: '12', md: '16' }}
        >
          {categories.map((category) => (
            <Box as="section" key={category}>
              <Heading
                as="h2"
                fontFamily="heading"
                fontSize="2xl"
                fontWeight="500"
                marginBottom="5"
              >
                {category}
              </Heading>
              <SimpleGrid columns={{ base: 1, md: 2 }} gap="5">
                {entries
                  .filter((entry) => entry.category === category)
                  .map((entry) => (
                    <LinkBox
                      as="article"
                      borderColor="blackAlpha.200"
                      borderRadius="xl"
                      borderWidth="1px"
                      key={entry.slug}
                      padding="6"
                      transition="border-color 160ms ease, transform 160ms ease"
                      _hover={{
                        borderColor: 'green.500',
                        transform: 'translateY(-2px)',
                      }}
                    >
                      <Heading
                        as="h3"
                        fontFamily="heading"
                        fontSize="xl"
                        fontWeight="600"
                      >
                        <LinkOverlay asChild>
                          <NextLink href={`/docs/${entry.slug}`}>
                            {entry.title}
                          </NextLink>
                        </LinkOverlay>
                      </Heading>
                      <Text
                        color="blackAlpha.700"
                        lineHeight="1.7"
                        marginTop="3"
                      >
                        {entry.summary}
                      </Text>
                    </LinkBox>
                  ))}
              </SimpleGrid>
            </Box>
          ))}
        </Stack>
      </Container>
    </>
  );
}

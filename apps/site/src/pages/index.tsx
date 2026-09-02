import {
  Badge,
  Box,
  Button,
  Container,
  Flex,
  Heading,
  SimpleGrid,
  Stack,
  Text,
} from '@chakra-ui/react';
import { Callout, CodeBlock } from '@postkit/react';
import type { GetStaticProps, InferGetStaticPropsType } from 'next';
import Head from 'next/head';
import NextLink from 'next/link';

import { ChangelogCard } from '../components/changelog-card';
import type { ChangelogEntrySummary } from '../lib/changelog';
import { getChangelogEntries } from '../lib/changelog.server';

interface HomePageProps {
  readonly latestEntry: ChangelogEntrySummary | null;
}

export const getStaticProps: GetStaticProps<HomePageProps> = async () => ({
  props: {
    latestEntry: getChangelogEntries()[0] ?? null,
  },
});

const capabilities = [
  {
    eyebrow: 'Author once',
    title: 'Portable content',
    copy: 'Keep Markdown and MDX independent from the framework that eventually publishes it.',
  },
  {
    eyebrow: 'Render anywhere',
    title: 'Framework adapters',
    copy: 'Use the same component contract in React, Next.js, React Router, TanStack Router, and Astro.',
  },
  {
    eyebrow: 'Own the system',
    title: 'Chakra foundations',
    copy: 'Compose PostKit with Chakra tokens and recipes instead of working around a sealed theme.',
  },
] as const;

export default function IndexPage({
  latestEntry,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  return (
    <>
      <Head>
        <title>PostKit — portable publishing components</title>
      </Head>

      <Box
        as="section"
        borderBottomWidth="1px"
        borderColor="blackAlpha.200"
        overflow="hidden"
        position="relative"
      >
        <Box
          aria-hidden="true"
          bg="postkitAccent"
          borderRadius="full"
          filter="blur(1px)"
          height={{ base: '18rem', md: '28rem' }}
          opacity="0.14"
          position="absolute"
          right={{ base: '-11rem', md: '-6rem' }}
          top={{ base: '-10rem', md: '-15rem' }}
          width={{ base: '18rem', md: '28rem' }}
        />
        <Container maxW="7xl" paddingBlock={{ base: '20', md: '32' }}>
          <SimpleGrid
            columns={{ base: 1, lg: 2 }}
            gap={{ base: '14', lg: '20' }}
          >
            <Stack gap="7" maxW="3xl">
              <Badge
                alignSelf="flex-start"
                colorPalette="green"
                paddingInline="3"
                paddingBlock="1"
                variant="subtle"
              >
                Publishing primitives for the open web
              </Badge>
              <Heading
                as="h1"
                fontFamily="heading"
                fontSize={{ base: '5xl', md: '7xl' }}
                fontWeight="500"
                letterSpacing="-0.055em"
                lineHeight="0.96"
              >
                Content components that travel well.
              </Heading>
              <Text
                color="blackAlpha.700"
                fontSize={{ base: 'lg', md: 'xl' }}
                lineHeight="1.7"
                maxW="2xl"
              >
                PostKit gives product teams a shared, typed vocabulary for rich
                publishing—without tying authored content to one renderer.
              </Text>
              <Flex gap="3" flexWrap="wrap">
                <Button asChild colorPalette="green" size="lg">
                  <NextLink href="/docs/getting-started">Get started</NextLink>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <NextLink href="/components">Explore components</NextLink>
                </Button>
              </Flex>
            </Stack>

            <Box alignSelf="center" minW="0">
              <CodeBlock
                code={`import {
  PostkitProvider,
  postkitDefaultTheme,
  Callout,
} from '@postkit/react';

<PostkitProvider preset={postkitDefaultTheme}>
  <Callout title="Portable by default">
    Keep the content. Change the renderer.
  </Callout>
</PostkitProvider>`}
                filename="article.tsx"
                language="tsx"
                lineNumbers={false}
                variant="subtle"
              />
            </Box>
          </SimpleGrid>
        </Container>
      </Box>

      <Container maxW="7xl" paddingBlock={{ base: '16', md: '24' }}>
        <Stack gap={{ base: '16', md: '24' }}>
          <SimpleGrid columns={{ base: 1, md: 3 }} gap="6">
            {capabilities.map((capability, index) => (
              <Box
                as="article"
                bg="whiteAlpha.700"
                borderColor="blackAlpha.200"
                borderRadius="2xl"
                borderWidth="1px"
                key={capability.title}
                padding={{ base: '6', md: '7' }}
              >
                <Text
                  color="green.700"
                  fontFamily="mono"
                  fontSize="xs"
                  fontWeight="700"
                  letterSpacing="0.12em"
                  textTransform="uppercase"
                >
                  0{index + 1} · {capability.eyebrow}
                </Text>
                <Heading
                  as="h2"
                  fontFamily="heading"
                  fontSize="2xl"
                  fontWeight="500"
                  marginTop="4"
                >
                  {capability.title}
                </Heading>
                <Text color="blackAlpha.700" lineHeight="1.7" marginTop="3">
                  {capability.copy}
                </Text>
              </Box>
            ))}
          </SimpleGrid>

          <Callout title="Documentation" tone="tip">
            Follow the guided setup, choose a framework adapter, or browse the
            component and Markdown concepts in the{' '}
            <NextLink href="/docs">PostKit documentation</NextLink>.
          </Callout>

          {latestEntry ? (
            <Stack gap="6">
              <Flex
                align={{ base: 'flex-start', md: 'end' }}
                justify="space-between"
                direction={{ base: 'column', md: 'row' }}
                gap="3"
              >
                <Box>
                  <Text
                    color="green.700"
                    fontFamily="mono"
                    fontSize="sm"
                    fontWeight="700"
                    letterSpacing="0.1em"
                    textTransform="uppercase"
                  >
                    Latest release
                  </Text>
                  <Heading
                    as="h2"
                    fontFamily="heading"
                    fontSize={{ base: '3xl', md: '4xl' }}
                    fontWeight="500"
                    marginTop="2"
                  >
                    Follow the work as it ships.
                  </Heading>
                </Box>
                <Button asChild variant="ghost">
                  <NextLink href="/changelog">View every release →</NextLink>
                </Button>
              </Flex>
              <ChangelogCard entry={latestEntry} featured />
            </Stack>
          ) : null}
        </Stack>
      </Container>
    </>
  );
}

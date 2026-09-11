import {
  Badge,
  Box,
  Container,
  Flex,
  Heading,
  LinkBox,
  LinkOverlay,
  SimpleGrid,
  Stack,
  Text,
} from '@chakra-ui/react';
import Head from 'next/head';
import NextLink from 'next/link';

import {
  componentCategoryGroups,
  componentEntries,
  componentNameToSlug,
} from '../../lib/components';

const stats = [
  { label: 'Components', value: componentEntries.length },
  { label: 'Categories', value: componentCategoryGroups.length },
  { label: 'Built-in variants', value: 3 },
] as const;

export default function ComponentsPage() {
  return (
    <>
      <Head>
        <title>Components · PostKit</title>
        <meta
          name="description"
          content="Explore live previews, variants, sizes, authoring syntax, and props for every PostKit publishing component."
        />
      </Head>

      <Box borderBottomColor="blackAlpha.200" borderBottomWidth="1px">
        <Container maxW="7xl" paddingBlock={{ base: '16', md: '24' }}>
          <SimpleGrid columns={{ base: 1, lg: 2 }} gap="12">
            <Box maxW="3xl">
              <Text
                color="green.700"
                fontFamily="mono"
                fontSize="sm"
                fontWeight="700"
                letterSpacing="0.12em"
                textTransform="uppercase"
              >
                Component library
              </Text>
              <Heading
                as="h1"
                fontFamily="heading"
                fontSize={{ base: '5xl', md: '6xl' }}
                fontWeight="500"
                letterSpacing="-0.045em"
                marginTop="3"
              >
                Publishing primitives, in the open.
              </Heading>
              <Text
                color="blackAlpha.700"
                fontSize={{ base: 'lg', md: 'xl' }}
                lineHeight="1.7"
                marginTop="5"
              >
                Browse every component in the portable content contract. Each
                reference includes live examples, visual variants, sizes,
                authoring syntax, and supported props.
              </Text>
            </Box>

            <SimpleGrid alignSelf="end" columns={3} gap="3">
              {stats.map((stat) => (
                <Box
                  borderColor="blackAlpha.200"
                  borderRadius="xl"
                  borderWidth="1px"
                  key={stat.label}
                  padding={{ base: '4', md: '5' }}
                >
                  <Text
                    fontFamily="heading"
                    fontSize={{ base: '2xl', md: '3xl' }}
                    fontWeight="500"
                  >
                    {stat.value}
                  </Text>
                  <Text
                    color="blackAlpha.600"
                    fontFamily="mono"
                    fontSize="xs"
                    marginTop="1"
                  >
                    {stat.label}
                  </Text>
                </Box>
              ))}
            </SimpleGrid>
          </SimpleGrid>
        </Container>
      </Box>

      <Container maxW="7xl" paddingBlock={{ base: '14', md: '20' }}>
        <Stack gap={{ base: '14', md: '18' }}>
          {componentCategoryGroups.map((group) => (
            <Box as="section" key={group.category}>
              <Flex
                align="baseline"
                borderBottomColor="blackAlpha.200"
                borderBottomWidth="1px"
                justify="space-between"
                marginBottom="6"
                paddingBottom="3"
              >
                <Heading
                  as="h2"
                  fontFamily="heading"
                  fontSize={{ base: '2xl', md: '3xl' }}
                  fontWeight="500"
                >
                  {group.category}
                </Heading>
                <Text color="blackAlpha.500" fontFamily="mono" fontSize="xs">
                  {group.components.length.toString().padStart(2, '0')}
                </Text>
              </Flex>

              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap="4">
                {group.components.map((component) => (
                  <LinkBox
                    as="article"
                    bg="whiteAlpha.500"
                    borderColor="blackAlpha.200"
                    borderRadius="xl"
                    borderWidth="1px"
                    key={component.name}
                    minH="11rem"
                    padding="6"
                    transition="border-color 160ms ease, transform 160ms ease, background 160ms ease"
                    _hover={{
                      bg: 'whiteAlpha.800',
                      borderColor: 'green.500',
                      transform: 'translateY(-2px)',
                    }}
                  >
                    <Flex align="start" justify="space-between" gap="3">
                      <Heading
                        as="h3"
                        fontFamily="heading"
                        fontSize="xl"
                        fontWeight="600"
                      >
                        <LinkOverlay asChild>
                          <NextLink
                            href={`/components/${componentNameToSlug(component.name)}`}
                          >
                            {component.name}
                          </NextLink>
                        </LinkOverlay>
                      </Heading>
                      <Badge variant="subtle">{component.runtime}</Badge>
                    </Flex>
                    <Text
                      color="blackAlpha.700"
                      fontSize="sm"
                      lineHeight="1.7"
                      marginTop="4"
                    >
                      {component.description}
                    </Text>
                    <Text
                      color="green.700"
                      fontFamily="mono"
                      fontSize="xs"
                      fontWeight="700"
                      marginTop="5"
                    >
                      Preview component →
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

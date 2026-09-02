import {
  Badge,
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Link as ChakraLink,
  SimpleGrid,
  Stack,
  Table,
  Text,
} from '@chakra-ui/react';
import { CodeBlock, type PostkitComponentName } from '@postkit/react';
import type {
  GetStaticPaths,
  GetStaticProps,
  InferGetStaticPropsType,
} from 'next';
import Head from 'next/head';
import NextLink from 'next/link';

import { ComponentPreview } from '../../components/component-preview';
import {
  componentEntries,
  componentNameToSlug,
  getComponentBySlug,
} from '../../lib/components';

interface ComponentPageProps {
  readonly name: PostkitComponentName;
}

const variants = ['outline', 'subtle', 'plain'] as const;
const sizes = ['sm', 'md', 'lg'] as const;

export const getStaticPaths: GetStaticPaths = async () => ({
  fallback: false,
  paths: componentEntries.map((component) => ({
    params: { slug: componentNameToSlug(component.name) },
  })),
});

export const getStaticProps: GetStaticProps<ComponentPageProps> = async ({
  params,
}) => {
  const component = getComponentBySlug(String(params?.slug ?? ''));

  if (!component) return { notFound: true };
  return { props: { name: component.name } };
};

function sectionHeading(eyebrow: string, title: string, description: string) {
  return (
    <Box maxW="3xl">
      <Text
        color="green.700"
        fontFamily="mono"
        fontSize="xs"
        fontWeight="700"
        letterSpacing="0.1em"
        textTransform="uppercase"
      >
        {eyebrow}
      </Text>
      <Heading
        as="h2"
        fontFamily="heading"
        fontSize={{ base: '3xl', md: '4xl' }}
        fontWeight="500"
        letterSpacing="-0.035em"
        marginTop="2"
      >
        {title}
      </Heading>
      <Text color="blackAlpha.700" lineHeight="1.7" marginTop="3">
        {description}
      </Text>
    </Box>
  );
}

export default function ComponentPage({
  name,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  const component = componentEntries.find((entry) => entry.name === name);

  if (!component) return null;

  const componentIndex = componentEntries.indexOf(component);
  const previous = componentEntries[componentIndex - 1];
  const next = componentEntries[componentIndex + 1];

  return (
    <>
      <Head>
        <title>{component.name} · Components · PostKit</title>
        <meta name="description" content={component.description} />
      </Head>

      <Container maxW="7xl" paddingBlock={{ base: '10', md: '16' }}>
        <ChakraLink
          asChild
          color="blackAlpha.600"
          fontFamily="mono"
          fontSize="xs"
          fontWeight="700"
          textDecoration="none"
          _hover={{ color: 'green.700' }}
        >
          <NextLink href="/components">← All components</NextLink>
        </ChakraLink>

        <SimpleGrid
          columns={{ base: 1, lg: 2 }}
          gap={{ base: '10', lg: '16' }}
          marginTop="8"
        >
          <Box>
            <Text
              color="green.700"
              fontFamily="mono"
              fontSize="sm"
              fontWeight="700"
              letterSpacing="0.12em"
              textTransform="uppercase"
            >
              {component.category}
            </Text>
            <Heading
              as="h1"
              fontFamily="heading"
              fontSize={{ base: '5xl', md: '6xl' }}
              fontWeight="500"
              letterSpacing="-0.045em"
              marginTop="3"
            >
              {component.name}
            </Heading>
            <Text
              color="blackAlpha.700"
              fontSize={{ base: 'lg', md: 'xl' }}
              lineHeight="1.7"
              marginTop="5"
            >
              {component.description}
            </Text>
            <Flex gap="2" marginTop="6" wrap="wrap">
              <Badge variant="subtle">{component.runtime}</Badge>
              <Badge colorPalette="green" variant="subtle">
                React: {component.support.react}
              </Badge>
              <Badge variant="outline">Astro: {component.support.astro}</Badge>
            </Flex>
          </Box>

          <Box
            bg="whiteAlpha.600"
            borderColor="blackAlpha.200"
            borderRadius="2xl"
            borderWidth="1px"
            minW="0"
            padding={{ base: '5', md: '8' }}
          >
            <Text
              color="blackAlpha.500"
              fontFamily="mono"
              fontSize="xs"
              fontWeight="700"
              marginBottom="6"
              textTransform="uppercase"
            >
              Live preview
            </Text>
            <ComponentPreview name={component.name} />
          </Box>
        </SimpleGrid>
      </Container>

      <Box borderBlockColor="blackAlpha.200" borderBlockWidth="1px">
        <Container maxW="7xl" paddingBlock={{ base: '14', md: '20' }}>
          {sectionHeading(
            'Presentation',
            'Variants',
            'Every component supports the same three visual treatments. Recipe overrides can reshape each one without changing authored content.',
          )}
          <SimpleGrid columns={{ base: 1, xl: 3 }} gap="5" marginTop="8">
            {variants.map((variant) => (
              <Box
                bg="whiteAlpha.400"
                borderColor="blackAlpha.200"
                borderRadius="xl"
                borderWidth="1px"
                key={variant}
                minW="0"
                padding="5"
              >
                <Text
                  color="blackAlpha.600"
                  fontFamily="mono"
                  fontSize="xs"
                  fontWeight="700"
                  marginBottom="5"
                >
                  variant=&quot;{variant}&quot;
                </Text>
                <ComponentPreview
                  key={`${component.name}-${variant}`}
                  name={component.name}
                  size="sm"
                  variant={variant}
                />
              </Box>
            ))}
          </SimpleGrid>
        </Container>
      </Box>

      <Container maxW="7xl" paddingBlock={{ base: '14', md: '20' }}>
        <Stack gap={{ base: '16', md: '20' }}>
          <Box as="section">
            {sectionHeading(
              'Density',
              'Sizes',
              'Use a shared size vocabulary to fit the component to its surrounding editorial surface.',
            )}
            <Stack gap="5" marginTop="8">
              {sizes.map((size) => (
                <Box
                  borderColor="blackAlpha.200"
                  borderRadius="xl"
                  borderWidth="1px"
                  key={size}
                  minW="0"
                  padding={{ base: '5', md: '7' }}
                >
                  <Text
                    color="blackAlpha.600"
                    fontFamily="mono"
                    fontSize="xs"
                    fontWeight="700"
                    marginBottom="5"
                  >
                    size=&quot;{size}&quot;
                  </Text>
                  <ComponentPreview
                    key={`${component.name}-${size}`}
                    name={component.name}
                    size={size}
                  />
                </Box>
              ))}
            </Stack>
          </Box>

          <Box as="section">
            {sectionHeading(
              'Authoring',
              'Use it in content',
              'PostKit supports the same semantic component through MDX and portable Markdown directives.',
            )}
            <SimpleGrid columns={{ base: 1, lg: 2 }} gap="5" marginTop="8">
              <CodeBlock
                code={component.example.jsx}
                filename={`${component.name}.mdx`}
                language="mdx"
                lineNumbers={false}
              />
              <CodeBlock
                code={component.example.directive}
                filename="article.md"
                language="markdown"
                lineNumbers={false}
              />
            </SimpleGrid>
          </Box>

          <Box as="section">
            {sectionHeading(
              'Reference',
              'Authoring props',
              'Direct component props take precedence over provider defaults. Presentation props flow through PostKit recipes and the host Chakra theme.',
            )}
            <Box
              borderColor="blackAlpha.200"
              borderRadius="xl"
              borderWidth="1px"
              marginTop="8"
              overflowX="auto"
            >
              <Table.Root size="md" variant="line">
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeader>Prop</Table.ColumnHeader>
                    <Table.ColumnHeader>Type</Table.ColumnHeader>
                    <Table.ColumnHeader>Required</Table.ColumnHeader>
                    <Table.ColumnHeader>Description</Table.ColumnHeader>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {Object.entries(component.props).map(([propName, prop]) => (
                    <Table.Row key={propName}>
                      <Table.Cell fontFamily="mono" fontWeight="700">
                        {propName}
                      </Table.Cell>
                      <Table.Cell fontFamily="mono" fontSize="sm">
                        {prop.kind === 'enum'
                          ? prop.values
                              ?.map((value) => `'${value}'`)
                              .join(' | ')
                          : prop.kind}
                      </Table.Cell>
                      <Table.Cell>{prop.required ? 'Yes' : 'No'}</Table.Cell>
                      <Table.Cell color="blackAlpha.700" minW="18rem">
                        {prop.description}
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            </Box>
          </Box>

          <Flex
            align={{ base: 'stretch', sm: 'center' }}
            borderTopColor="blackAlpha.200"
            borderTopWidth="1px"
            direction={{ base: 'column', sm: 'row' }}
            gap="3"
            justify="space-between"
            paddingTop="8"
          >
            {previous ? (
              <Button asChild justifyContent="flex-start" variant="ghost">
                <NextLink
                  href={`/components/${componentNameToSlug(previous.name)}`}
                >
                  ← {previous.name}
                </NextLink>
              </Button>
            ) : (
              <span />
            )}
            {next ? (
              <Button asChild justifyContent="flex-end" variant="ghost">
                <NextLink
                  href={`/components/${componentNameToSlug(next.name)}`}
                >
                  {next.name} →
                </NextLink>
              </Button>
            ) : null}
          </Flex>
        </Stack>
      </Container>
    </>
  );
}

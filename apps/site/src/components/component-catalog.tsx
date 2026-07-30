import {
  Badge,
  Box,
  Flex,
  Heading,
  SimpleGrid,
  Stack,
  Text,
} from '@chakra-ui/react';
import { PostkitCodeBlock, postkitComponentCatalog } from '@postkit/react';

export function ComponentCatalog() {
  return (
    <Stack gap="8" marginTop="8">
      {Object.values(postkitComponentCatalog.components).map((component) => (
        <Box
          as="article"
          borderColor="blackAlpha.200"
          borderRadius="xl"
          borderWidth="1px"
          id={component.directive}
          key={component.name}
          padding={{ base: '5', md: '7' }}
          scrollMarginTop="6rem"
        >
          <Flex align="start" gap="4" justify="space-between" wrap="wrap">
            <Box>
              <Text
                color="green.700"
                fontFamily="mono"
                fontSize="xs"
                fontWeight="700"
                textTransform="uppercase"
              >
                {component.category}
              </Text>
              <Heading
                as="h2"
                fontFamily="heading"
                fontSize="2xl"
                fontWeight="600"
                marginTop="1"
              >
                {component.name}
              </Heading>
            </Box>
            <Flex gap="2" wrap="wrap">
              <Badge variant="subtle">{component.runtime}</Badge>
              <Badge colorPalette="green" variant="subtle">
                Astro: {component.support.astro}
              </Badge>
            </Flex>
          </Flex>

          <Text color="blackAlpha.700" lineHeight="1.7" marginTop="4">
            {component.description}
          </Text>

          <SimpleGrid columns={{ base: 1, lg: 2 }} gap="5" marginTop="6">
            <PostkitCodeBlock
              code={component.example.jsx}
              filename={`${component.name}.mdx`}
              language="mdx"
              lineNumbers={false}
            />
            <PostkitCodeBlock
              code={component.example.directive}
              filename="article.md"
              language="markdown"
              lineNumbers={false}
            />
          </SimpleGrid>

          <Box marginTop="6">
            <Text fontSize="sm" fontWeight="700">
              Authoring props
            </Text>
            <Flex gap="2" marginTop="2" wrap="wrap">
              {Object.entries(component.props).map(([name, prop]) => (
                <Badge
                  colorPalette={prop.required ? 'green' : undefined}
                  key={name}
                  variant="outline"
                >
                  {name}: {prop.kind}
                  {prop.required ? ' · required' : ''}
                </Badge>
              ))}
            </Flex>
          </Box>
        </Box>
      ))}
    </Stack>
  );
}

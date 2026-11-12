import { Box, chakra, Flex, Text } from '@chakra-ui/react';
import {
  DocumentRenderer,
  type PostkitDocument,
} from '@postkit/chakra/document';

import { authoringSources } from './home-content';
import { DemoCard, DemoChip, DemoTile, HomeSection } from './home-section';

const SourceCode = chakra('pre', {
  base: {
    width: '100%',
    margin: '0',
    padding: '5',
    borderRadius: 'lg',
    bg: 'bg',
    color: 'fg',
    fontFamily: 'mono',
    fontSize: 'sm',
    lineHeight: '1.7',
    whiteSpace: 'pre-wrap',
    overflowWrap: 'anywhere',
  },
});

export interface WritersSectionProps {
  /** `authoringSources.mdx`, parsed at build time. */
  readonly document: PostkitDocument;
}

/**
 * "Writers keep their tools" (SiteHome): the MDX and Markdown sources side by side, then
 * the rendered result. The result is the MDX source itself, parsed into a portable
 * document at build time and drawn by `@postkit/chakra`'s `DocumentRenderer`.
 */
export function WritersSection({ document }: WritersSectionProps) {
  return (
    <HomeSection
      id="home-writers"
      title="Writers keep their tools."
      quiet="MDX or plain Markdown, the same components either way."
    >
      <Flex wrap="wrap" gap="4">
        <DemoTile label="post.mdx" flex="1 1 340px">
          <SourceCode>{authoringSources.mdx}</SourceCode>
        </DemoTile>
        <DemoTile label="post.md" flex="1 1 340px">
          <SourceCode>{authoringSources.markdown}</SourceCode>
        </DemoTile>
        <Box
          position="relative"
          flex="1 1 100%"
          minW="0"
          bg="bg.subtle"
          borderRadius="2xl"
          paddingTop="52px"
          paddingInline="5"
          paddingBottom="5"
        >
          <DemoChip position="absolute" top="3.5" left="3.5">
            Rendered
          </DemoChip>
          <DemoCard padding={{ base: '3', md: '4' }}>
            <DocumentRenderer document={document} wrapper={false} />
          </DemoCard>
          <Text
            margin="14px 0 0"
            paddingBlock="2.5"
            paddingInline="3.5"
            borderRadius="md"
            bg="bg"
            fontSize="sm"
          >
            Typos fail the build, not the reader, with the file and line to fix.
          </Text>
        </Box>
      </Flex>
    </HomeSection>
  );
}

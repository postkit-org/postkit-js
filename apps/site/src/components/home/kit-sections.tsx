import { Box, Flex, Grid, Stack } from '@chakra-ui/react';
import {
  CodeGroup,
  Diff,
  Figure,
  FileTree,
  Gallery,
  KeyTakeaway,
  LinkPreview,
  PullQuote,
  Steps,
} from '@postkit/chakra';

import { externalLinks } from '../../lib/site-sections';
import { DemoCard, DemoChip, DemoTile, HomeSection } from './home-section';

const createPostkitExample = `import { createPostkit } from '@postkit/react'
import { article, technical } from '@postkit/react/kits'

export const postkit = createPostkit({
  kits: [article, technical],
})`;

/** Kits on Home (SiteHome): three sections, each drawn with the kit's own components. */
export function KitSections() {
  return (
    <>
      <ArticleKitSection />
      <TechnicalKitSection />
      <MediaKitSection />
    </>
  );
}

function ArticleKitSection() {
  return (
    <HomeSection
      id="home-long-reads"
      title="Long reads that hold attention."
      quiet="Takeaways, steps and pull quotes, ready the day you install."
    >
      <Grid
        templateColumns="repeat(auto-fit, minmax(min(100%, 300px), 1fr))"
        gap="4"
      >
        <DemoTile label="KeyTakeaway">
          <KeyTakeaway
            title="What ships in 0.3"
            items={[
              'Definitions outside any framework',
              'Headless React views',
              'Chakra as its own package',
            ]}
          />
        </DemoTile>
        <DemoTile label="Steps">
          <DemoCard paddingInline="5" paddingBlock="1.5">
            <Steps
              variant="plain"
              size="sm"
              items={[
                { title: 'Install a renderer' },
                { title: 'Pick your kits' },
                { title: 'Write' },
              ]}
            />
          </DemoCard>
        </DemoTile>
        <DemoTile label="PullQuote">
          <DemoCard>
            <PullQuote
              variant="plain"
              size="sm"
              quote="The file stays plain text."
              attribution="Postkit design principles"
            />
          </DemoCard>
        </DemoTile>
      </Grid>
    </HomeSection>
  );
}

function TechnicalKitSection() {
  return (
    <HomeSection
      id="home-docs"
      title="Docs developers trust."
      quiet="Code, terminals, diffs and file trees, with copy and highlighting already done."
    >
      <Box
        position="relative"
        bg="bg.subtle"
        borderRadius="3xl"
        paddingBlock="clamp(56px, 7vw, 88px)"
        paddingInline="clamp(16px, 5vw, 64px)"
      >
        <DemoChip position="absolute" top="5" left="5">
          CodeGroup · Diff · FileTree
        </DemoChip>
        <Flex wrap="wrap" gap="6" align="center">
          <Box flex="2 1 420px" minW="0">
            <CodeGroup
              label="Set up Postkit"
              items={[
                {
                  label: 'postkit.ts',
                  code: createPostkitExample,
                  language: 'ts',
                },
                {
                  label: 'Install',
                  code: 'npm install @postkit/react',
                  language: 'shell',
                },
              ]}
            />
          </Box>
          <Stack flex="1 1 260px" minW="0" gap="4">
            <Diff
              title="theme.ts"
              diff={`- variant: 'outline'\n+ variant: 'subtle'`}
            />
            <DemoCard>
              <FileTree
                variant="plain"
                items={[
                  { path: 'content', type: 'folder' },
                  { path: 'content/notes', type: 'folder' },
                  { path: 'content/notes/one-article.mdx', type: 'file' },
                  { path: 'content/changelog', type: 'folder' },
                ]}
              />
            </DemoCard>
          </Stack>
        </Flex>
      </Box>
    </HomeSection>
  );
}

function MediaKitSection() {
  return (
    <HomeSection
      id="home-media"
      title="Media that works for every reader."
      quiet="Captions, alt text and numbering built in, not bolted on."
    >
      <Flex wrap="wrap" gap="4">
        <DemoTile
          label="Figure"
          flex="2 1 460px"
          paddingTop="16"
          paddingInline="clamp(16px, 4vw, 48px)"
          paddingBottom="12"
        >
          <DemoCard padding="3">
            <Figure
              src="/home/renderers.svg"
              alt="Four panels, each showing the callout “Keep the content” as one renderer draws it: headless with a hairline border, Chakra on a green tint with a tick, email as a table with a green bar, and the editor with the block selected."
              caption="The same three lines of Markdown, drawn by the headless, Chakra, email and editor renderers."
              aspectRatio="16 / 9"
              width={1200}
              height={675}
            />
          </DemoCard>
        </DemoTile>
        <Stack flex="1 1 300px" minW="0" gap="4">
          <DemoTile
            label="LinkPreview"
            flex="1"
            paddingTop="60px"
            paddingInline="6"
            paddingBottom="8"
          >
            <DemoCard>
              <LinkPreview
                variant="plain"
                size="sm"
                href={externalLinks.github}
                title="postkit-org/postkit-js"
                description="Portable web and email components, Markdown tooling and framework adapters."
                siteName="github.com"
                image="/home/repository.svg"
                imageAlt=""
              />
            </DemoCard>
          </DemoTile>
          <DemoTile
            label="Gallery"
            flex="1"
            paddingTop="60px"
            paddingInline="6"
            paddingBottom="8"
          >
            <DemoCard padding="2.5">
              <Gallery
                variant="plain"
                size="sm"
                columns={3}
                items={[
                  { src: '/home/site.svg', alt: 'The article on a website' },
                  {
                    src: '/home/newsletter.svg',
                    alt: 'The article in a newsletter',
                  },
                  { src: '/home/editor.svg', alt: 'The article in an editor' },
                ]}
              />
            </DemoCard>
          </DemoTile>
        </Stack>
      </Flex>
    </HomeSection>
  );
}

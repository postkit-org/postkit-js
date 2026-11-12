import { Box, Flex, Stack, Text } from '@chakra-ui/react';
import { Callout, KeyTakeaway, Terminal } from '@postkit/chakra';
import { gradients } from '@postkit/site-theme';
import NextLink from 'next/link';

import { PageContainer, TwoToneHeading } from '../layout';
import { Button } from '../primitives';
import { installCommand, rendererArticle } from './home-content';

/** The components the lede names before "and N more". */
const NAMED_IN_LEDE = 3;

export interface HeroProps {
  /** The release line, "0.3". */
  readonly release: string;
  /** The manifest's component count. */
  readonly componentCount: number;
}

/** Home's hero (SiteHome): release line, two-tone title, lede and the two calls to action. */
export function Hero({ release, componentCount }: HeroProps) {
  return (
    <PageContainer
      as="section"
      aria-labelledby="home-title"
      paddingTop={{ base: '16', md: '120px' }}
      textAlign="center"
    >
      <Text margin="0 0 18px" fontSize="md" color="fg.muted">
        Postkit {release} ·{' '}
        <NextLink href="/docs/chakra">
          <Text as="span" color="fg" _hover={{ color: 'fg' }}>
            Works with your design system ›
          </Text>
        </NextLink>
      </Text>
      <TwoToneHeading
        as="h1"
        id="home-title"
        textStyle="hero"
        title="Richer posts, written once."
        quiet="Right everywhere they’re read."
        maxW="22ch"
        marginInline="auto"
      />
      <Text
        margin="28px auto 0"
        maxW="34em"
        fontSize="lg"
        lineHeight="snug"
        color="fg.muted"
      >
        Give your writing callouts, code, figures and{' '}
        {componentCount - NAMED_IN_LEDE} more without building any of them. Each
        post looks right on your site, in your newsletter and in your editor,
        from one plain-text file.
      </Text>
      <Flex
        marginTop="9"
        wrap="wrap"
        justify="center"
        align="center"
        columnGap="7"
        rowGap="3"
      >
        <Button asChild variant="primary" size="lg">
          <NextLink href="/docs/quick-start">Get started</NextLink>
        </Button>
        <NextLink href="/components">
          <Text
            as="span"
            display="inline-flex"
            alignItems="center"
            minH="tap"
            fontSize="lg"
            color="fg"
          >
            Browse the {componentCount} components ›
          </Text>
        </NextLink>
      </Flex>
    </PageContainer>
  );
}

/**
 * The article under the hero: a short note drawn by `@postkit/chakra` (KeyTakeaway,
 * Callout, Terminal) on a `bg.subtle` panel. The board fills the panel with the cover
 * gradient; 02 §3 keeps the gradient off large fills, so it stays quiet here.
 */
export function HeroArticle() {
  const { lead, callout } = rendererArticle;

  return (
    <PageContainer
      as="section"
      aria-label="An article written with Postkit"
      paddingTop={{ base: '12', md: '20' }}
    >
      {/* The brand gradient's softer cover stops, as on note covers (02 §3, added Nov 11, 2026). */}
      <Flex
        justify="center"
        backgroundImage={gradients.cover}
        borderRadius="3xl"
        paddingBlock="clamp(24px, 6vw, 72px)"
        paddingInline={{ base: '3', sm: '6' }}
      >
        <Box
          as="article"
          width="100%"
          maxW="640px"
          minW="0"
          bg="bg"
          borderRadius="xl"
          padding="clamp(20px, 4vw, 48px)"
          boxShadow="segment"
        >
          <Text margin="0 0 8px" fontSize="sm" color="fg.muted">
            Notes · 6 min
          </Text>
          <Text
            margin="0 0 24px"
            fontSize="2xl"
            fontWeight="medium"
            lineHeight="1.18"
            letterSpacing="tight"
          >
            One article, four renderers
          </Text>
          <Stack gap="5">
            <KeyTakeaway title="In short">
              Your posts stay plain text. Change frameworks later without
              rewriting one.
            </KeyTakeaway>
            <Text margin="0" color="fg.secondary" lineHeight="1.6">
              {lead}
            </Text>
            <Callout tone={callout.tone} title={callout.title}>
              {callout.body}
            </Callout>
            <Terminal command={installCommand} />
          </Stack>
        </Box>
      </Flex>
    </PageContainer>
  );
}

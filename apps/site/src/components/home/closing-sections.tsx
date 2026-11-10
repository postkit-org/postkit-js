import { Box, chakra, Grid, Text } from '@chakra-ui/react';

import { PageContainer } from '../layout';
import { HomeSection } from './home-section';

const rungs = [
  {
    rungs: '1–3',
    title: 'Style',
    body: 'Match your brand with the CSS or theme you already have.',
  },
  {
    rungs: '4–5',
    title: 'Override',
    body: 'Set house defaults once, and every writer gets them.',
  },
  {
    rungs: '6–7',
    title: 'Replace',
    body: (
      <>
        Own any component outright with{' '}
        <chakra.code fontFamily="mono" fontSize="sm">
          postkit eject
        </chakra.code>
        .
      </>
    ),
  },
  {
    rungs: '8',
    title: 'Extend',
    body: 'Add your own and get Markdown support and validation for free.',
  },
] as const;

/** "Never boxed in." (SiteHome): the customisation ladder in four tiles. */
export function CustomizeSection() {
  return (
    <HomeSection
      id="home-customize"
      title="Never boxed in."
      quiet="Restyle a part, replace a view, or take the source into your repo. Your posts keep working at every step."
    >
      <Grid
        as="ol"
        margin="0"
        padding="0"
        listStyleType="none"
        templateColumns="repeat(auto-fit, minmax(min(100%, 240px), 1fr))"
        gap="4"
      >
        {rungs.map((rung) => (
          <Box
            as="li"
            key={rung.title}
            bg="bg.subtle"
            borderRadius="2xl"
            padding="7"
          >
            <Text margin="0 0 6px" fontSize="14px">
              <chakra.span srOnly>Rungs </chakra.span>
              {rung.rungs}
            </Text>
            <Text
              margin="0 0 6px"
              fontWeight="medium"
              fontSize="21px"
              letterSpacing="tight"
            >
              {rung.title}
            </Text>
            <Text margin="0" fontSize="md" color="fg.secondary">
              {rung.body}
            </Text>
          </Box>
        ))}
      </Grid>
    </HomeSection>
  );
}

export interface StatsSectionProps {
  readonly components: number;
  readonly kits: number;
  readonly renderers: number;
  readonly licence: string;
}

/**
 * "Postkit in numbers" (SiteHome). Every value is computed at build time (08 rule 7):
 * see `getHomeStats` in `home-data.server.tsx`.
 */
export function StatsSection({
  components,
  kits,
  renderers,
  licence,
}: StatsSectionProps) {
  const stats = [
    { value: components, label: 'components' },
    { value: kits, label: 'kits' },
    { value: renderers, label: 'renderers, web components next' },
    { value: licence, label: 'licence' },
  ];

  return (
    <PageContainer
      as="section"
      aria-label="Postkit in numbers"
      paddingTop={{ base: 'sectionPhone', md: 'section' }}
    >
      <Grid
        as="dl"
        margin="0"
        templateColumns={{
          base: 'repeat(2, minmax(0, 1fr))',
          md: 'repeat(4, minmax(0, 1fr))',
        }}
        columnGap="8"
        rowGap={{ base: '8', md: '8' }}
        alignItems="start"
      >
        {stats.map((stat) => (
          <Box key={stat.label} display="flex" flexDirection="column-reverse">
            <Text as="dt" fontSize="body" color="fg.quiet">
              {stat.label}
            </Text>
            <Text
              as="dd"
              margin="0"
              fontWeight="medium"
              fontSize={{ base: '4xl', md: '5xl' }}
              letterSpacing="display"
              lineHeight="1.05"
            >
              {stat.value}
            </Text>
          </Box>
        ))}
      </Grid>
    </PageContainer>
  );
}

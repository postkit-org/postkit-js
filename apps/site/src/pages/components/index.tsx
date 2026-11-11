import { chakra } from '@chakra-ui/react';
import type { GetStaticProps, InferGetStaticPropsType } from 'next';

import { ComponentCatalog } from '../../components/components/component-catalog';
import {
  BreadcrumbJsonLd,
  PageContainer,
  PageMeta,
  TwoToneHeading,
} from '../../components/layout';
import {
  componentPropDefaultsByName,
  type ComponentPropDefaults,
} from '../../lib/component-prop-defaults';
import { componentEntries, componentKits } from '../../lib/components';

interface ComponentsPageProps {
  /** Each component's manifest v2 defaults, for the tiles' default state. */
  readonly defaults: Readonly<Record<string, ComponentPropDefaults>>;
}

export const getStaticProps: GetStaticProps<
  ComponentsPageProps
> = async () => ({
  props: {
    defaults: componentPropDefaultsByName(
      componentEntries.map((component) => component.name),
    ),
  },
});

const lede =
  'Each one works in MDX and plain Markdown, takes on your site’s design, and holds up in email. Install only the kits you need.';

/** `/components` (01 §6.2; SiteComponents, PhoneComponents). Every count is the manifest's. */
export default function ComponentsPage({
  defaults,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  return (
    <>
      <PageMeta title="Components" description={lede} path="/components" />
      <BreadcrumbJsonLd items={[{ name: 'Components', path: '/components' }]} />

      <PageContainer
        paddingTop={{ base: '64px', md: '112px' }}
        paddingBottom={{ base: '64px', md: '120px' }}
      >
        <TwoToneHeading
          as="h1"
          textStyle="pageTitle"
          fontSize="clamp(40px, 6vw, 80px)"
          maxWidth="22ch"
          title="Components."
          quiet={`${componentEntries.length} building blocks your writers can use today.`}
        />
        <chakra.p
          margin="24px 0 0"
          maxWidth="36em"
          fontSize={{ base: '17px', md: '19px' }}
          lineHeight="1.55"
          color="fg.muted"
        >
          {lede}
        </chakra.p>

        <ComponentCatalog kits={componentKits} defaults={defaults} />
      </PageContainer>
    </>
  );
}

import { Box, chakra, Flex, Grid, Link as ChakraLink } from '@chakra-ui/react';
import {
  createPostkitRemarkPlugins,
  type PostkitComponentName,
} from '@postkit/chakra';
import * as postkitEmail from '@postkit/email';
import type { ComponentAnatomyLayer } from '@postkit/content';
import { allComponentPages } from 'content-collections';
import type {
  GetStaticPaths,
  GetStaticProps,
  InferGetStaticPropsType,
} from 'next';
import type { MDXRemoteSerializeResult } from 'next-mdx-remote';
import { serialize } from 'next-mdx-remote/serialize';
import NextLink from 'next/link';
import { useState } from 'react';
import { Schema } from 'react-structured';

import { AnatomyDiagram } from '../../components/anatomy-diagram';
import {
  ComponentPreview,
  componentPreviewSamples,
} from '../../components/component-preview';
import { ComponentBadges } from '../../components/components/component-badges';
import { ComponentTile } from '../../components/components/component-tile';
import { PageSection } from '../../components/components/page-section';
import { PreviewPanel } from '../../components/components/preview-controls';
import { PropsTable } from '../../components/components/props-table';
import { RenderersTable } from '../../components/components/renderers-table';
import { UsagePanel } from '../../components/components/usage-panel';
import {
  usageSource,
  type UsageSyntax,
} from '../../components/components/usage-source';
import {
  absoluteUrl,
  BreadcrumbJsonLd,
  MdxContent,
  PageContainer,
  PageMeta,
  Toc,
  TwoToneHeading,
  type TocHeading,
} from '../../components/layout';
import { componentPropDefault } from '../../lib/component-defaults';
import { getComponentPage } from '../../lib/component-pages';
import {
  componentNameToSlug,
  componentParts,
  getComponentByName,
  getComponentBySlug,
  getComponentKit,
  orderedComponentEntries,
  previewControls,
  rendererSupport,
  type RendererSupportRow,
} from '../../lib/components';
import { externalLinks } from '../../lib/site-sections';

/** A section written in the component's Markdown file: its grey line and the rest. */
interface BodySection {
  readonly quiet: string | null;
  readonly source: MDXRemoteSerializeResult | null;
}

interface ComponentPageProps {
  readonly name: PostkitComponentName;
  readonly tagline: string;
  readonly layers: readonly ComponentAnatomyLayer[] | null;
  readonly related: readonly PostkitComponentName[];
  readonly usage: BodySection | null;
  readonly theming: BodySection | null;
  readonly accessibility: BodySection | null;
  readonly renderers: readonly RendererSupportRow[];
  /** The content file's path under `libs/content/components`, for "Edit this page". */
  readonly contentFile: string | null;
}

interface ComponentPageParams extends Record<string, string> {
  readonly slug: string;
}

export const getStaticPaths: GetStaticPaths<
  ComponentPageParams
> = async () => ({
  fallback: false,
  paths: orderedComponentEntries.map((component) => ({
    params: { slug: componentNameToSlug(component.name) },
  })),
});

/**
 * The body's `## Heading` sections, keyed by lower-cased heading. Each section's first
 * paragraph is the heading's grey half (the boards' "Usage. Writers use it however they
 * already write."); the rest renders under the section's own content.
 */
function splitBody(
  body: string,
): Map<string, { quiet: string | null; rest: string }> {
  const sections = new Map<string, { quiet: string | null; rest: string }>();
  const parts = body.split(/^##[ \t]+(.+?)[ \t]*$/m);

  for (let index = 1; index < parts.length; index += 2) {
    const heading = parts[index].trim().toLowerCase();
    const content = (parts[index + 1] ?? '').trim();
    const [first = '', ...rest] = content.split(/\n\s*\n/);
    const isPlainParagraph =
      first !== '' && !/^([-*+>#|`]|\d+\.|<|:::)/.test(first);
    sections.set(heading, {
      quiet: isPlainParagraph ? first.replace(/\s+/g, ' ').trim() : null,
      rest: (isPlainParagraph ? rest.join('\n\n') : content).trim(),
    });
  }
  return sections;
}

async function bodySection(
  sections: Map<string, { quiet: string | null; rest: string }>,
  heading: string,
): Promise<BodySection | null> {
  const section = sections.get(heading);
  if (!section) return null;
  return {
    quiet: section.quiet,
    source: section.rest
      ? await serialize(section.rest, {
          mdxOptions: { remarkPlugins: createPostkitRemarkPlugins() },
        })
      : null,
  };
}

export const getStaticProps: GetStaticProps<
  ComponentPageProps,
  ComponentPageParams
> = async ({ params }) => {
  const slug = params?.slug ?? '';
  const component = getComponentBySlug(slug);
  const page = getComponentPage(slug);
  if (!component || !page) return { notFound: true };

  // A ratio such as "4.5:1" reads as a `:1` text directive under the directive parser and
  // renders as an empty block, so escape that colon (outside code spans).
  const body = page.body
    .split(/(`[^`\n]*`)/)
    .map((part, index) =>
      index % 2 ? part : part.replace(/(\d):(\d)/g, '$1\\:$2'),
    )
    .join('');
  const sections = splitBody(body);
  const kit = getComponentKit(component);
  // Related: the content file's list, else the component's kit-mates (up to three).
  const related = page.related.length
    ? page.related
    : kit.components
        .filter((entry) => entry.name !== component.name)
        .slice(0, 3)
        .map((entry) => entry.name);
  // 06 PK-032 stand-in for 03 step 9: email support is what `@postkit/email` exports.
  const emailComponentNames = Object.keys(postkitEmail);
  const contentFile =
    allComponentPages.find((entry) => entry.slug === slug)?._meta.filePath ??
    null;

  return {
    props: {
      name: component.name,
      tagline: page.tagline,
      layers: page.anatomy?.layers ?? null,
      related: related.filter(
        (name): name is PostkitComponentName => !!getComponentByName(name),
      ),
      usage: await bodySection(sections, 'usage'),
      theming: await bodySection(sections, 'theming'),
      accessibility: await bodySection(sections, 'accessibility'),
      renderers: rendererSupport(component, emailComponentNames),
      contentFile,
    },
  };
};

/** The board's list style for the Accessibility notes: hairline rows, no bullets. */
const ruledList = {
  '& ul': {
    margin: '24px 0 0',
    padding: 0,
    listStyleType: 'none',
  },
  '& ul > li': {
    margin: 0,
    paddingBlock: '12px',
    borderTopWidth: '1px',
    borderTopColor: 'border',
  },
  '& ul > li:last-child': {
    borderBottomWidth: '1px',
    borderBottomColor: 'border',
  },
} as const;

const textLink = {
  color: 'fg',
  textDecoration: 'none',
  _hover: { textDecoration: 'underline' },
} as const;

export default function ComponentPage({
  name,
  tagline,
  layers,
  related,
  usage,
  theming,
  accessibility,
  renderers,
  contentFile,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  const component = getComponentByName(name);
  const controls = component ? previewControls(component) : [];
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      controls.map(({ prop, values: options }) => {
        const sampled = component
          ? componentPreviewSamples[component.name].props[prop]
          : undefined;
        const fallback = component
          ? componentPropDefault(component.name, prop)
          : undefined;
        const value =
          typeof sampled === 'string'
            ? sampled
            : typeof fallback === 'string'
              ? fallback
              : options[0];
        return [prop, value];
      }),
    ),
  );
  const [syntax, setSyntax] = useState<UsageSyntax>('mdx');

  if (!component) return null;

  const slug = componentNameToSlug(component.name);
  const path = `/components/${slug}`;
  const kit = getComponentKit(component);
  const index = orderedComponentEntries.indexOf(component);
  const next = orderedComponentEntries[index + 1];
  // The source shows the controls' values that differ from the documented defaults.
  const sourceValues = Object.fromEntries(
    Object.entries(values).filter(
      ([prop, value]) => componentPropDefault(component.name, prop) !== value,
    ),
  );
  const source = usageSource(component, syntax, sourceValues);
  const relatedComponents = related.flatMap((relatedName) => {
    const entry = getComponentByName(relatedName);
    return entry ? [entry] : [];
  });

  const headings: TocHeading[] = [
    { id: 'preview', text: 'Preview' },
    { id: 'usage', text: 'Usage' },
    { id: 'props', text: 'Props' },
    { id: 'anatomy', text: 'Anatomy' },
    { id: 'renderers', text: 'Renderers' },
    ...(theming ? [{ id: 'theming', text: 'Theming' }] : []),
    ...(accessibility ? [{ id: 'accessibility', text: 'Accessibility' }] : []),
    ...(relatedComponents.length ? [{ id: 'related', text: 'Related' }] : []),
  ];

  return (
    <>
      <PageMeta
        title={component.name}
        description={`${component.name}: ${tagline}`}
        path={path}
      />
      <BreadcrumbJsonLd
        items={[
          { name: 'Components', path: '/components' },
          { name: component.name, path },
        ]}
      />
      <Schema
        id="component-jsonld"
        type="SoftwareSourceCode"
        data={{
          name: component.name,
          description: component.description,
          url: absoluteUrl(path),
          codeSampleType: 'code snippet',
          programmingLanguage: 'TypeScript',
          isPartOf: {
            '@type': 'SoftwareSourceCode',
            name: 'Postkit',
            codeRepository: externalLinks.github,
          },
        }}
      />

      <PageContainer
        paddingTop={{ base: '48px', md: '88px' }}
        paddingBottom={{ base: '64px', md: '120px' }}
      >
        <Grid
          templateColumns={{
            base: 'minmax(0, 1fr)',
            md: 'minmax(0, 1fr) 168px',
            lg: 'minmax(0, 800px) 200px',
          }}
          justifyContent="space-between"
          columnGap={{ md: '40px', lg: '64px' }}
          alignItems="start"
        >
          <Box minWidth="0">
            <chakra.nav
              aria-label="Breadcrumb"
              margin="0 0 18px"
              fontSize="15px"
            >
              <chakra.ol
                display="flex"
                flexWrap="wrap"
                margin="0"
                padding="0"
                listStyleType="none"
                color="fg.muted"
              >
                <li>
                  <ChakraLink asChild {...textLink}>
                    <NextLink href="/components">Components</NextLink>
                  </ChakraLink>
                </li>
                <li>
                  <chakra.span aria-hidden="true" paddingInline="0.3em">
                    /
                  </chakra.span>
                  <ChakraLink asChild {...textLink}>
                    <NextLink href={`/components#${kit.id}`}>
                      {kit.name}
                    </NextLink>
                  </ChakraLink>
                </li>
              </chakra.ol>
            </chakra.nav>

            <TwoToneHeading
              as="h1"
              textStyle="pageTitle"
              fontSize="clamp(44px, 5.6vw, 72px)"
              title={`${component.name}.`}
              quiet={tagline}
            />
            <ComponentBadges component={component} />

            <PreviewPanel
              component={component}
              controls={controls}
              values={values}
              onChange={(prop, value) =>
                setValues((current) => ({ ...current, [prop]: value }))
              }
            />

            <PageSection
              id="usage"
              title="Usage"
              quiet={usage?.quiet ?? undefined}
            >
              <UsagePanel
                syntax={syntax}
                onSyntaxChange={setSyntax}
                source={source}
              />
              {usage?.source ? (
                <Box marginTop="20px">
                  <MdxContent source={usage.source} />
                </Box>
              ) : null}
            </PageSection>

            <PageSection
              id="props"
              title="Props"
              quiet="Always in step with the code."
            >
              <PropsTable component={component} />
            </PageSection>

            <PageSection
              id="anatomy"
              title="Anatomy"
              quiet="Every part is yours to restyle."
            >
              <Box marginTop="28px">
                <AnatomyDiagram
                  componentName={component.name}
                  layers={layers ?? undefined}
                  parts={componentParts(component.name)}
                  preview={
                    layers?.length ? (
                      <ComponentPreview name={component.name} />
                    ) : undefined
                  }
                />
              </Box>
            </PageSection>

            <PageSection
              id="renderers"
              title="Renderers"
              quiet="One component, everywhere you publish."
            >
              <RenderersTable rows={renderers} />
            </PageSection>

            {theming ? (
              <PageSection
                id="theming"
                title="Theming"
                quiet={theming.quiet ?? undefined}
              >
                {theming.source ? (
                  <Box marginTop="24px">
                    <MdxContent source={theming.source} />
                  </Box>
                ) : null}
              </PageSection>
            ) : null}

            {accessibility ? (
              <PageSection
                id="accessibility"
                title="Accessibility"
                quiet={accessibility.quiet ?? undefined}
              >
                {accessibility.source ? (
                  <Box css={ruledList}>
                    <MdxContent source={accessibility.source} />
                  </Box>
                ) : null}
              </PageSection>
            ) : null}

            {relatedComponents.length ? (
              <PageSection id="related" title="Related">
                <Grid
                  as="ul"
                  margin="24px 0 0"
                  padding="0"
                  listStyleType="none"
                  templateColumns="repeat(auto-fit, minmax(200px, 1fr))"
                  gap="28px 20px"
                >
                  {relatedComponents.map((entry) => (
                    <chakra.li key={entry.name} minWidth="0">
                      <ComponentTile component={entry} />
                    </chakra.li>
                  ))}
                </Grid>
              </PageSection>
            ) : null}

            <Flex
              marginTop="72px"
              paddingTop="20px"
              borderTopWidth="1px"
              borderTopColor="border"
              wrap="wrap"
              justify="space-between"
              gap="16px"
              fontSize="15px"
            >
              {contentFile ? (
                <ChakraLink
                  href={`${externalLinks.github}/edit/main/libs/content/components/${contentFile}`}
                  color="fg.muted"
                  textDecoration="none"
                  _hover={{ color: 'fg', textDecoration: 'underline' }}
                >
                  Edit this page on GitHub
                </ChakraLink>
              ) : (
                <span />
              )}
              {next ? (
                <ChakraLink asChild {...textLink}>
                  <NextLink
                    href={`/components/${componentNameToSlug(next.name)}`}
                  >
                    Next · {next.name} ›
                  </NextLink>
                </ChakraLink>
              ) : null}
            </Flex>
          </Box>

          <Toc
            headings={headings}
            position="sticky"
            top="calc({sizes.header} + 32px)"
          />
        </Grid>
      </PageContainer>
    </>
  );
}

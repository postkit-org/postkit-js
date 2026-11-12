import { chakra, Flex, Link as ChakraLink } from '@chakra-ui/react';
import { DocsArticle, DocsLayout, DocsProvider } from '@chakra-docs/chakra';
import {
  createGetStaticPaths,
  createPagesRouterDocProps,
  serializeNextProps,
  type NextPagesRouterDocProps,
} from '@chakra-docs/next/pages';
import type {
  GetStaticPaths,
  GetStaticProps,
  InferGetStaticPropsType,
} from 'next';
import { Schema, type SchemaData } from 'react-structured';

import {
  DocsMenu,
  DocsPager,
  DocsSearchField,
  DocsSinceBadge,
  siteDocsConfig,
} from '../../components/docs';
import {
  absoluteUrl,
  BreadcrumbJsonLd,
  MdxContent,
  PageMeta,
  TwoToneHeading,
} from '../../components/layout';
import type { DocsEntry } from '../../lib/docs';
import {
  docsEditUrl,
  docsRoute,
  docsTitleQuiet,
  docsTitleStatement,
  findDocsNavGroup,
} from '../../lib/docs-layout';
import {
  getDocsEntry,
  getDocsModifiedDate,
  getDocsNavigation,
  getDocsPagesOptions,
} from '../../lib/docs.server';
import { docsShareImage, shareImageMeta } from '../../lib/share-images';

interface DocsEntryPageProps {
  /** chakra-docs' page props: the nav tree and this page (title, summary, `h2`s). */
  readonly docs: NextPagesRouterDocProps;
  /** The serialized body and the entry's frontmatter. */
  readonly entry: DocsEntry;
  /** The page's nav group and its first page, for the phone menu and breadcrumbs. */
  readonly group: { readonly title: string; readonly firstHref: string } | null;
  /** When the Markdown last changed (git), for `TechArticle.dateModified`. */
  readonly dateModified: string | null;
}

interface DocsEntryParams extends Record<string, string> {
  readonly slug: string;
}

export const getStaticPaths: GetStaticPaths<DocsEntryParams> = async () => {
  // Reports unresolved nav items as a build warning.
  getDocsNavigation();

  // chakra-docs' helper yields catch-all params (`['mdx']`); this route is one segment.
  const { paths, fallback } = createGetStaticPaths(getDocsPagesOptions())();
  return {
    fallback,
    paths: paths.map(({ params }) => ({
      params: { slug: params.slug.join('/') },
    })),
  };
};

export const getStaticProps: GetStaticProps<
  DocsEntryPageProps,
  DocsEntryParams
> = async ({ params }) => {
  const slug = params?.slug ?? '';
  const docs = createPagesRouterDocProps(
    getDocsPagesOptions(),
    docsRoute(slug),
  );
  if (!docs) {
    return { notFound: true };
  }

  return {
    props: {
      docs: serializeNextProps(docs),
      entry: await getDocsEntry(slug),
      group: findDocsNavGroup(docs.nav, docs.page.route),
      dateModified: getDocsModifiedDate(slug),
    },
  };
};

function techArticleData(
  entry: DocsEntry,
  dateModified: string | null,
): SchemaData<'TechArticle'> {
  return {
    headline: entry.title,
    description: entry.summary,
    url: absoluteUrl(docsRoute(entry.slug)),
    inLanguage: 'en',
    ...(entry.since ? { dependencies: `Postkit ${entry.since} or later` } : {}),
    ...(dateModified ? { dateModified } : {}),
  };
}

export default function DocsEntryPage({
  docs,
  entry,
  group,
  dateModified,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  const { nav, page } = docs;
  const path = page.route;

  return (
    <>
      <PageMeta
        title={entry.title}
        description={entry.summary}
        path={path}
        image={shareImageMeta(docsShareImage(entry))}
      />
      <Schema
        id="techarticle-jsonld"
        type="TechArticle"
        data={techArticleData(entry, dateModified)}
      />
      <BreadcrumbJsonLd
        items={[
          { name: 'Docs', path: '/docs/introduction' },
          ...(group ? [{ name: group.title, path: group.firstHref }] : []),
          { name: entry.title, path },
        ]}
      />

      <DocsProvider config={siteDocsConfig}>
        <DocsLayout
          nav={nav}
          page={page}
          headings={page.headings}
          sidebarContent={<DocsSearchField />}
          sidebarSlotProps={{ 'aria-label': 'Docs' }}
          tocSlotProps={{ as: 'nav', 'aria-label': 'On this page' }}
          mobileNavigation={false}
          mobileToc={false}
        >
          <DocsMenu nav={nav} page={page} group={group?.title ?? null} />

          {/* No `page` prop: the header is the two-tone title below, not chakra-docs' h1. */}
          <DocsArticle>
            <Flex align="center" gap="10px" wrap="wrap" marginBottom="16px">
              {group ? (
                <chakra.p margin="0" fontSize="15px" color="fg.muted">
                  {group.title}
                </chakra.p>
              ) : null}
              {entry.since ? <DocsSinceBadge since={entry.since} /> : null}
            </Flex>
            <TwoToneHeading
              as="h1"
              textStyle="pageTitle"
              fontSize="clamp(40px, 5vw, 64px)"
              title={docsTitleStatement(entry.title)}
              quiet={docsTitleQuiet(entry.slug, entry.summary)}
              marginBottom="24px"
            />

            <MdxContent source={entry.source} />

            <DocsPager nav={nav} page={page} />
            <chakra.p margin="24px 0 0" fontSize="15px">
              <ChakraLink
                href={docsEditUrl(entry.slug)}
                color="fg.muted"
                textDecoration="none"
                _hover={{ color: 'fg' }}
                _focusVisible={{
                  outline: '2px solid {colors.accent}',
                  outlineOffset: '2px',
                }}
              >
                Edit this page on GitHub
              </ChakraLink>
            </chakra.p>
          </DocsArticle>
        </DocsLayout>
      </DocsProvider>
    </>
  );
}

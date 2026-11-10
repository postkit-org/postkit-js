import { chakra } from '@chakra-ui/react';
import { allChangelogEntries } from 'content-collections';
import type {
  GetStaticPaths,
  GetStaticProps,
  InferGetStaticPropsType,
} from 'next';
import { Schema } from 'react-structured';

import { FollowReleases } from '../../components/changelog/follow-releases';
import { githubReleaseUrl } from '../../components/changelog/release-links';
import { ReleaseMeta } from '../../components/changelog/release-meta';
import { releasePackages } from '../../components/changelog/release-packages';
import { ReleasePager } from '../../components/changelog/release-pager';
import { asStatement } from '../../components/changelog/release-row';
import {
  absoluteUrl,
  BreadcrumbJsonLd,
  MdxContent,
  PageMeta,
  SITE_NAME,
  SITE_URL,
  TwoToneHeading,
} from '../../components/layout';
import { TextLink } from '../../components/legal/text-link';
import {
  changelogHref,
  type ChangelogEntry,
  type ChangelogEntrySummary,
} from '../../lib/changelog';
import {
  getChangelogEntries,
  getChangelogEntry,
  getLatestChangelogRelease,
} from '../../lib/changelog.server';
import { changelogShareImage, shareImageMeta } from '../../lib/share-images';

type PagerEntry = Pick<ChangelogEntrySummary, 'slug' | 'version' | 'subtitle'>;

interface ChangelogEntryPageProps {
  readonly entry: ChangelogEntry;
  readonly latest: boolean;
  /** `@postkit/*` packages the notes mention, in order. */
  readonly packages: readonly string[];
  readonly older: PagerEntry | null;
  readonly newer: PagerEntry | null;
}

/** `0-2-0`: the slug comes from the entry's `version`, not its filename (01 §3). */
interface ChangelogEntryParams extends Record<string, string> {
  readonly version: string;
}

export const getStaticPaths: GetStaticPaths<
  ChangelogEntryParams
> = async () => ({
  fallback: false,
  paths: getChangelogEntries().map((entry) => ({
    params: { version: entry.slug },
  })),
});

const pagerEntry = (
  entry: ChangelogEntrySummary | undefined,
): PagerEntry | null =>
  entry
    ? { slug: entry.slug, version: entry.version, subtitle: entry.subtitle }
    : null;

export const getStaticProps: GetStaticProps<
  ChangelogEntryPageProps,
  ChangelogEntryParams
> = async ({ params }) => {
  const slug = params?.version ?? '';
  const entry = await getChangelogEntry(slug);
  // Newest first, upcoming included: "Newer" from 0.2.0 is 0.3.0 while it's in development.
  const entries = getChangelogEntries();
  const index = entries.findIndex((candidate) => candidate.slug === slug);
  const markdown =
    allChangelogEntries.find((candidate) => candidate.slug === slug)
      ?.content ?? '';

  return {
    props: {
      entry,
      latest: getLatestChangelogRelease()?.slug === slug,
      packages: releasePackages(markdown),
      older: pagerEntry(entries[index + 1]),
      newer: pagerEntry(entries[index - 1]),
    },
  };
};

/**
 * The page sets the `h1` ("Postkit 0.2.0. Portable documents…"), so the notes' own leading
 * `# Postkit 0.2.0` is dropped.
 */
const entryComponents = { h1: () => null };

export default function ChangelogEntryPage({
  entry,
  latest,
  packages,
  older,
  newer,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  const href = changelogHref(entry);
  const released = entry.status === 'released';

  return (
    <>
      <PageMeta
        title={entry.title}
        description={entry.summary}
        type="article"
        image={shareImageMeta(changelogShareImage(entry))}
      />
      <BreadcrumbJsonLd
        items={[
          { name: 'Changelog', path: '/changelog' },
          { name: entry.version, path: href },
        ]}
      />
      <Schema
        id="changelog-entry-jsonld"
        type="TechArticle"
        data={{
          headline: `${asStatement(entry.title)} ${entry.subtitle}`,
          description: entry.summary,
          version: entry.version,
          url: absoluteUrl(href),
          ...(released
            ? { datePublished: entry.date, dateModified: entry.date }
            : { creativeWorkStatus: 'In development' }),
          keywords: entry.tags.join(', '),
          isPartOf: {
            '@type': 'WebSite',
            name: SITE_NAME,
            url: `${SITE_URL}/`,
          },
          publisher: { '@type': 'Organization', name: SITE_NAME },
        }}
      />

      <chakra.div
        // The entry boards' 728px column (no size token matches it), inside the gutters.
        maxW="calc(728px + 2 * {spacing.gutter})"
        marginInline="auto"
        paddingInline="gutter"
        paddingTop={{ base: '64px', md: '88px' }}
        paddingBottom="section"
      >
        <chakra.nav aria-label="Breadcrumb" fontSize="md" color="fg.muted">
          <chakra.ol
            display="flex"
            flexWrap="wrap"
            gap="0.35em"
            margin="0"
            marginBottom="18px"
            padding="0"
            listStyleType="none"
          >
            <li>
              <TextLink href="/changelog" variant="plain">
                Changelog
              </TextLink>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page">{entry.version}</li>
          </chakra.ol>
        </chakra.nav>

        <TwoToneHeading
          as="h1"
          textStyle="pageTitle"
          fontSize="clamp(40px, 5.4vw, 64px)"
          title={asStatement(entry.title)}
          quiet={entry.subtitle}
        />
        <chakra.p
          margin="0"
          marginTop="24px"
          fontSize={{ base: 'lg', md: '20px' }}
          lineHeight="1.5"
          color="fg.secondary"
        >
          {entry.summary}
        </chakra.p>

        <ReleaseMeta entry={entry} latest={latest} packages={packages} />

        <chakra.article marginTop="26px">
          <MdxContent source={entry.source} components={entryComponents} />
        </chakra.article>

        <ReleasePager older={older} newer={newer} />

        <chakra.div
          marginTop="32px"
          display="flex"
          flexWrap="wrap"
          justifyContent="space-between"
          alignItems="center"
          gap="16px"
        >
          <FollowReleases />
          <chakra.a
            asChild
            fontSize="md"
            color="fg.muted"
            textDecoration="none"
            css={{ '@media (hover: hover)': { _hover: { color: 'fg' } } }}
          >
            <a href={githubReleaseUrl(entry)}>View on GitHub</a>
          </chakra.a>
        </chakra.div>
      </chakra.div>
    </>
  );
}

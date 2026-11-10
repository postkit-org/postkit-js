import { chakra } from '@chakra-ui/react';
import type { GetStaticProps, InferGetStaticPropsType } from 'next';
import { useMemo, useState } from 'react';

import { FollowReleases } from '../../components/changelog/follow-releases';
import { githubReleasesUrl } from '../../components/changelog/release-links';
import { ReleaseRow } from '../../components/changelog/release-row';
import {
  ALL_TAGS,
  collectTags,
  TagFilter,
} from '../../components/changelog/tag-filter';
import {
  BreadcrumbJsonLd,
  PageContainer,
  PageMeta,
  TwoToneHeading,
} from '../../components/layout';
import { TextLink } from '../../components/legal/text-link';
import type { ChangelogEntrySummary } from '../../lib/changelog';
import {
  getChangelogEntries,
  getLatestChangelogRelease,
} from '../../lib/changelog.server';

interface ChangelogPageProps {
  readonly entries: readonly ChangelogEntrySummary[];
  /** The newest released entry's slug; upcoming entries never take "Latest". */
  readonly latestSlug: string | null;
}

export const getStaticProps: GetStaticProps<ChangelogPageProps> = async () => ({
  props: {
    entries: getChangelogEntries(),
    latestSlug: getLatestChangelogRelease()?.slug ?? null,
  },
});

export default function ChangelogPage({
  entries,
  latestSlug,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  const tags = useMemo(() => collectTags(entries), [entries]);
  const [tag, setTag] = useState(ALL_TAGS);
  const shown =
    tag === ALL_TAGS
      ? entries
      : entries.filter((entry) => entry.tags.includes(tag));

  return (
    <>
      <PageMeta
        title="Changelog"
        description="Every Postkit release, and what it means for your site: new components, theming, documents, adapters and tooling."
      />
      <BreadcrumbJsonLd items={[{ name: 'Changelog', path: '/changelog' }]} />

      <PageContainer
        paddingTop={{ base: '64px', md: '96px' }}
        paddingBottom="section"
      >
        <TwoToneHeading
          as="h1"
          textStyle="pageTitle"
          fontSize="clamp(44px, 6vw, 80px)"
          maxW="22ch"
          title="Changelog."
          quiet="Every release, and what it means for your site."
        />

        <chakra.div marginTop="32px">
          <FollowReleases />
        </chakra.div>

        <chakra.div marginTop="40px">
          <TagFilter tags={tags} value={tag} onValueChange={setTag} />
        </chakra.div>

        <chakra.p srOnly aria-live="polite">
          {tag === ALL_TAGS
            ? `${entries.length} releases`
            : `${shown.length} of ${entries.length} releases tagged ${tag}`}
        </chakra.p>

        <chakra.ul
          margin="0"
          marginTop="40px"
          padding="0"
          listStyleType="none"
          borderBottomWidth="1px"
          borderColor="border"
        >
          {shown.map((entry) => (
            <ReleaseRow
              key={entry.slug}
              entry={entry}
              latest={entry.slug === latestSlug}
            />
          ))}
        </chakra.ul>

        <chakra.p margin="0" marginTop="32px" fontSize="md" color="fg.muted">
          Every release is also tagged on{' '}
          <TextLink href={githubReleasesUrl}>GitHub</TextLink>, with npm
          provenance for each package.
        </chakra.p>
      </PageContainer>
    </>
  );
}

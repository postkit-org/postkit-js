import { chakra } from '@chakra-ui/react';
import type { ReactNode } from 'react';

import {
  formatChangelogRelease,
  type ChangelogEntrySummary,
} from '../../lib/changelog';
import { ChipList } from './chip';
import { ReleaseStatusBadge } from './release-status-badge';

export interface ReleaseMetaProps {
  readonly entry: ChangelogEntrySummary;
  readonly latest: boolean;
  readonly packages: readonly string[];
}

function Row({ term, children }: { term: string; children: ReactNode }) {
  return (
    <>
      <chakra.dt color="fg.muted" paddingTop="2px">
        {term}
      </chakra.dt>
      <chakra.dd margin="0" minWidth="0">
        {children}
      </chakra.dd>
    </>
  );
}

/** Released, Packages and Topics, between hairlines (SiteChangelog010/020/030). */
export function ReleaseMeta({ entry, latest, packages }: ReleaseMetaProps) {
  return (
    <chakra.dl
      margin="0"
      marginTop="32px"
      paddingBlock="20px"
      borderBlockWidth="1px"
      borderColor="border"
      display="grid"
      gridTemplateColumns={{ base: '80px minmax(0, 1fr)', md: '96px minmax(0, 1fr)' }}
      gap="12px 16px"
      fontSize="md"
    >
      <Row term="Released">
        <chakra.span
          display="flex"
          flexWrap="wrap"
          alignItems="center"
          gap="8px"
        >
          {entry.status === 'released' ? (
            <time dateTime={entry.date}>{formatChangelogRelease(entry)}</time>
          ) : (
            formatChangelogRelease(entry)
          )}
          <ReleaseStatusBadge status={entry.status} latest={latest} />
        </chakra.span>
      </Row>
      {packages.length ? (
        <Row term="Packages">
          <ChipList items={packages} mono />
        </Row>
      ) : null}
      {entry.tags.length ? (
        <Row term="Topics">
          <ChipList items={entry.tags} />
        </Row>
      ) : null}
    </chakra.dl>
  );
}

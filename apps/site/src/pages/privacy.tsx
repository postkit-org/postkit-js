import type { GetStaticProps, InferGetStaticPropsType } from 'next';

import { BreadcrumbJsonLd, PageMeta } from '../components/layout';
import {
  CheckList,
  LegalPage,
  LegalSection,
  LegalText,
} from '../components/legal/legal-page';
import {
  formatLegalDate,
  lastUpdated,
} from '../components/legal/build-time.server';
import { TextLink } from '../components/legal/text-link';

/*
 * Every claim on this page has to stay true (08 rule 5). What each one depends on is listed
 * in docs/design/handoff/specs/09-content-callouts.md, "Facts the copy depends on". A change
 * that would make a line untrue (a cookie, a new third party, session replay, a log drain)
 * is a question for Ryan, not an edit here. Copy: SitePrivacy, plus the Vercel line from 09
 * "Copy changes since the boards".
 */

const CONTACT = 'hello@postkit.org';

interface PrivacyPageProps {
  readonly updated: { readonly iso: string; readonly label: string };
}

export const getStaticProps: GetStaticProps<PrivacyPageProps> = async () => {
  const iso = lastUpdated(['apps/site/src/pages/privacy.tsx']);
  return { props: { updated: { iso, label: formatLegalDate(iso) } } };
};

export default function PrivacyPage({
  updated,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  return (
    <>
      <PageMeta
        title="Privacy"
        description="Postkit’s packages collect nothing and never phone home. What postkit.org collects: very little, and only what you give us."
      />
      <BreadcrumbJsonLd items={[{ name: 'Privacy', path: '/privacy' }]} />

      <LegalPage
        path="/privacy"
        title="Privacy."
        quiet="Very little, and only what you give us."
        lede="Postkit’s packages collect nothing and never phone home. This page covers postkit.org."
        updated={updated}
      >
        <LegalSection title="What we collect">
          <CheckList
            items={[
              'Your email address, if you sign up for release emails. It’s used for those emails only, sent through Resend, and every email has a one-click unsubscribe.',
              'Page counts through Fathom. No cookies, and nothing that identifies you.',
              'Error reports through Sentry when a page breaks, with IP addresses removed.',
              'Standard request logs at our host, Vercel: the page asked for, your browser and your IP address. They’re kept briefly, for security and to fix problems, and never used for anything else.',
            ]}
          />
        </LegalSection>

        <LegalSection title="What we don’t">
          <LegalText>
            No cookies, no ads, no tracking pixels, and we never sell or share
            your data.
          </LegalText>
        </LegalSection>

        <LegalSection title="Questions">
          <LegalText>
            To ask anything, or to have your email deleted, write to{' '}
            <TextLink href={`mailto:${CONTACT}`}>{CONTACT}</TextLink>.
          </LegalText>
        </LegalSection>
      </LegalPage>
    </>
  );
}

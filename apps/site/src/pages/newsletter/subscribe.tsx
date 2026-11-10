import { chakra } from '@chakra-ui/react';
import type { GetStaticProps, InferGetStaticPropsType } from 'next';
import Head from 'next/head';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';

import { PageMeta, ResultPage } from '../../components/layout';
import {
  FeedLinks,
  releaseFeeds,
  replaceUrl,
  ResultPlaceholder,
  SubscribeForm,
} from '../../components/newsletter';
import { Button } from '../../components/primitives';
import { trackGoal } from '../../lib/analytics';
import { changelogHref } from '../../lib/changelog';
import {
  getChangelogEntries,
  getLatestChangelogRelease,
} from '../../lib/changelog.server';

const PATH = '/newsletter/subscribe';

interface SubscribePageProps {
  /** The newest released version, for "Read the 0.2.0 release". */
  readonly latestRelease: {
    readonly version: string;
    readonly href: string;
  } | null;
  /** The version in development, for "The next email comes with 0.3.0". */
  readonly nextVersion: string | null;
}

export const getStaticProps: GetStaticProps<SubscribePageProps> = async () => {
  const latest = getLatestChangelogRelease();
  // Newest first, so the last upcoming entry is the one that ships next.
  const upcoming = getChangelogEntries().filter(
    (entry) => entry.status === 'upcoming',
  );
  return {
    props: {
      latestRelease: latest
        ? { version: latest.version, href: changelogHref(latest) }
        : null,
      nextVersion: upcoming.at(-1)?.version ?? null,
    },
  };
};

type View = 'form' | 'confirmed' | 'expired';

/**
 * The masked address from `#for=r…@example.com` (04 §1). Fragments never reach the server or
 * analytics; it's only ever shown back to the reader, as text.
 */
function readMaskedAddress(hash: string): string | null {
  const match = /(?:^#|&)for=([^&]*)/.exec(hash);
  if (!match?.[1]) return null;
  try {
    const value = decodeURIComponent(match[1]).trim();
    return value.includes('@') && value.length <= 254 ? value : null;
  } catch {
    return null;
  }
}

function FormView() {
  return (
    <ResultPage
      label="Release emails"
      title="Follow along."
      quiet="One email per release, nothing else."
      actions={<SubscribeForm layout="inline" width="100%" />}
      footnote={
        <>
          Or subscribe with <FeedLinks feeds={releaseFeeds} />
        </>
      }
    />
  );
}

function ConfirmedView({
  address,
  latestRelease,
  nextVersion,
}: SubscribePageProps & { readonly address: string | null }) {
  return (
    <ResultPage
      label="Subscribed"
      title="You’re on the list."
      quiet="One email per release."
      lede={
        <>
          {address ? (
            <>
              Confirmed for{' '}
              <chakra.span fontWeight="medium" overflowWrap="anywhere">
                {address}
              </chakra.span>
              .
            </>
          ) : (
            'Confirmed.'
          )}{' '}
          The next email comes with {nextVersion ?? 'the next release'}, and
          every one has a one-click unsubscribe.
        </>
      }
      actions={
        <>
          {latestRelease ? (
            <Button asChild variant="primary" size="lg" paddingInline="24px">
              <NextLink href={latestRelease.href}>
                Read the {latestRelease.version} release
              </NextLink>
            </Button>
          ) : null}
          <Button asChild variant="secondary" size="lg" paddingInline="24px">
            <NextLink href="/components">Browse components</NextLink>
          </Button>
        </>
      }
      footnote={
        <>
          Prefer a feed? <FeedLinks feeds={releaseFeeds} />
        </>
      }
    />
  );
}

function ExpiredView() {
  return (
    <ResultPage
      label="Link expired"
      title="That link has expired."
      quiet="Get a fresh one."
      lede="Confirmation links work for 7 days. Enter your address and we’ll send a new link."
      actions={
        <SubscribeForm layout="inline" submitLabel="Send link" width="100%" />
      }
    />
  );
}

/**
 * `/newsletter/subscribe` (04 §1b): the sign-up form, and where the confirm link lands
 * (`?status=confirmed#for=…` or `?status=expired`). The page is static, so the status is read
 * after hydration; until then it renders the layout without the title block.
 */
export default function SubscribePage({
  latestRelease,
  nextVersion,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  const router = useRouter();
  const [view, setView] = useState<View | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  // Read once: the URL is rewritten below, so a second pass would find nothing.
  const statusRead = useRef(false);

  useEffect(() => {
    if (!router.isReady || statusRead.current) return;
    statusRead.current = true;
    const status = router.query.status;

    if (status === 'confirmed') {
      setAddress(readMaskedAddress(window.location.hash));
      setView('confirmed');
      trackGoal('subscribe-confirmed');
      // A reload or a shared link shows the form, and the address leaves the address bar.
      replaceUrl(PATH);
    } else if (status === 'expired') {
      setView('expired');
    } else {
      setView('form');
    }
  }, [router.isReady, router.query.status]);

  return (
    <>
      <PageMeta
        title="Release emails"
        description="Follow along. One email per Postkit release, nothing else."
        path={PATH}
      />
      {view === 'confirmed' || view === 'expired' ? (
        <Head>
          <meta key="robots" name="robots" content="noindex" />
        </Head>
      ) : null}

      {view === 'form' ? <FormView /> : null}
      {view === 'confirmed' ? (
        <ConfirmedView
          address={address}
          latestRelease={latestRelease}
          nextVersion={nextVersion}
        />
      ) : null}
      {view === 'expired' ? <ExpiredView /> : null}
      {view === null ? <ResultPlaceholder /> : null}
    </>
  );
}

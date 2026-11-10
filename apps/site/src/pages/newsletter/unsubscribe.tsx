import { chakra } from '@chakra-ui/react';
import type { GetServerSideProps, InferGetServerSidePropsType } from 'next';
import Head from 'next/head';
import NextLink from 'next/link';
import { useEffect, useRef, useState, type ReactNode } from 'react';

import { PageMeta, ResultPage } from '../../components/layout';
import { TextLink } from '../../components/legal/text-link';
import {
  CautionAlert,
  replaceUrl,
  requestUnsubscribe,
} from '../../components/newsletter';
import { UNSUBSCRIBE_ENDPOINT } from '../../components/newsletter/newsletter-api';
import { Button } from '../../components/primitives';

const PATH = '/newsletter/unsubscribe';
const CONTACT = 'hello@postkit.org';

/** Sealed tokens are short; anything far longer isn't one. */
const MAX_TOKEN_LENGTH = 4096;

interface UnsubscribePageProps {
  /** The sealed token from `?token=` (the address can't be read from it), or `null`. */
  readonly token: string | null;
}

/**
 * Rendered per request only so the `<noscript>` form can carry the token: a static page can't
 * know it without JavaScript. Reading it changes nothing; only the POST does (04 §1a).
 */
export const getServerSideProps: GetServerSideProps<
  UnsubscribePageProps
> = async ({ query, res }) => {
  res.setHeader('Cache-Control', 'private, no-store');
  const token = typeof query.token === 'string' ? query.token.trim() : '';
  return {
    props: {
      token: token && token.length <= MAX_TOKEN_LENGTH ? token : null,
    },
  };
};

type UnsubscribeState = 'working' | 'done' | 'invalid' | 'failed';

function WorkingView({
  children,
  actions,
}: {
  readonly children?: ReactNode;
  readonly actions?: ReactNode;
}) {
  return (
    <ResultPage
      label="Unsubscribe"
      title="Taking you off the list."
      quiet="One moment."
      actions={actions}
    >
      {children}
    </ResultPage>
  );
}

function DoneView() {
  return (
    <ResultPage
      label="Unsubscribed"
      title="You’re off the list."
      quiet="No more release emails."
      lede={
        <>
          You won’t get release emails from Postkit any more. Changed your mind?{' '}
          <TextLink href="/newsletter/subscribe">Sign up again</TextLink> any
          time, from the Notes page.
        </>
      }
      actions={
        <Button asChild variant="secondary" size="lg" paddingInline="24px">
          <NextLink href="/">Back to postkit.org</NextLink>
        </Button>
      }
    />
  );
}

function BadLinkView() {
  return (
    <ResultPage
      label="Link not valid"
      title="That link doesn’t work."
      quiet="Nothing was changed."
      lede={
        <>
          Use the Unsubscribe link in the latest Postkit email, or write to{' '}
          <TextLink href={`mailto:${CONTACT}`}>{CONTACT}</TextLink>.
        </>
      }
    />
  );
}

/** Without JavaScript the page can't post on load, so the reader posts the same request. */
function NoScriptForm({ token }: { readonly token: string }) {
  return (
    <noscript>
      <chakra.form
        method="post"
        action={UNSUBSCRIBE_ENDPOINT}
        display="flex"
        justifyContent="center"
      >
        <input type="hidden" name="token" value={token} />
        <Button type="submit" variant="primary" size="lg">
          Unsubscribe
        </Button>
      </chakra.form>
    </noscript>
  );
}

/** Couldn't unsubscribe (network, 5xx, or the API's `#error` redirect). Try again needs the token. */
function FailedView({ onRetry }: { readonly onRetry?: () => void }) {
  return (
    <WorkingView
      actions={
        onRetry ? (
          <Button type="button" variant="primary" size="lg" onClick={onRetry}>
            Try again
          </Button>
        ) : null
      }
    >
      <CautionAlert
        marginInline="auto"
        maxW="460px"
        title="We couldn’t take you off the list just now."
      >
        Try again in a minute.
      </CautionAlert>
    </WorkingView>
  );
}

/**
 * What the server sends when there's no token: the API's form-post redirect lands on
 * `#done`, `#invalid` or `#error`, which the server never sees. `:target` shows the right state before
 * (or without) JavaScript; with no fragment it's the Bad link state.
 */
function FragmentStates() {
  return (
    <chakra.div
      css={{
        '& > [data-fragment]': {
          display: 'none',
          scrollMarginTop: '100vh',
        },
        '& > [data-fragment]:target': { display: 'block' },
        '& > :target ~ [data-fallback]': { display: 'none' },
      }}
    >
      <div id="done" data-fragment="">
        <DoneView />
      </div>
      <div id="invalid" data-fragment="">
        <BadLinkView />
      </div>
      <div id="error" data-fragment="">
        <FailedView />
      </div>
      <div data-fallback="">
        <BadLinkView />
      </div>
    </chakra.div>
  );
}

/**
 * `/newsletter/unsubscribe?token=…` (04 §1a, SiteUnsubscribed). A GET changes nothing: on load
 * the page POSTs the token to the API and shows Working, then Done, Bad link or Couldn't
 * unsubscribe. The token leaves the address bar as soon as it's read.
 */
export default function UnsubscribePage({
  token,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  // `null` until mounted: the server's markup (Working, or the fragment states) stays as is.
  const [state, setState] = useState<UnsubscribeState | null>(null);
  const started = useRef(false);

  const unsubscribe = async (value: string) => {
    setState('working');
    setState(await requestUnsubscribe(value));
  };

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const { hash } = window.location;
    if (token) replaceUrl(`${PATH}${hash}`);

    if (hash === '#done') setState('done');
    else if (hash === '#error') setState('failed');
    else if (hash === '#invalid' || !token) setState('invalid');
    else void unsubscribe(token);
  }, [token]);

  let content: ReactNode;
  if (state === null) {
    content = token ? (
      <WorkingView>
        <NoScriptForm token={token} />
      </WorkingView>
    ) : (
      <FragmentStates />
    );
  } else if (state === 'working') {
    content = <WorkingView />;
  } else if (state === 'done') {
    content = <DoneView />;
  } else if (state === 'invalid') {
    content = <BadLinkView />;
  } else {
    content = (
      <FailedView onRetry={token ? () => void unsubscribe(token) : undefined} />
    );
  }

  return (
    <>
      <PageMeta
        title="Unsubscribe"
        description="Stop getting Postkit release emails, in one click."
        path={PATH}
      />
      <Head>
        <meta key="robots" name="robots" content="noindex" />
      </Head>
      <div role="status">{content}</div>
    </>
  );
}

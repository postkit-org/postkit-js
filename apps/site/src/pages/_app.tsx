import { PostkitProvider } from '@postkit/react';
import type { AppProps } from 'next/app';
import Head from 'next/head';

import { SiteShell } from '../components/site-shell';
import { siteSystem } from '../lib/site-theme';
import './styles.css';

function CustomApp({ Component, pageProps }: AppProps) {
  return (
    <PostkitProvider system={siteSystem}>
      <Head>
        <meta
          name="description"
          content="PostKit is a portable publishing component system for React and the web."
        />
        <meta name="theme-color" content="#f4f1e8" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <title>PostKit</title>
      </Head>
      <SiteShell>
        <Component {...pageProps} />
      </SiteShell>
    </PostkitProvider>
  );
}

export default CustomApp;

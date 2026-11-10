import { PostkitProvider } from '@postkit/chakra';
import { ThemeProvider } from 'next-themes';
import type { AppProps } from 'next/app';
import Head from 'next/head';

import { SiteAnalytics } from '../components/site-analytics';
import { SiteShell } from '../components/site-shell';
import { siteCodeBlockAdapter } from '../lib/code-block-adapter';
import { fontVariablesCss } from '../lib/fonts';
import { siteSystem } from '../lib/site-theme';
import './styles.css';

function CustomApp({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <PostkitProvider
        system={siteSystem}
        codeBlockAdapter={siteCodeBlockAdapter}
      >
        <Head>
          <meta
            name="description"
            content="Postkit is a portable publishing component system for React and the web."
          />
          <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
          <title>Postkit</title>
        </Head>
        <style jsx global>
          {fontVariablesCss}
        </style>
        <SiteAnalytics>
          <SiteShell>
            <Component {...pageProps} />
          </SiteShell>
        </SiteAnalytics>
      </PostkitProvider>
    </ThemeProvider>
  );
}

export default CustomApp;

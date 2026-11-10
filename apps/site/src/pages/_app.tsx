import { PostkitProvider } from '@postkit/chakra';
import { ThemeProvider } from 'next-themes';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { MetaProvider } from 'next-meta';

import { siteMetaDefaults } from '../components/layout/page-meta';
import { SiteShell } from '../components/site-shell';
import { SearchProvider } from '../lib/search';
import { siteCodeBlockAdapter } from '../lib/code-block-adapter';
import { fontVariablesCss } from '../lib/fonts';
import { siteSystem } from '../lib/site-theme';
import './styles.css';

function CustomApp({ Component, pageProps }: AppProps) {
  const { asPath } = useRouter();

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
          <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        </Head>
        <style jsx global>
          {fontVariablesCss}
        </style>
        {/* Title, description, canonical and social defaults; each page's PageMeta overrides them. */}
        <MetaProvider {...siteMetaDefaults(asPath)}>
          <SearchProvider>
            <SiteShell>
              <Component {...pageProps} />
            </SiteShell>
          </SearchProvider>
        </MetaProvider>
      </PostkitProvider>
    </ThemeProvider>
  );
}

export default CustomApp;

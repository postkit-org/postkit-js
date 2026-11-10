import { Head, Html, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    // next-themes sets the theme class on <html> before hydration.
    <Html lang="en" suppressHydrationWarning>
      <Head>
        <meta
          name="theme-color"
          content="#FFFFFF"
          media="(prefers-color-scheme: light)"
        />
        <meta
          name="theme-color"
          content="#0F0F11"
          media="(prefers-color-scheme: dark)"
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

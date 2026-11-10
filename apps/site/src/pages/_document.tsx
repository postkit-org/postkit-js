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
        {/* Icons and manifest (05 §2), written by `nx run site:icons`. */}
        <link rel="icon" href="/favicon.ico" sizes="32x32" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

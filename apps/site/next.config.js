//@ts-check

const { withContentCollections } = require('@content-collections/next');

// One file per content area, so docs and changelog URL changes stay separate.
const redirectFiles = [
  require('./redirects/docs.json'),
  require('./redirects/changelog.json'),
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['postkit.test'],
  poweredByHeader: false,
  async redirects() {
    return redirectFiles.flatMap((file) =>
      file.redirects.map(({ source, destination, permanent }) => ({
        source,
        destination,
        permanent,
      })),
    );
  },
  reactStrictMode: true,
  transpilePackages: [
    '@postkit/next',
    '@postkit/chakra',
    '@postkit/unfurl',
    '@postkit/site-theme',
  ],
};

module.exports = withContentCollections(nextConfig);

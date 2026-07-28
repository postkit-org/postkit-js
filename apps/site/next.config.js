//@ts-check

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  transpilePackages: ['@postkit/next', '@postkit/react', '@postkit/unfurl'],
};

module.exports = nextConfig;

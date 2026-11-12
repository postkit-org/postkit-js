import tokens from '../tokens.json' with { type: 'json' };

/**
 * The raw postkit.org design tokens (light and dark values, gradients, type scale).
 * `libs/site-emails` maps these into Chakra Email's theme; the site uses `siteSystem`.
 */
export { tokens };
export type SiteTokens = typeof tokens;

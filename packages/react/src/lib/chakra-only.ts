/**
 * Built-in components with no headless view yet: only `@postkit/chakra`
 * renders them (03 D11 consequence). Each has client behaviour that isn't a
 * headless hook yet; it gets a view here once it is, and leaves this list.
 *
 * The manifest has no `support.react: 'chakra-only'` value yet, so this list
 * is where that status lives until manifest v2 (03 §8 step 8).
 */
export const chakraOnly = Object.freeze([
  // Carousel paging is Chakra's (Ark) carousel.
  'Carousel',
  // Resolver and embed consent.
  'LinkPreview',
  // The subscribe flow through PostkitProvider's newsletter config.
  'NewsletterSignup',
  // Native share, clipboard and service share flows.
  'ShareActions',
  // Resolver and embed consent.
  'SocialPost',
] as const);

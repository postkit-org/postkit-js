import type {
  NewsletterSignupConfig,
  NewsletterSubscribe,
  NewsletterSubscription,
  NewsletterSubscriptionResult,
} from '@postkit/core/behaviors';

export type PostkitNewsletterSubscription = NewsletterSubscription;

export type PostkitNewsletterResult = NewsletterSubscriptionResult;

export type PostkitNewsletterSubscribe = NewsletterSubscribe;

/**
 * Host-owned newsletter configuration. Secrets and provider-specific behavior
 * stay outside authored MDX; Postkit only supplies the presentation and
 * submission boundary. The same configuration drives the headless
 * `NewsletterSignup` in `@postkit/react` (its `newsletter` prop).
 */
export type PostkitNewsletterConfig = NewsletterSignupConfig;

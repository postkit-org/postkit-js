import {
  connectNewsletterSignup,
  newsletterSignupInitialState,
  newsletterSignupTransition,
  type NewsletterSignupApi,
  type NewsletterSignupBehaviorOptions,
} from '@postkit/core/behaviors';
import { normalizeProps, type PropTypes } from '@zag-js/react';
import { useReducer } from 'react';

/** Options for {@link useNewsletterSignup}. */
export type UseNewsletterSignupOptions = NewsletterSignupBehaviorOptions;

/** The newsletter signup API for React. */
export type UseNewsletterSignupReturn = NewsletterSignupApi<
  PropTypes['button'],
  PropTypes['element']
>;

/**
 * Postkit's newsletter signup behaviour for React, over the plain TypeScript
 * machine in `@postkit/core/behaviors`. Pass the host's `config` (a
 * `subscribe` callback or a form `action`); spread the prop getters onto the
 * form, email input, submit button and status line, and render
 * `hiddenFields` as hidden inputs.
 */
export function useNewsletterSignup(
  options: UseNewsletterSignupOptions = {},
): UseNewsletterSignupReturn {
  const [state, send] = useReducer(
    newsletterSignupTransition,
    undefined,
    newsletterSignupInitialState,
  );
  return connectNewsletterSignup({ state, send }, normalizeProps, options);
}

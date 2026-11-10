import {
  connectEmbedConsent,
  embedConsentInitialState,
  embedConsentTransition,
  type EmbedConsentApi,
  type EmbedConsentBehaviorOptions,
} from '@postkit/core/behaviors';
import { normalizeProps, type PropTypes } from '@zag-js/react';
import { useEffect, useReducer, useRef } from 'react';

/** Options for {@link useEmbedConsent}. */
export type UseEmbedConsentOptions = EmbedConsentBehaviorOptions;

/** The embed consent API for React. */
export type UseEmbedConsentReturn = EmbedConsentApi<
  PropTypes['button'],
  PropTypes['element']
>;

/**
 * Postkit's embed consent behaviour for React, over the plain TypeScript
 * machine in `@postkit/core/behaviors`. With the default `click` activation,
 * render the prompt until `shouldRenderFrame` is true and the frame only
 * after: nothing from the embed's origin is in the page before consent.
 */
export function useEmbedConsent(
  options: UseEmbedConsentOptions = {},
): UseEmbedConsentReturn {
  const [state, send] = useReducer(
    embedConsentTransition,
    options.activation,
    embedConsentInitialState,
  );
  const onStateChange = useRef(options.onStateChange);
  onStateChange.current = options.onStateChange;
  const previous = useRef(state);
  useEffect(() => {
    if (previous.current === state) return;
    previous.current = state;
    onStateChange.current?.({ state });
  }, [state]);
  return connectEmbedConsent({ state, send }, normalizeProps);
}

import type { Behavior } from '../behavior.js';

/**
 * When a third-party embed loads: `click` (the default) waits for the reader
 * to ask for it; `immediate` loads it straight away.
 */
export type EmbedConsentActivation = 'click' | 'immediate';

/**
 * - `idle`: nothing from the embed's origin is in the page; a consent prompt
 *   is shown.
 * - `requested`: the reader asked (or activation is `immediate`); render the
 *   frame.
 * - `loaded`: the frame finished loading.
 */
export type EmbedConsentState = 'idle' | 'requested' | 'loaded';

/** Events the embed consent machine accepts. */
export type EmbedConsentEvent =
  { readonly type: 'REQUEST' } | { readonly type: 'LOAD' };

/** The state an embed starts in for an activation. */
export function embedConsentInitialState(
  activation: EmbedConsentActivation = 'click',
): EmbedConsentState {
  return activation === 'immediate' ? 'requested' : 'idle';
}

/**
 * The embed consent state machine as a pure function: `idle` → `requested`
 * on `REQUEST`, `requested` → `loaded` on `LOAD`. Other events leave the state
 * unchanged.
 */
export function embedConsentTransition(
  state: EmbedConsentState,
  event: EmbedConsentEvent,
): EmbedConsentState {
  if (state === 'idle' && event.type === 'REQUEST') return 'requested';
  if (state === 'requested' && event.type === 'LOAD') return 'loaded';
  return state;
}

/** The current state and a way to send events, from any host. */
export interface EmbedConsentService {
  readonly state: EmbedConsentState;
  send(event: EmbedConsentEvent): void;
}

/**
 * A prop normalizer, as Zag's: `@zag-js/react`'s `normalizeProps` for React,
 * or `normalizeProps` from this module for the DOM.
 */
export interface EmbedConsentNormalizer<Button, Element> {
  button(props: Record<string, unknown>): Button;
  element(props: Record<string, unknown>): Element;
}

/** What a renderer reads to draw an embed behind a consent prompt. */
export interface EmbedConsentApi<
  Button = Record<string, unknown>,
  Element = Record<string, unknown>,
> {
  readonly state: EmbedConsentState;
  /** True once the frame may load: render it now, and not before. */
  readonly shouldRenderFrame: boolean;
  /** True once the frame has loaded. */
  readonly loaded: boolean;
  /** Asks for the embed, as the consent button does. */
  request(): void;
  /** Marks the frame as loaded, as the frame's load handler does. */
  markLoaded(): void;
  /** The wrapper around the prompt or the frame. */
  getRootProps(): Element;
  /** The consent prompt; render it only while `shouldRenderFrame` is false. */
  getPromptProps(): Element;
  /** The button that asks for the embed. */
  getRequestTriggerProps(): Button;
  /** The frame; render it only once `shouldRenderFrame` is true. */
  getFrameProps(): Element;
}

/** Connects embed consent state to renderer props. */
export function connectEmbedConsent<Button, Element>(
  service: EmbedConsentService,
  normalize: EmbedConsentNormalizer<Button, Element>,
): EmbedConsentApi<Button, Element> {
  const { state, send } = service;
  const shouldRenderFrame = state !== 'idle';
  return {
    state,
    shouldRenderFrame,
    loaded: state === 'loaded',
    request: () => send({ type: 'REQUEST' }),
    markLoaded: () => send({ type: 'LOAD' }),
    getRootProps: () =>
      normalize.element({
        'data-scope': 'embed-consent',
        'data-part': 'root',
        'data-state': state,
        'aria-busy': state === 'requested' ? true : undefined,
      }),
    getPromptProps: () =>
      normalize.element({
        'data-scope': 'embed-consent',
        'data-part': 'prompt',
        'data-state': state,
        role: 'group',
        hidden: shouldRenderFrame,
      }),
    getRequestTriggerProps: () =>
      normalize.button({
        'data-scope': 'embed-consent',
        'data-part': 'request-trigger',
        type: 'button',
        onClick(event: { defaultPrevented?: boolean }) {
          if (event?.defaultPrevented) return;
          send({ type: 'REQUEST' });
        },
      }),
    getFrameProps: () =>
      normalize.element({
        'data-scope': 'embed-consent',
        'data-part': 'frame',
        'data-state': state,
        onLoad() {
          send({ type: 'LOAD' });
        },
      }),
  };
}

/** Options for {@link createEmbedConsent}. */
export interface EmbedConsentBehaviorOptions {
  /** Defaults to `click`, which the Privacy page relies on. */
  readonly activation?: EmbedConsentActivation;
  /** Called after each state change. */
  readonly onStateChange?: (details: {
    readonly state: EmbedConsentState;
  }) => void;
}

/** A running embed consent behaviour. */
export interface EmbedConsentBehavior extends Behavior<EmbedConsentApi> {
  readonly state: EmbedConsentState;
  send(event: EmbedConsentEvent): void;
}

const identityNormalizer: EmbedConsentNormalizer<
  Record<string, unknown>,
  Record<string, unknown>
> = {
  button: (props) => props,
  element: (props) => props,
};

/**
 * Creates the embed consent behaviour without a UI framework. Plain
 * TypeScript, with no Zag dependency (decision D7).
 */
export function createEmbedConsent(
  options: EmbedConsentBehaviorOptions = {},
): EmbedConsentBehavior {
  let state = embedConsentInitialState(options.activation);
  const listeners = new Set<() => void>();
  let running = false;
  const send = (event: EmbedConsentEvent) => {
    const next = embedConsentTransition(state, event);
    if (next === state) return;
    state = next;
    options.onStateChange?.({ state });
    if (running) for (const listener of [...listeners]) listener();
  };
  return {
    get state() {
      return state;
    },
    send,
    get api() {
      return connectEmbedConsent({ state, send }, identityNormalizer);
    },
    start() {
      running = true;
    },
    stop() {
      running = false;
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

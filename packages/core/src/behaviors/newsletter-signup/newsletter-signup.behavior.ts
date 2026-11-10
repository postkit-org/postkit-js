import type { Behavior } from '../behavior.js';

/** What a host's `subscribe` callback receives. */
export interface NewsletterSubscription {
  readonly email: string;
  readonly list?: string;
}

/** What a host's `subscribe` callback may return. */
export interface NewsletterSubscriptionResult {
  /** Replaces the signup's success message. */
  readonly message?: string;
}

/** A host-owned subscription callback. Throw (or reject) to report failure. */
export type NewsletterSubscribe = (
  subscription: NewsletterSubscription,
) =>
  | NewsletterSubscriptionResult
  | Promise<NewsletterSubscriptionResult | void>
  | void;

/**
 * Host-owned newsletter configuration, as `@postkit/chakra`'s
 * `PostkitProvider` takes it: a `subscribe` callback, or a form `action` the
 * browser posts to. Credentials and endpoints stay out of authored content.
 */
export interface NewsletterSignupConfig {
  readonly subscribe?: NewsletterSubscribe;
  readonly action?: string;
  readonly method?: 'get' | 'post';
  /** Defaults to `email`. */
  readonly emailFieldName?: string;
  /** Defaults to `list`. */
  readonly listFieldName?: string;
  readonly hiddenFields?: Readonly<Record<string, string>>;
}

/**
 * - `idle`: ready, before or between submissions.
 * - `submitting`: the `subscribe` callback is running.
 * - `success` / `error`: it finished; `message` says how.
 */
export type NewsletterSignupStatus =
  'idle' | 'submitting' | 'success' | 'error';

/** The signup's state. */
export interface NewsletterSignupState {
  readonly status: NewsletterSignupStatus;
  /** The status message; empty while idle. */
  readonly message: string;
}

/** Events the signup machine accepts. */
export type NewsletterSignupEvent =
  | { readonly type: 'SUBMIT' }
  | { readonly type: 'RESOLVE'; readonly message: string }
  | { readonly type: 'REJECT'; readonly message: string };

/** The message shown while the `subscribe` callback runs. */
export const newsletterSignupSubmittingMessage = 'Subscribing…';

/** The message shown when the host configured neither callback nor action. */
export const newsletterSignupUnconfiguredMessage =
  'Newsletter signup is not configured.';

/** The state a signup starts in. */
export function newsletterSignupInitialState(): NewsletterSignupState {
  return { status: 'idle', message: '' };
}

/**
 * The signup state machine as a pure function: any state → `submitting` on
 * `SUBMIT`; `submitting` → `success` on `RESOLVE` and → `error` on `REJECT`.
 * Other events leave the state unchanged.
 */
export function newsletterSignupTransition(
  state: NewsletterSignupState,
  event: NewsletterSignupEvent,
): NewsletterSignupState {
  switch (event.type) {
    case 'SUBMIT':
      return state.status === 'submitting'
        ? state
        : { status: 'submitting', message: newsletterSignupSubmittingMessage };
    case 'RESOLVE':
      return state.status === 'submitting'
        ? { status: 'success', message: event.message }
        : state;
    case 'REJECT':
      return state.status === 'submitting'
        ? { status: 'error', message: event.message }
        : state;
  }
}

/** The current state and a way to send events, from any host. */
export interface NewsletterSignupService {
  readonly state: NewsletterSignupState;
  send(event: NewsletterSignupEvent): void;
}

/**
 * A prop normalizer, as Zag's: `@zag-js/react`'s `normalizeProps` for React,
 * or `normalizeProps` from this module for the DOM.
 */
export interface NewsletterSignupNormalizer<Button, Element> {
  button(props: Record<string, unknown>): Button;
  element(props: Record<string, unknown>): Element;
}

/** The signup's configuration and copy, for {@link connectNewsletterSignup}. */
export interface NewsletterSignupContext {
  readonly config?: NewsletterSignupConfig;
  /** A host-defined list or audience identifier, posted with the email. */
  readonly list?: string;
  /** Shown after a successful `subscribe` that returns no message. */
  readonly successMessage?: string;
  /** Shown when `subscribe` throws or rejects. */
  readonly errorMessage?: string;
}

/** A form submit event, from React or the DOM. */
interface SubmitEventLike {
  readonly currentTarget: unknown;
  preventDefault(): void;
}

/** What a renderer reads to draw a newsletter signup form. */
export interface NewsletterSignupApi<
  Button = Record<string, unknown>,
  Element = Record<string, unknown>,
> {
  readonly status: NewsletterSignupStatus;
  /** The status line: the state's message, or the unconfigured notice. */
  readonly message: string;
  /** True when the host supplied `subscribe` or `action`. */
  readonly configured: boolean;
  readonly submitting: boolean;
  /** Hidden inputs to render in the form: the list, then the host's fields. */
  readonly hiddenFields: readonly (readonly [name: string, value: string])[];
  /** The form: posts to `action`, or runs `subscribe` on submit. */
  getFormProps(): Element;
  /** The email input. Give it an id and a `<label for>`. */
  getInputProps(): Element;
  /** The submit button; disabled until configured and while submitting. */
  getSubmitProps(): Button;
  /** The status line, announced politely (`role="status"` unless an error). */
  getStatusProps(): Element;
}

/** Connects newsletter signup state to renderer props. */
export function connectNewsletterSignup<Button, Element>(
  service: NewsletterSignupService,
  normalize: NewsletterSignupNormalizer<Button, Element>,
  context: NewsletterSignupContext,
): NewsletterSignupApi<Button, Element> {
  const { state, send } = service;
  const { config, list } = context;
  const configured = Boolean(config?.subscribe || config?.action);
  const submitting = state.status === 'submitting';
  const emailFieldName = config?.emailFieldName ?? 'email';
  const listFieldName = config?.listFieldName ?? 'list';
  const hiddenFields: (readonly [string, string])[] = [];
  if (list) hiddenFields.push([listFieldName, list]);
  hiddenFields.push(...Object.entries(config?.hiddenFields ?? {}));

  const onSubmit = (event: SubmitEventLike) => {
    const subscribe = config?.subscribe;
    if (!subscribe) {
      // Without an action there is nowhere to post; with one, the browser
      // submits the form.
      if (!config?.action) event.preventDefault();
      return;
    }
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement;
    const email = String(new FormData(form).get(emailFieldName) ?? '');
    send({ type: 'SUBMIT' });
    void (async () => {
      try {
        const result = await subscribe({ email, list });
        form.reset();
        send({
          type: 'RESOLVE',
          message: result?.message ?? context.successMessage ?? '',
        });
      } catch {
        send({ type: 'REJECT', message: context.errorMessage ?? '' });
      }
    })();
  };

  return {
    status: state.status,
    message:
      state.message || (configured ? '' : newsletterSignupUnconfiguredMessage),
    configured,
    submitting,
    hiddenFields,
    getFormProps: () =>
      normalize.element({
        action: config?.subscribe ? undefined : config?.action,
        method: config?.method ?? 'post',
        onSubmit,
      }),
    getInputProps: () =>
      normalize.element({
        type: 'email',
        name: emailFieldName,
        autoComplete: 'email',
        required: true,
        disabled: submitting,
        'aria-invalid': state.status === 'error' ? true : undefined,
      }),
    getSubmitProps: () =>
      normalize.button({
        type: 'submit',
        disabled: !configured || submitting,
      }),
    getStatusProps: () =>
      normalize.element({
        'aria-live': 'polite',
        role: state.status === 'error' ? undefined : 'status',
      }),
  };
}

/** Options for {@link createNewsletterSignup}. */
export type NewsletterSignupBehaviorOptions = NewsletterSignupContext;

/** A running newsletter signup behaviour. */
export interface NewsletterSignupBehavior extends Behavior<NewsletterSignupApi> {
  readonly state: NewsletterSignupState;
  send(event: NewsletterSignupEvent): void;
}

const identityNormalizer: NewsletterSignupNormalizer<
  Record<string, unknown>,
  Record<string, unknown>
> = {
  button: (props) => props,
  element: (props) => props,
};

/**
 * Creates the newsletter signup behaviour without a UI framework. Plain
 * TypeScript, with no Zag dependency.
 */
export function createNewsletterSignup(
  options: NewsletterSignupBehaviorOptions = {},
): NewsletterSignupBehavior {
  let state = newsletterSignupInitialState();
  const listeners = new Set<() => void>();
  let running = false;
  const send = (event: NewsletterSignupEvent) => {
    const next = newsletterSignupTransition(state, event);
    if (next === state) return;
    state = next;
    if (running) for (const listener of [...listeners]) listener();
  };
  return {
    get state() {
      return state;
    },
    send,
    get api() {
      return connectNewsletterSignup(
        { state, send },
        identityNormalizer,
        options,
      );
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

import type { Behavior } from '../behavior.js';

/** What a share action shares. */
export interface ShareRequest {
  readonly url: string;
  readonly title?: string;
  readonly text?: string;
}

/**
 * A share service, framework-free: its label and how it shares. Renderers
 * may extend it with presentation (an icon, an accent colour).
 */
export interface ShareService {
  readonly label: string;
  /** The service's share page for a request, opened in a new window. */
  readonly createShareUrl?: (request: ShareRequest) => string;
  /** A host-owned share handler, used instead of a share URL. */
  readonly share?: (request: ShareRequest) => void | Promise<void>;
}

/** Share services by id. */
export type ShareServiceRegistry = Readonly<Record<string, ShareService>>;

function shareText({ text, title, url }: ShareRequest) {
  return [text ?? title, url].filter(Boolean).join('\n\n');
}

/**
 * Postkit's built-in share services: `native` (the system share sheet,
 * falling back to copying the link), `copy`, `email`, and the social
 * services with share URLs or labels.
 */
export const postkitShareServices: ShareServiceRegistry = Object.freeze({
  native: { label: 'Share' },
  copy: { label: 'Copy link' },
  email: { label: 'Email' },
  bluesky: {
    label: 'Bluesky',
    createShareUrl: (request: ShareRequest) =>
      `https://bsky.app/intent/compose?text=${encodeURIComponent(shareText(request))}`,
  },
  facebook: {
    label: 'Facebook',
    createShareUrl: ({ url }: ShareRequest) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
  instagram: { label: 'Instagram' },
  linegraph: { label: 'Linegraph' },
  linkedin: {
    label: 'LinkedIn',
    createShareUrl: ({ url }: ShareRequest) =>
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  },
  mastodon: { label: 'Mastodon' },
  medium: { label: 'Medium' },
  threads: {
    label: 'Threads',
    createShareUrl: (request: ShareRequest) =>
      `https://www.threads.net/intent/post?text=${encodeURIComponent(shareText(request))}`,
  },
  tiktok: { label: 'TikTok' },
  x: {
    label: 'X',
    createShareUrl: ({ text, title, url }: ShareRequest) => {
      const query = new URLSearchParams({
        url,
        ...((text ?? title) ? { text: text ?? title ?? '' } : {}),
      });
      return `https://x.com/intent/post?${query.toString()}`;
    },
  },
  youtube: { label: 'YouTube' },
});

/** The services a share actions block shows when none are given. */
export const postkitDefaultShareServiceIds = Object.freeze([
  'native',
  'copy',
  'email',
] as const);

/** The status after copying the link. */
export const shareActionsCopiedMessage = 'Link copied.';

/** The share actions' state: the last status message. */
export interface ShareActionsState {
  readonly status: string;
}

/** Events the share actions machine accepts. */
export type ShareActionsEvent = {
  readonly type: 'REPORT';
  readonly status: string;
};

/** The state share actions start in. */
export function shareActionsInitialState(): ShareActionsState {
  return { status: '' };
}

/** The share actions machine as a pure function: `REPORT` sets the status. */
export function shareActionsTransition(
  state: ShareActionsState,
  event: ShareActionsEvent,
): ShareActionsState {
  return event.type === 'REPORT' && event.status !== state.status
    ? { status: event.status }
    : state;
}

/** The browser features sharing uses; defaults to the global ones. */
export interface ShareEnvironment {
  readonly navigator?: Pick<Navigator, 'share' | 'clipboard'>;
  readonly window?: Pick<Window, 'open' | 'location'>;
}

function isAbort(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    error.name === 'AbortError'
  );
}

/** Options for {@link shareWithService}. */
export interface ShareWithServiceOptions {
  readonly services?: ShareServiceRegistry;
  readonly environment?: ShareEnvironment;
  /** Called after a share that didn't fail. */
  readonly onShare?: (service: string, request: ShareRequest) => void;
}

/**
 * Shares `request` with one service and returns the status to show, or
 * `undefined` when the reader cancelled the system share sheet.
 *
 * - `native` opens the system share sheet, or copies the link where there
 *   is none ("Link copied.").
 * - `copy` copies the link ("Link copied.").
 * - `email` opens a `mailto:` link.
 * - Other services use their `share` handler, else open their share URL.
 *
 * Any other service, or a failure, reports why sharing is unavailable.
 */
export async function shareWithService(
  serviceId: string,
  request: ShareRequest,
  options: ShareWithServiceOptions = {},
): Promise<string | undefined> {
  const service = (options.services ?? postkitShareServices)[serviceId];
  const label = service?.label ?? serviceId;
  const nav =
    options.environment?.navigator ??
    (typeof navigator === 'undefined' ? undefined : navigator);
  const win =
    options.environment?.window ??
    (typeof window === 'undefined' ? undefined : window);
  try {
    let status = `Opened ${label}.`;
    if (serviceId === 'native' && typeof nav?.share === 'function') {
      await nav.share(request);
    } else if (serviceId === 'native' || serviceId === 'copy') {
      if (typeof nav?.clipboard?.writeText !== 'function') {
        throw new Error('Clipboard access is unavailable.');
      }
      await nav.clipboard.writeText(request.url);
      status = shareActionsCopiedMessage;
    } else if (serviceId === 'email' && win) {
      const subject = request.title ?? request.text ?? '';
      const body = [request.text, request.url].filter(Boolean).join('\n\n');
      win.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    } else if (service?.share) {
      await service.share(request);
    } else if (service?.createShareUrl && win) {
      win.open(
        service.createShareUrl(request),
        '_blank',
        'noopener,noreferrer',
      );
    } else {
      throw new Error(`${label} sharing is unavailable.`);
    }
    options.onShare?.(serviceId, request);
    return status;
  } catch (error) {
    if (isAbort(error)) return undefined;
    return error instanceof Error ? error.message : 'Sharing is unavailable.';
  }
}

/** The current state and a way to send events, from any host. */
export interface ShareActionsService {
  readonly state: ShareActionsState;
  send(event: ShareActionsEvent): void;
}

/**
 * A prop normalizer, as Zag's: `@zag-js/react`'s `normalizeProps` for React,
 * or `normalizeProps` from this module for the DOM.
 */
export interface ShareActionsNormalizer<Button, Element> {
  button(props: Record<string, unknown>): Button;
  element(props: Record<string, unknown>): Element;
}

/** What is shared and how, for {@link connectShareActions}. */
export interface ShareActionsContext extends ShareRequest {
  /**
   * The heading shown above the actions. Renderers name the group of actions
   * with it; each action is named by its own visible label (WCAG 2.5.3).
   */
  readonly label: string;
  /** Defaults to {@link postkitShareServices}. */
  readonly services?: ShareServiceRegistry;
  readonly environment?: ShareEnvironment;
  readonly onShare?: (service: string, request: ShareRequest) => void;
}

/** What a renderer reads to draw share actions. */
export interface ShareActionsApi<
  Button = Record<string, unknown>,
  Element = Record<string, unknown>,
> {
  /** The last status: "Link copied.", "Opened X." or why sharing failed. */
  readonly status: string;
  /** A service's label, or its id when the registry doesn't know it. */
  serviceLabel(serviceId: string): string;
  /** Shares with a service, as its action does. */
  share(serviceId: string): Promise<void>;
  /**
   * A service's action button. It has no `aria-label`: the button's visible
   * service label is its accessible name, so speech-input users can say what
   * they see (WCAG 2.5.3).
   */
  getActionProps(serviceId: string): Button;
  /** The status line, announced politely. */
  getStatusProps(): Element;
}

/** Connects share actions state to renderer props. */
export function connectShareActions<Button, Element>(
  service: ShareActionsService,
  normalize: ShareActionsNormalizer<Button, Element>,
  context: ShareActionsContext,
): ShareActionsApi<Button, Element> {
  const { state, send } = service;
  const services = context.services ?? postkitShareServices;
  const request: ShareRequest = {
    url: context.url,
    title: context.title,
    text: context.text,
  };
  const serviceLabel = (serviceId: string) =>
    services[serviceId]?.label ?? serviceId;
  const share = async (serviceId: string) => {
    const status = await shareWithService(serviceId, request, {
      services,
      environment: context.environment,
      onShare: context.onShare,
    });
    if (status !== undefined) send({ type: 'REPORT', status });
  };
  return {
    status: state.status,
    serviceLabel,
    share,
    getActionProps: (serviceId) =>
      normalize.button({
        type: 'button',
        onClick(event: { defaultPrevented?: boolean }) {
          if (event?.defaultPrevented) return;
          void share(serviceId);
        },
      }),
    getStatusProps: () => normalize.element({ 'aria-live': 'polite' }),
  };
}

/** Merges a host's services over {@link postkitShareServices}. */
export function mergeShareServices<Service extends ShareService = ShareService>(
  overrides: Readonly<Record<string, Service>> = {},
): Readonly<Record<string, ShareService | Service>> {
  return Object.freeze({ ...postkitShareServices, ...overrides });
}

/** Options for {@link createShareActions}. */
export type ShareActionsBehaviorOptions = ShareActionsContext;

/** A running share actions behaviour. */
export interface ShareActionsBehavior extends Behavior<ShareActionsApi> {
  readonly state: ShareActionsState;
  send(event: ShareActionsEvent): void;
}

const identityNormalizer: ShareActionsNormalizer<
  Record<string, unknown>,
  Record<string, unknown>
> = {
  button: (props) => props,
  element: (props) => props,
};

/**
 * Creates the share actions behaviour without a UI framework. Plain
 * TypeScript, with no Zag dependency.
 */
export function createShareActions(
  options: ShareActionsBehaviorOptions,
): ShareActionsBehavior {
  let state = shareActionsInitialState();
  const listeners = new Set<() => void>();
  let running = false;
  const send = (event: ShareActionsEvent) => {
    const next = shareActionsTransition(state, event);
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
      return connectShareActions({ state, send }, identityNormalizer, options);
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

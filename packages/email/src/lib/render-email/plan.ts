import type {
  PostkitComponentNode,
  PostkitJsonValue,
  PostkitStaticViewOptions,
} from '@postkit/core';
import type {
  AnyPostkitComponentDefinition,
  PostkitEmailFallback,
} from '@postkit/core/components';

import type { PostkitEmailView } from '../email-views.js';

/** What the renderer knows: the views, the definitions, and the options. */
export interface EmailRenderContext {
  readonly views: Readonly<Record<string, PostkitEmailView>>;
  /** Prose overrides by element name (`h2`, `p`, `a`…), as in an MDX map. */
  readonly elements: Readonly<Record<string, PostkitEmailView>>;
  readonly definitions: ReadonlyMap<string, AnyPostkitComponentDefinition>;
  readonly baseUrl: string | undefined;
  /** The post on the web, for `link` fallbacks without a URL of their own. */
  readonly url: string | undefined;
  readonly staticOptions: PostkitStaticViewOptions;
}

/** How one component node renders in email. */
export type EmailComponentPlan =
  | {
      readonly kind: 'view';
      readonly view: PostkitEmailView;
      readonly props: Record<string, unknown>;
    }
  | {
      readonly kind: 'fallback';
      readonly fallback: PostkitEmailFallback;
      /** Whether the definition declared it (else `text` is assumed). */
      readonly declared: boolean;
      readonly props: Record<string, unknown>;
      /** For `link`: where it points. */
      readonly href?: string;
      /** For `link`: the link text. */
      readonly label?: string;
    }
  | { readonly kind: 'unknown' };

const urlProp = /^(?:href|src|url|image|poster)$|(?:Href|Src|Url)$/;

/**
 * An absolute, email-safe URL: relative URLs resolve against `baseUrl` (a
 * mail client has no base URL), fragments stay, and other protocols are
 * dropped.
 */
export function resolveEmailUrl(
  value: unknown,
  baseUrl: string | undefined,
): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (trimmed.startsWith('#')) return trimmed;
  try {
    const url = baseUrl ? new URL(trimmed, baseUrl) : new URL(trimmed);
    return ['http:', 'https:', 'mailto:', 'tel:'].includes(url.protocol)
      ? url.href
      : undefined;
  } catch {
    return undefined;
  }
}

function coerce(
  kind: string | undefined,
  value: PostkitJsonValue | undefined,
): unknown {
  switch (kind) {
    case 'json':
      if (typeof value !== 'string') return value;
      try {
        return JSON.parse(value) as unknown;
      } catch {
        return undefined;
      }
    case 'number': {
      const parsed =
        typeof value === 'string' && value.trim() !== ''
          ? Number(value)
          : value;
      return typeof parsed === 'number' && Number.isFinite(parsed)
        ? parsed
        : undefined;
    }
    case 'boolean':
      return value === true || value === '' || value === 'true';
    default:
      return typeof value === 'number' ? String(value) : value;
  }
}

/**
 * A node's props as a view takes them: typed by its definition (directive
 * text parsed), the definition's defaults filled in, and URLs made absolute.
 */
export function emailViewProps(
  node: PostkitComponentNode,
  definition: AnyPostkitComponentDefinition | undefined,
  baseUrl: string | undefined,
): Record<string, unknown> {
  const props: Record<string, unknown> = {};
  for (const [name, value] of Object.entries(node.props ?? {})) {
    const kind = definition?.props[name]?.kind;
    const coerced = definition ? coerce(kind, value) : value;
    if (coerced === undefined) continue;
    props[name] =
      typeof coerced === 'string' && urlProp.test(name)
        ? (resolveEmailUrl(coerced, baseUrl) ?? coerced)
        : coerced;
  }
  for (const [name, prop] of Object.entries(definition?.props ?? {})) {
    if (props[name] === undefined && prop.default !== undefined) {
      props[name] = structuredClone(prop.default);
    }
  }
  return props;
}

function words(name: string): string {
  return name.replace(/([a-z0-9])([A-Z])/g, '$1 $2').toLowerCase();
}

function text(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

/** Decides how a component renders: its view, its fallback, or its content. */
export function planEmailComponent(
  node: PostkitComponentNode,
  context: EmailRenderContext,
): EmailComponentPlan {
  const definition = context.definitions.get(node.name);
  const view = Object.hasOwn(context.views, node.name)
    ? context.views[node.name]
    : undefined;
  if (view) {
    return {
      kind: 'view',
      view,
      props: emailViewProps(node, definition, context.baseUrl),
    };
  }
  if (!definition) return { kind: 'unknown' };
  const props = emailViewProps(node, definition, context.baseUrl);
  const declared = definition.email?.fallback;
  if (declared === 'link') {
    const href =
      resolveEmailUrl(props['href'], context.baseUrl) ??
      resolveEmailUrl(props['url'], context.baseUrl) ??
      resolveEmailUrl(context.url, context.baseUrl);
    if (href) {
      return {
        kind: 'fallback',
        fallback: 'link',
        declared: true,
        props,
        href,
        label:
          text(props['title']) ??
          text(props['question']) ??
          `View this ${words(definition.name)} on the web`,
      };
    }
    // Nowhere to link to: its static text is the next best thing.
    return { kind: 'fallback', fallback: 'text', declared: true, props };
  }
  return {
    kind: 'fallback',
    fallback: declared ?? 'text',
    declared: declared !== undefined,
    props,
  };
}

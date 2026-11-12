/** @internal Escapes text for HTML element content. */
export function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

const safeSchemes = new Set(['http', 'https', 'mailto']);

/**
 * @internal Resolves a relative URL against `baseUrl`. Absolute and
 * fragment-only URLs, and URLs without a base, are returned unchanged.
 */
export function resolvePostkitUrl(
  value: string,
  baseUrl: string | undefined,
): string {
  if (!baseUrl || value.startsWith('#') || /^[a-z][a-z0-9+.-]*:/i.test(value)) {
    return value;
  }
  try {
    return new URL(value, baseUrl).href;
  } catch {
    return value;
  }
}

/**
 * @internal A URL from component props, when it is safe to emit: http, https,
 * mailto or relative. Control characters and whitespace can't hide a scheme
 * (`java\tscript:`). Returns the URL resolved against `baseUrl`, or
 * `undefined` when it's unsafe.
 */
export function safePostkitUrl(
  value: string,
  baseUrl?: string,
): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const normalized = [...trimmed]
    .filter((character) => character.charCodeAt(0) > 0x20)
    .join('')
    .toLowerCase();
  const scheme = normalized.match(/^([a-z][a-z0-9+.-]*):/)?.[1];
  if (scheme && !safeSchemes.has(scheme)) return undefined;
  return resolvePostkitUrl(trimmed, baseUrl);
}

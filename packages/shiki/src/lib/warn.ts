/** Shiki's built-in plain-text languages, which need no grammar. */
export const plainLanguages = new Set([
  'text',
  'plaintext',
  'txt',
  'plain',
  'ansi',
]);

declare const process: { readonly env: Record<string, string | undefined> };

function isDevelopment(): boolean {
  try {
    return process.env['NODE_ENV'] !== 'production';
  } catch {
    return false;
  }
}

const warned = new Set<string>();

export function warnOnce(key: string, message: string, error?: unknown) {
  if (warned.has(key) || !isDevelopment()) return;
  warned.add(key);
  // Development-only guidance; production builds stay silent.
  console.warn(`[@postkit/shiki] ${message}`, ...(error ? [error] : []));
}

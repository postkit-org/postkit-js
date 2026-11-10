/**
 * Rewrites the address bar without a navigation (`history.replaceState`), keeping the Next
 * router's own history entry state so Back and Forward still work. Used to drop `token`
 * (unsubscribe) and `?status=confirmed#for=…` (subscribe) once they've been read.
 */
export function replaceUrl(url: string): void {
  if (typeof window === 'undefined') return;
  const state: unknown = window.history.state;
  const nextState =
    state && typeof state === 'object'
      ? { ...(state as Record<string, unknown>), url, as: url }
      : state;
  window.history.replaceState(nextState, '', url);
}

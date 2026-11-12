import type {
  LinkResolverCallback,
  ResolvedLinkPreview,
} from '@postkit/unfurl';
import { useEffect, useState } from 'react';

/** Where a runtime link resolution stands. */
export type PostkitLinkResolutionStatus =
  'error' | 'idle' | 'loading' | 'resolved';

/** The result of {@link usePostkitLinkResolution}. */
export interface PostkitLinkResolution {
  readonly status: PostkitLinkResolutionStatus;
  readonly metadata?: ResolvedLinkPreview;
}

/**
 * Resolves `href` with `resolveLink` after mount, as `@postkit/chakra`'s
 * `LinkPreview` and `SocialPost` do with their provider's resolver: nothing
 * runs while `enabled` is false or there is no resolver, a change of `href` or
 * `provider` starts over, and unmounting aborts the request.
 *
 * @internal
 */
export function usePostkitLinkResolution(
  href: string,
  provider: string | undefined,
  resolveLink: LinkResolverCallback | undefined,
  enabled: boolean,
): PostkitLinkResolution {
  const key = `${provider ?? ''}\u0000${href}`;
  const [resolution, setResolution] = useState<
    PostkitLinkResolution & { readonly key: string }
  >({ key, status: 'idle' });

  useEffect(() => {
    if (!enabled || !resolveLink) return;
    const controller = new AbortController();
    let active = true;
    setResolution({ key, status: 'loading' });
    void resolveLink(href, { provider, signal: controller.signal }).then(
      (metadata) => {
        if (active) setResolution({ key, status: 'resolved', metadata });
      },
      () => {
        if (active && !controller.signal.aborted) {
          setResolution({ key, status: 'error' });
        }
      },
    );
    return () => {
      active = false;
      controller.abort();
    };
  }, [enabled, href, key, provider, resolveLink]);

  return resolution.key === key
    ? { status: resolution.status, metadata: resolution.metadata }
    : { status: 'idle' };
}

import type { ReactNode } from 'react';

export interface PostkitShareRequest {
  readonly url: string;
  readonly title?: string;
  readonly text?: string;
}

export interface PostkitSocialService {
  readonly label: string;
  readonly icon?: ReactNode;
  /**
   * Text colour for the service's label. Use a mode-aware semantic token
   * (`blue.fg`, `fg`) so the label keeps 4.5:1 in light and dark.
   */
  readonly accent?: string;
  readonly createShareUrl?: (request: PostkitShareRequest) => string;
  readonly share?: (request: PostkitShareRequest) => void | Promise<void>;
}

export type PostkitSocialServiceRegistry = Readonly<
  Record<string, PostkitSocialService>
>;

function shareText({ text, title, url }: PostkitShareRequest) {
  return [text ?? title, url].filter(Boolean).join('\n\n');
}

export const postkitDefaultSocialServices: PostkitSocialServiceRegistry =
  Object.freeze({
    native: { label: 'Share' },
    copy: { label: 'Copy link' },
    email: { label: 'Email' },
    bluesky: {
      label: 'Bluesky',
      accent: 'blue.fg',
      createShareUrl: (request) =>
        `https://bsky.app/intent/compose?text=${encodeURIComponent(shareText(request))}`,
    },
    facebook: {
      label: 'Facebook',
      accent: 'blue.fg',
      createShareUrl: ({ url }) =>
        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    },
    instagram: { label: 'Instagram', accent: 'pink.fg' },
    linegraph: { label: 'Linegraph', accent: 'purple.fg' },
    linkedin: {
      label: 'LinkedIn',
      accent: 'blue.fg',
      createShareUrl: ({ url }) =>
        `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    },
    mastodon: { label: 'Mastodon', accent: 'purple.fg' },
    medium: { label: 'Medium', accent: 'fg' },
    threads: {
      label: 'Threads',
      accent: 'fg',
      createShareUrl: (request) =>
        `https://www.threads.net/intent/post?text=${encodeURIComponent(shareText(request))}`,
    },
    tiktok: { label: 'TikTok', accent: 'fg' },
    x: {
      label: 'X',
      accent: 'fg',
      createShareUrl: ({ text, title, url }) => {
        const query = new URLSearchParams({
          url,
          ...((text ?? title) ? { text: text ?? title ?? '' } : {}),
        });
        return `https://x.com/intent/post?${query.toString()}`;
      },
    },
    youtube: { label: 'YouTube', accent: 'red.fg' },
  });

export function mergePostkitSocialServices(
  overrides: PostkitSocialServiceRegistry = {},
): PostkitSocialServiceRegistry {
  return Object.freeze({
    ...postkitDefaultSocialServices,
    ...overrides,
  });
}

import { Fragment } from 'react';

import { followReleaseLinks } from '../changelog/release-links';
import { TextLink } from '../legal/text-link';

export interface FeedLink {
  readonly label: string;
  readonly href: string;
  /** The feed's media type, for the link's `type` attribute. */
  readonly type?: string;
}

/**
 * The changelog feeds, the feed version of the release emails: the newsletter pages offer them
 * as the alternative ("Prefer a feed?", "Or subscribe with …").
 */
export const releaseFeeds: readonly FeedLink[] = followReleaseLinks.filter(
  (link) => link.href.startsWith('/feeds/'),
);

/** "RSS, Atom or JSON Feed": in-copy links joined as a sentence, ending in a full stop. */
export function FeedLinks({ feeds }: { readonly feeds: readonly FeedLink[] }) {
  return (
    <>
      {feeds.map((feed, index) => (
        <Fragment key={feed.href}>
          <TextLink href={feed.href} type={feed.type} borderRadius="xs">
            {feed.label}
          </TextLink>
          {index === feeds.length - 2
            ? ' or '
            : index < feeds.length - 2
              ? ', '
              : '.'}
        </Fragment>
      ))}
    </>
  );
}

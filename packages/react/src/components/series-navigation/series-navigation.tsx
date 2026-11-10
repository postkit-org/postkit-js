import {
  seriesNavigationDefinition,
  type PostkitSlotOf,
} from '@postkit/core/components';

import { postkitView, type PostkitViewProps } from '../../lib/view.js';

/** A neighbouring article in a series. */
export interface SeriesLink {
  readonly title: string;
  readonly href: string;
}

export type SeriesNavigationSlot = PostkitSlotOf<
  typeof seriesNavigationDefinition
>;
export type SeriesNavigationProps = Omit<
  PostkitViewProps<typeof seriesNavigationDefinition>,
  'current' | 'total' | 'previous' | 'next'
> & {
  /** The current article position. Numeric strings are accepted. */
  readonly current?: number | string;
  /** The number of articles in the series. Numeric strings are accepted. */
  readonly total?: number | string;
  /** The previous article, or its JSON object text. */
  readonly previous?: SeriesLink | string;
  /** The next article, or its JSON object text. */
  readonly next?: SeriesLink | string;
};

/**
 * A series link as given, or authored JSON text parsed into one. An empty
 * string is no link. Throws a `TypeError` for invalid JSON.
 */
export function postkitSeriesLink(
  value?: SeriesLink | string,
): SeriesLink | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== 'string') return value;
  if (!value) return undefined;
  try {
    return JSON.parse(value) as SeriesLink;
  } catch {
    throw new TypeError(
      'Postkit SeriesNavigation links must contain valid JSON.',
    );
  }
}

/** Previous and next navigation for a named article series: headless markup only. */
export const SeriesNavigation = postkitView<
  typeof seriesNavigationDefinition,
  SeriesNavigationProps
>(seriesNavigationDefinition, ({ props, part }) => {
  const { title, current, total } = props;
  const renderLink = (
    link: SeriesLink | undefined,
    direction: 'Previous' | 'Next',
  ) =>
    link ? (
      <a
        {...part('link')}
        href={link.href}
        rel={direction === 'Previous' ? 'prev' : 'next'}
      >
        <span {...part('direction')}>{direction}</span>
        <span {...part('linkTitle')}>{link.title}</span>
      </a>
    ) : (
      <span />
    );
  return (
    <nav aria-label={`${title} series navigation`} {...part('root')}>
      <div {...part('header')}>
        <p {...part('title')}>{title}</p>
        {current && total ? (
          <p {...part('position')}>
            {current} of {total}
          </p>
        ) : null}
      </div>
      <div {...part('links')}>
        {renderLink(postkitSeriesLink(props.previous), 'Previous')}
        {renderLink(postkitSeriesLink(props.next), 'Next')}
      </div>
    </nav>
  );
});

import {
  appearsOnDefinition,
  type PostkitSlotOf,
} from '@postkit/core/components';
import type { ReactNode } from 'react';

import { parseJsonProp } from '../../lib/json-props.js';
import { postkitView, type PostkitViewProps } from '../../lib/view.js';

/** One place the post was syndicated to. */
export interface SyndicationReference {
  readonly service: string;
  readonly url: string;
  readonly label?: string;
  readonly publishedAt?: string;
  readonly externalId?: string;
  readonly status?: 'failed' | 'pending' | 'published' | 'removed';
}

/** How a service id is shown: its label and an optional icon. */
export interface AppearsOnService {
  readonly label: string;
  readonly icon?: ReactNode;
}

export type AppearsOnSlot = PostkitSlotOf<typeof appearsOnDefinition>;

export type AppearsOnProps = Omit<
  PostkitViewProps<typeof appearsOnDefinition>,
  'items'
> & {
  /** The destinations, as an array or a JSON array string. */
  readonly items: string | readonly SyndicationReference[];
  /** Labels and icons by service id. A service without one shows its id. */
  readonly services?: Readonly<Record<string, AppearsOnService>>;
};

function displayDate(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.valueOf())
    ? value
    : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date);
}

/**
 * Where the post was syndicated: a labelled list of destination links, with
 * optional dates and a status for anything not yet published. Headless markup
 * only.
 */
export const AppearsOn = postkitView<
  typeof appearsOnDefinition,
  AppearsOnProps
>(appearsOnDefinition, ({ props, part }) => {
  const items = parseJsonProp<SyndicationReference>(
    props.items,
    'AppearsOn items',
  );
  const datesVisible =
    props.showDates === true || String(props.showDates) === 'true';

  return (
    <aside {...part('root')}>
      <p {...part('label')}>{props.label}</p>
      <ul {...part('list')} aria-label={props.label}>
        {items.map((item, index) => {
          const service = props.services?.[item.service];
          const itemLabel = item.label ?? service?.label ?? item.service;
          const date = datesVisible ? displayDate(item.publishedAt) : undefined;
          return (
            <li
              key={`${item.service}-${item.url}-${index}`}
              {...part('item')}
              data-postkit-service={item.service}
            >
              <a {...part('link')} href={item.url} rel="syndication">
                <span
                  {...part('icon')}
                  aria-hidden={service?.icon ? undefined : true}
                >
                  {service?.icon ?? itemLabel.slice(0, 1).toUpperCase()}
                </span>
                <span>{itemLabel}</span>
              </a>
              {date ? (
                <time {...part('date')} dateTime={item.publishedAt}>
                  {date}
                </time>
              ) : null}
              {item.status && item.status !== 'published' ? (
                <span {...part('status')}>{item.status}</span>
              ) : null}
            </li>
          );
        })}
      </ul>
    </aside>
  );
});

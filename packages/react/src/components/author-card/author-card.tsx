import {
  authorCardDefinition,
  type PostkitSlotOf,
} from '@postkit/core/components';

import { parseJsonProp } from '../../lib/json-props.js';
import { postkitView, type PostkitViewProps } from '../../lib/view.js';

/** A profile link shown on an author card. */
export interface AuthorLink {
  readonly label: string;
  readonly href: string;
  readonly rel?: string;
}

export type AuthorCardSlot = PostkitSlotOf<typeof authorCardDefinition>;

export type AuthorCardProps = Omit<
  PostkitViewProps<typeof authorCardDefinition>,
  'links'
> & {
  /** Profile links, as an array or a JSON array string. */
  readonly links?: string | readonly AuthorLink[];
};

/**
 * An author biography with a portrait (or an initial), name, role and profile
 * links. Children replace the plain-text `bio`. Headless markup only.
 */
export const AuthorCard = postkitView<
  typeof authorCardDefinition,
  AuthorCardProps
>(authorCardDefinition, ({ props, part }) => {
  const { name, href, role, bio, children } = props;
  const links = parseJsonProp<AuthorLink>(
    props.links ?? [],
    'AuthorCard links',
  );

  return (
    <aside aria-label={`About ${name}`} {...part('root')}>
      <span {...part('avatar')}>
        {props.avatarSrc ? (
          <img
            src={props.avatarSrc}
            alt={props.avatarAlt ?? ''}
            loading="lazy"
          />
        ) : (
          <span aria-hidden="true">
            {name.trim().slice(0, 1).toUpperCase()}
          </span>
        )}
      </span>
      <div {...part('content')}>
        <div {...part('header')}>
          <p {...part('name')}>
            {href ? (
              <a {...part('nameLink')} href={href} rel="author">
                {name}
              </a>
            ) : (
              name
            )}
          </p>
          {role ? <span {...part('role')}>{role}</span> : null}
        </div>
        {bio || children ? <div {...part('bio')}>{children ?? bio}</div> : null}
        {links.length ? (
          <ul {...part('links')} aria-label={`${name} links`}>
            {links.map((link) => (
              <li key={`${link.label}-${link.href}`}>
                <a {...part('link')} href={link.href} rel={link.rel}>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </aside>
  );
});

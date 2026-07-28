import {
  createElement,
  type AnchorHTMLAttributes,
  type ComponentType,
} from 'react';

export type PostkitLinkProps = AnchorHTMLAttributes<HTMLAnchorElement>;
export type PostkitLinkComponent = ComponentType<PostkitLinkProps>;
export type PostkitInternalHrefMatcher = (href: string) => boolean;

export interface PostkitLinkAdapter<TProps extends object> {
  readonly component: ComponentType<TProps>;
  readonly mapProps: (
    props: PostkitLinkProps & { readonly href: string },
  ) => TProps;
}

export interface CreatePostkitLinkOptions<
  TProps extends object = PostkitLinkProps,
> {
  readonly adapter?: PostkitLinkAdapter<TProps>;
  readonly externalComponent?: PostkitLinkComponent;
  readonly isInternal?: PostkitInternalHrefMatcher;
  readonly openExternalInNewTab?: boolean;
}

const URI_SCHEME = /^[a-z][a-z\d+.-]*:/i;
const EXTERNAL_WEB_HREF = /^(?:https?:)?\/\//i;

export function isPostkitInternalHref(href: string): boolean {
  const value = href.trim();

  if (
    value.length === 0 ||
    value.startsWith('#') ||
    value.startsWith('//') ||
    URI_SCHEME.test(value)
  ) {
    return false;
  }

  return true;
}

function externalAnchorProps(
  props: PostkitLinkProps,
  openExternalInNewTab: boolean,
): PostkitLinkProps {
  if (
    !openExternalInNewTab ||
    props.target ||
    !props.href ||
    !EXTERNAL_WEB_HREF.test(props.href.trim())
  ) {
    return props;
  }

  const rel = new Set(
    (props.rel ?? '')
      .split(/\s+/)
      .map((value) => value.trim())
      .filter(Boolean),
  );
  rel.add('noopener');
  rel.add('noreferrer');

  return {
    ...props,
    target: '_blank',
    rel: [...rel].join(' '),
  };
}

export function createPostkitLink<TProps extends object = PostkitLinkProps>(
  options: CreatePostkitLinkOptions<TProps> = {},
): PostkitLinkComponent {
  const {
    adapter,
    externalComponent,
    isInternal = isPostkitInternalHref,
    openExternalInNewTab = false,
  } = options;

  function PostkitLink(props: PostkitLinkProps) {
    const { href } = props;
    const usesNativeNavigation =
      !href ||
      !adapter ||
      !isInternal(href) ||
      props.download !== undefined ||
      (props.target !== undefined && props.target !== '_self');

    if (usesNativeNavigation) {
      const anchorProps = externalAnchorProps(props, openExternalInNewTab);
      return externalComponent
        ? createElement(externalComponent, anchorProps)
        : createElement('a', anchorProps);
    }

    return createElement(
      adapter.component,
      adapter.mapProps({
        ...props,
        href,
      }),
    );
  }

  PostkitLink.displayName = 'PostkitLink';
  return PostkitLink;
}

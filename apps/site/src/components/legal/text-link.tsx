import { chakra, type HTMLChakraProps } from '@chakra-ui/react';
import NextLink from 'next/link';

export interface TextLinkProps extends Omit<HTMLChakraProps<'a'>, 'href'> {
  readonly href: string;
  /**
   * `copy` (default): an in-copy link in `accent`, underlined 1px, 2px on hover (02 §6).
   * `plain`: a quiet link in the text colour (feeds, "Components ›"), colour-only hover.
   */
  readonly variant?: 'copy' | 'plain';
}

const hover = (styles: Record<string, unknown>) => ({
  transitionProperty: 'color, text-decoration-thickness',
  transitionDuration: 'hover',
  transitionTimingFunction: 'ease-out',
  '@media (hover: hover)': { _hover: styles },
});

const variants = {
  copy: {
    color: 'accent',
    textDecorationLine: 'underline',
    textDecorationThickness: '1px',
    textUnderlineOffset: '3px',
    ...hover({ textDecorationThickness: '2px' }),
  },
  plain: {
    color: 'fg',
    textDecorationLine: 'none',
    ...hover({ color: 'fg.muted' }),
  },
} as const;

/**
 * A text link. Site routes that exist as pages go through `next/link`; everything else
 * (other sites, `mailto:`, build-time files such as feeds) is a plain anchor.
 */
export function TextLink({
  href,
  variant = 'copy',
  children,
  ...props
}: TextLinkProps) {
  const css = variants[variant];
  const isPage =
    href.startsWith('/') &&
    !href.startsWith('/feeds/') &&
    !href.startsWith('/newsletter/');

  if (isPage) {
    return (
      <chakra.a asChild css={css} {...props}>
        <NextLink href={href}>{children}</NextLink>
      </chakra.a>
    );
  }
  return (
    <chakra.a href={href} css={css} {...props}>
      {children}
    </chakra.a>
  );
}

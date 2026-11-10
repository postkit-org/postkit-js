import { Box, chakra, type HTMLChakraProps } from '@chakra-ui/react';
import { gradients } from '@postkit/site-theme';
import NextLink from 'next/link';

export interface LogoProps extends Omit<HTMLChakraProps<'a'>, 'href'> {
  /** Where the logo links. Defaults to the home page. */
  readonly href?: string;
}

/**
 * The gradient pill and "Postkit" (02 §1, "One mark"). The pill is decorative;
 * the word is the link's accessible name.
 */
export function Logo({ href = '/', ...props }: LogoProps) {
  return (
    <chakra.a
      asChild
      display="inline-flex"
      alignItems="center"
      gap="9px"
      color="fg"
      fontSize="18px"
      fontWeight="medium"
      letterSpacing="-0.02em"
      textDecoration="none"
      {...props}
    >
      <NextLink href={href}>
        <LogoPill />
        Postkit
      </NextLink>
    </chakra.a>
  );
}

/** The pill alone (30×16 at the default size). */
export function LogoPill({
  width = '30px',
  height = '16px',
}: {
  width?: string;
  height?: string;
}) {
  return (
    <Box
      as="span"
      aria-hidden="true"
      flexShrink="0"
      width={width}
      height={height}
      borderRadius="full"
      backgroundImage={gradients.logo}
    />
  );
}

import { Box } from '@chakra-ui/react';

/**
 * The ResultPage layout without its title block (04 §1b): what a newsletter page renders until
 * it knows which state to show, so the form never flashes before Confirmed or Expired. It
 * keeps roughly the result's height so the footer doesn't jump.
 */
export function ResultPlaceholder() {
  return (
    <Box
      aria-hidden="true"
      maxW="calc(720px + 2 * {spacing.gutter})"
      marginInline="auto"
      paddingInline="gutter"
      paddingTop="120px"
      paddingBottom="section"
      minHeight={{ base: '520px', md: '560px' }}
    />
  );
}

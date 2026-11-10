import { Box, Flex, Text } from '@chakra-ui/react';
import type { ReactNode } from 'react';

import { TwoToneHeading } from './two-tone-heading';

export interface ResultPageProps {
  /** The mono label above the title: "404", "Subscribed", "Link expired". */
  readonly label: ReactNode;
  /** The statement half of the title: "Nothing here." */
  readonly title: ReactNode;
  /** The grey half of the title: "It moved, or it never was." Required: result titles are always two-tone. */
  readonly quiet: ReactNode;
  /** The title's measure. Defaults to `18ch`; the 404 board uses `16ch`. */
  readonly titleMaxW?: string;
  /** One or two sentences under the title. */
  readonly lede?: ReactNode;
  /** Free content between the lede and the actions, e.g. the 404 callout and search field. */
  readonly children?: ReactNode;
  /** Buttons or links, centred in a wrapping row 12px apart. */
  readonly actions?: ReactNode;
  /** A small muted line at the end: "Prefer a feed? RSS, Atom or JSON Feed." */
  readonly footnote?: ReactNode;
}

/**
 * A centred result page (02 §5; boards SiteConfirmed, SiteConfirmExpired, SiteUnsubscribed,
 * SiteNotFound): mono label, two-tone `h1`, lede, then actions. Renders inside the shell's
 * `<main>`; it doesn't set page meta.
 */
export function ResultPage({
  label,
  title,
  quiet,
  titleMaxW = '18ch',
  lede,
  children,
  actions,
  footnote,
}: ResultPageProps) {
  return (
    <Box
      // The boards' 720px column, inside the 24px gutters.
      maxW="calc(720px + 2 * {spacing.gutter})"
      marginInline="auto"
      paddingInline="gutter"
      paddingTop="120px"
      paddingBottom="section"
      textAlign="center"
    >
      <Text fontFamily="mono" fontSize="14px" color="fg.muted" margin="0">
        {label}
      </Text>
      <TwoToneHeading
        as="h1"
        textStyle="pageTitle"
        title={title}
        quiet={quiet}
        maxW={titleMaxW}
        marginInline="auto"
        marginTop="16px"
      />
      {lede ? (
        <Text
          marginInline="auto"
          marginTop="28px"
          maxW="30em"
          fontSize="lg"
          lineHeight="1.55"
          color="fg.secondary"
        >
          {lede}
        </Text>
      ) : null}
      {children ? <Box marginTop="48px">{children}</Box> : null}
      {actions ? (
        <Flex
          marginTop={children ? '32px' : '36px'}
          wrap="wrap"
          justify="center"
          gap="12px"
        >
          {actions}
        </Flex>
      ) : null}
      {footnote ? (
        <Text
          marginInline="auto"
          marginTop="40px"
          maxW="32em"
          fontSize="md"
          color="fg.muted"
        >
          {footnote}
        </Text>
      ) : null}
    </Box>
  );
}

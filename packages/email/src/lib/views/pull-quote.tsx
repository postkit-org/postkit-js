import { Section, Text, type ChakraEmailStyleProps } from '@chakra-email/core';

import { usePostkitEmailGrays } from '../theme.js';
import { emailText } from './values.js';

export interface PullQuoteProps {
  readonly quote: string;
  readonly attribution?: string;
  readonly cite?: string;
  readonly rootStyles?: ChakraEmailStyleProps;
}

/** A large quotation with a rule on its left and an optional attribution. */
export function PullQuote({
  quote,
  attribution,
  cite,
  rootStyles,
}: PullQuoteProps) {
  const gray = usePostkitEmailGrays();
  const who = emailText(attribution);
  const source = emailText(cite);
  return (
    <Section
      data-postkit-component="PullQuote"
      // A literal shorthand, as in Callout: Chakra Email passes it through.
      borderLeft={`4px solid ${gray[900]}`}
      pl={5}
      py={1}
      mb={4}
      {...rootStyles}
    >
      <Text
        as="div"
        color={gray[900]}
        fontSize="xl"
        lineHeight="1.4"
        mb={who || source ? 2 : 0}
        style={{ fontStyle: 'italic' }}
      >
        <blockquote style={{ margin: 0 }}>{quote}</blockquote>
      </Text>
      {who || source ? (
        <Text color={gray[600]} fontSize="sm" mb={0}>
          {'— '}
          {who}
          {who && source ? ', ' : null}
          {source ? <cite>{source}</cite> : null}
        </Text>
      ) : null}
    </Section>
  );
}

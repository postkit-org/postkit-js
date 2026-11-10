import { Section, Text, type ChakraEmailStyleProps } from '@chakra-email/core';

import { usePostkitEmailGrays } from '../theme.js';
import { emailText } from './values.js';

export interface StatProps {
  readonly value: string;
  readonly label: string;
  readonly trend?: string;
  readonly description?: string;
  readonly rootStyles?: ChakraEmailStyleProps;
}

/** One figure: its label, the value in large type, and an optional trend. */
export function Stat({
  value,
  label,
  trend,
  description,
  rootStyles,
}: StatProps) {
  const gray = usePostkitEmailGrays();
  const change = emailText(trend);
  const detail = emailText(description);
  return (
    <Section
      data-postkit-component="Stat"
      border={`1px solid ${gray[200]}`}
      rounded="lg"
      p={5}
      mb={4}
      {...rootStyles}
    >
      <Text color={gray[600]} fontSize="sm" mb={1}>
        {label}
      </Text>
      <Text
        color={gray[900]}
        fontSize="4xl"
        fontWeight="bold"
        lineHeight="1.1"
        mb={change || detail ? 2 : 0}
      >
        {value}
      </Text>
      {change ? (
        <Text
          color={gray[700]}
          fontSize="sm"
          fontWeight="bold"
          mb={detail ? 1 : 0}
        >
          {change}
        </Text>
      ) : null}
      {detail ? (
        <Text color={gray[700]} fontSize="sm" mb={0}>
          {detail}
        </Text>
      ) : null}
    </Section>
  );
}

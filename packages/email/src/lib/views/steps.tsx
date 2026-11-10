import {
  Column,
  Row,
  Text,
  type ChakraEmailStyleProps,
} from '@chakra-email/core';

import { usePostkitEmailGrays } from '../theme.js';
import { emailField, emailList, emailText } from './values.js';

export interface StepsProps {
  /**
   * Steps as `{ title, description }` records (or strings), as an array or
   * the directive's JSON text.
   */
  readonly items: readonly unknown[] | string;
  readonly rootStyles?: ChakraEmailStyleProps;
}

/**
 * An ordered sequence: a table row per step, with the number in a fixed
 * column so it lines up in every client (no CSS counters or list markers).
 */
export function Steps({ items, rootStyles }: StepsProps) {
  const gray = usePostkitEmailGrays();
  const steps = emailList(items).flatMap((item) => {
    const title = emailText(item) ?? emailField(item, 'title', 'label');
    const description = emailField(item, 'description', 'text');
    return title || description ? [{ title, description }] : [];
  });
  if (!steps.length) return null;
  return (
    <table
      role="presentation"
      data-postkit-component="Steps"
      cellSpacing={0}
      cellPadding={0}
      border={0}
      width="100%"
      style={{
        width: '100%',
        borderCollapse: 'collapse',
        marginBottom: 16,
        ...rootStyles?.style,
      }}
    >
      <tbody>
        {steps.map((step, index) => (
          <Row key={index}>
            <Column width="40px" pt={index ? 3 : 0}>
              <Text
                as="div"
                w="28px"
                h="28px"
                rounded="full"
                bg={gray[900]}
                color="white"
                fontSize="sm"
                fontWeight="bold"
                lineHeight="28px"
                textAlign="center"
                mb={0}
              >
                {index + 1}
              </Text>
            </Column>
            <Column pt={index ? 3 : 0}>
              {step.title ? (
                <Text
                  fontWeight="bold"
                  color={gray[900]}
                  lineHeight="28px"
                  mb={0}
                >
                  {step.title}
                </Text>
              ) : null}
              {step.description ? (
                <Text color={gray[700]} mb={0}>
                  {step.description}
                </Text>
              ) : null}
            </Column>
          </Row>
        ))}
      </tbody>
    </table>
  );
}

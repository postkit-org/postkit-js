import {
  List,
  ListItem,
  Section,
  Text,
  type ChakraEmailStyleProps,
} from '@chakra-email/core';
import type { ReactNode } from 'react';

import { usePostkitEmailGrays } from '../theme.js';
import { emailField, emailList, emailText } from './values.js';

export interface KeyTakeawayProps {
  /** Defaults to "Key takeaway", as in the definition. */
  readonly title?: string;
  readonly eyebrow?: string;
  /**
   * Points as strings or `{ title | text | label }` records, as an array or
   * the directive's JSON text.
   */
  readonly items?: readonly unknown[] | string;
  readonly children?: ReactNode;
  readonly rootStyles?: ChakraEmailStyleProps;
}

/** A summary box: eyebrow, title, the authored body and a list of points. */
export function KeyTakeaway({
  title = 'Key takeaway',
  eyebrow,
  items,
  children,
  rootStyles,
}: KeyTakeawayProps) {
  const gray = usePostkitEmailGrays();
  const points = emailList(items).flatMap((item) => {
    const text = emailText(item) ?? emailField(item, 'title', 'text', 'label');
    return text ? [text] : [];
  });
  const heading = emailText(title);
  const label = emailText(eyebrow);
  return (
    <Section
      data-postkit-component="KeyTakeaway"
      bg={gray[50]}
      border={`1px solid ${gray[200]}`}
      rounded="lg"
      p={5}
      mb={4}
      {...rootStyles}
    >
      {label ? (
        <Text
          color={gray[600]}
          fontSize="xs"
          fontWeight="bold"
          textTransform="uppercase"
          letterSpacing="0.06em"
          mb={1}
        >
          {label}
        </Text>
      ) : null}
      {heading ? (
        <Text fontWeight="bold" color={gray[900]} mb={2}>
          {heading}
        </Text>
      ) : null}
      {children ? (
        <Text as="div" color={gray[700]} mb={points.length ? 2 : 0}>
          {children}
        </Text>
      ) : null}
      {points.length ? (
        <List mb={0} color={gray[700]}>
          {points.map((point, index) => (
            <ListItem key={index} mb={index === points.length - 1 ? 0 : 1}>
              {point}
            </ListItem>
          ))}
        </List>
      ) : null}
    </Section>
  );
}

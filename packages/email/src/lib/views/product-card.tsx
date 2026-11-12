import {
  Button,
  Img,
  Link,
  Section,
  Text,
  type ChakraEmailStyleProps,
} from '@chakra-email/core';

import { usePostkitEmailGrays } from '../theme.js';
import { emailNumber, emailText } from './values.js';

export interface ProductCardProps {
  readonly title: string;
  readonly href: string;
  readonly description?: string;
  /** Defaults to "View product", as in the definition. */
  readonly actionLabel?: string;
  readonly imageSrc?: string;
  readonly imageAlt?: string;
  readonly price?: string;
  readonly rating?: number | string;
  readonly badge?: string;
  /** Defaults to `sponsored`, as in the definition. */
  readonly rel?: string;
  readonly rootStyles?: ChakraEmailStyleProps;
}

/**
 * A product: its image, badge, title, description, rating, price and a
 * button. The image and title link to the product too, since a button is the
 * only target some clients make easy to tap.
 */
export function ProductCard({
  title,
  href,
  description,
  actionLabel = 'View product',
  imageSrc,
  imageAlt,
  price,
  rating,
  badge,
  rel = 'sponsored',
  rootStyles,
}: ProductCardProps) {
  const gray = usePostkitEmailGrays();
  const image = emailText(imageSrc);
  const label = emailText(badge);
  const summary = emailText(description);
  const cost = emailText(price);
  const score = emailNumber(rating);
  const stars =
    score !== undefined
      ? Math.min(5, Math.max(0, Math.round(score)))
      : undefined;
  return (
    <Section
      data-postkit-component="ProductCard"
      border={`1px solid ${gray[200]}`}
      rounded="lg"
      p={5}
      mb={4}
      {...rootStyles}
    >
      {image ? (
        <Link href={href} rel={rel}>
          <Img
            src={image}
            alt={imageAlt ?? ''}
            width="100%"
            maxW="full"
            rounded="md"
            mb={4}
          />
        </Link>
      ) : null}
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
      <Text fontSize="lg" fontWeight="bold" mb={summary ? 1 : 2}>
        <Link href={href} rel={rel} color={gray[900]} textDecoration="none">
          {title}
        </Link>
      </Text>
      {summary ? (
        <Text color={gray[700]} mb={2}>
          {summary}
        </Text>
      ) : null}
      {stars !== undefined ? (
        <Text color={gray[700]} fontSize="sm" mb={2}>
          <span aria-hidden="true">
            {'★'.repeat(stars)}
            {'☆'.repeat(5 - stars)}
          </span>{' '}
          {score} out of 5
        </Text>
      ) : null}
      {cost ? (
        <Text color={gray[900]} fontWeight="bold" mb={3}>
          {cost}
        </Text>
      ) : null}
      <Button href={href} rel={rel}>
        {emailText(actionLabel) ?? title}
      </Button>
    </Section>
  );
}

import {
  Column,
  Img,
  Link,
  Row,
  Text,
  type ChakraEmailStyleProps,
} from '@chakra-email/core';

import { usePostkitEmailGrays } from '../theme.js';
import {
  emailDomain,
  emailField,
  emailList,
  emailRecord,
  emailText,
} from './values.js';

export interface LinkPreviewProps {
  readonly href: string;
  /** `inline` renders a plain link; everything else is the card. */
  readonly presentation?: string;
  /** `none` leaves the image out. */
  readonly images?: string;
  /** Resolved metadata (`@postkit/unfurl`), as an object or JSON text. */
  readonly metadata?: Readonly<Record<string, unknown>> | string;
  readonly title?: string;
  readonly description?: string;
  readonly siteName?: string;
  readonly image?: string;
  readonly imageAlt?: string;
  readonly rootStyles?: ChakraEmailStyleProps;
}

/**
 * A static link card: a thumbnail beside the title, description and site.
 * It reads the authored props and resolved metadata only. It never embeds
 * the page or fetches anything; resolve metadata before rendering.
 */
export function LinkPreview({
  href,
  presentation,
  images,
  metadata,
  title,
  description,
  siteName,
  image,
  imageAlt,
  rootStyles,
}: LinkPreviewProps) {
  const gray = usePostkitEmailGrays();
  const data = emailRecord(metadata);
  const target = emailText(href) ?? emailField(data, 'url') ?? '';
  const domain = emailDomain(emailField(data, 'url') ?? target);
  const heading =
    emailText(title) ?? emailField(data, 'title') ?? domain ?? target;
  if (presentation === 'inline') {
    return (
      <Link href={target} data-postkit-component="LinkPreview">
        {heading}
      </Link>
    );
  }
  const summary = emailText(description) ?? emailField(data, 'description');
  const site = emailText(siteName) ?? emailField(data, 'siteName');
  const firstImage = emailList(data?.['images'])[0];
  const thumbnail =
    images === 'none'
      ? undefined
      : (emailText(image) ?? emailField(firstImage, 'url', 'src'));
  const thumbnailAlt = emailText(imageAlt) ?? emailField(firstImage, 'alt');
  const siteLine = [site, domain && domain !== site ? domain : undefined]
    .filter(Boolean)
    .join(' · ');
  return (
    <table
      role="presentation"
      data-postkit-component="LinkPreview"
      cellSpacing={0}
      cellPadding={0}
      border={0}
      width="100%"
      style={{
        width: '100%',
        borderCollapse: 'separate',
        border: `1px solid ${gray[200]}`,
        borderRadius: 8,
        marginBottom: 16,
        ...rootStyles?.style,
      }}
    >
      <tbody>
        <Row>
          {thumbnail ? (
            <Column width="120px" p={3} pr={0}>
              <Link href={target}>
                <Img
                  src={thumbnail}
                  alt={thumbnailAlt ?? ''}
                  width={120}
                  maxW="full"
                  rounded="md"
                />
              </Link>
            </Column>
          ) : null}
          <Column p={4}>
            <Text fontWeight="bold" mb={summary || siteLine ? 1 : 0}>
              <Link href={target} color={gray[900]} textDecoration="none">
                {heading}
              </Link>
            </Text>
            {summary ? (
              <Text color={gray[700]} fontSize="sm" mb={siteLine ? 1 : 0}>
                {summary}
              </Text>
            ) : null}
            {siteLine ? (
              <Text color={gray[600]} fontSize="xs" mb={0}>
                {siteLine}
              </Text>
            ) : null}
          </Column>
        </Row>
      </tbody>
    </table>
  );
}

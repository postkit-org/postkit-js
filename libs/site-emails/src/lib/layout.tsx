import {
  Body,
  Box,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@chakra-email/core';
import { PostkitEmailProvider } from '@postkit/email';
import { Fragment, type ReactNode } from 'react';

import {
  FOOTER_REASON,
  FOOTER_SENDER,
  POSTAL_ADDRESS_LINES,
} from './constants';
import { emailTheme, logoFallbackColor, logoGradient } from './theme';

export interface FooterLink {
  readonly label: string;
  readonly href: string;
}

export interface EmailLayoutProps {
  /** The `<title>`: the subject. */
  readonly title: string;
  /** The inbox preview line, hidden in the body. */
  readonly preheader: string;
  /** Where the logo links. */
  readonly homeUrl: string;
  /** Footer links, in order (04 §3: Unsubscribe before Privacy). */
  readonly footerLinks: readonly FooterLink[];
  readonly children: ReactNode;
}

/**
 * The EmailConfirm board's frame: a 600px column on a `bg.subtle` page, the logo pill and
 * wordmark, a white card (20px radius, 40px padding) and the footer (why you got this, the
 * links, the postal address). Light only (04 §3). Every colour is a site token, resolved by
 * {@link emailTheme}.
 */
export function EmailLayout({
  title,
  preheader,
  homeUrl,
  footerLinks,
  children,
}: EmailLayoutProps) {
  return (
    <PostkitEmailProvider theme={emailTheme}>
      <Html lang="en">
        <Head>
          <meta name="color-scheme" content="light only" />
          <meta name="supported-color-schemes" content="light" />
          <title>{title}</title>
        </Head>
        <Preview>{preheader}</Preview>
        <Body bg="bg.subtle" color="fg" fontFamily="body">
          <Container maxW="600px" pt="40px" px="20px" pb="48px">
            <Link
              href={homeUrl}
              color="fg"
              textDecoration="none"
              fontSize="18px"
              fontWeight="medium"
              letterSpacing="heading"
            >
              <Box
                as="span"
                aria-hidden="true"
                display="inline-block"
                w="30px"
                h="16px"
                rounded="full"
                verticalAlign="middle"
                bg={logoFallbackColor}
                style={{ backgroundImage: logoGradient }}
              />
              <Box
                as="span"
                display="inline-block"
                verticalAlign="middle"
                style={{ marginLeft: '9px' }}
              >
                Postkit
              </Box>
            </Link>
            <Section
              mt="20px"
              bg="bg"
              rounded="2xl"
              pt="40px"
              px="40px"
              pb="44px"
            >
              {children}
            </Section>
            <Section pt="24px" px="8px">
              <FooterText>{FOOTER_REASON}</FooterText>
              <FooterText mt="8px">
                {footerLinks.map((link, index) => (
                  <Fragment key={link.href}>
                    {index > 0 ? ' · ' : null}
                    <Link href={link.href} color="fg.muted">
                      {link.label}
                    </Link>
                  </Fragment>
                ))}
              </FooterText>
              <FooterText mt="8px">
                {FOOTER_SENDER} · {POSTAL_ADDRESS_LINES[0]}{' '}
                <span style={{ whiteSpace: 'nowrap' }}>
                  {POSTAL_ADDRESS_LINES[1]}
                </span>
              </FooterText>
            </Section>
          </Container>
        </Body>
      </Html>
    </PostkitEmailProvider>
  );
}

function FooterText({
  mt = '0',
  children,
}: {
  readonly mt?: string;
  readonly children: ReactNode;
}) {
  return (
    <Text m="0" mt={mt} fontSize="12.5px" lineHeight="1.6" color="fg.quiet">
      {children}
    </Text>
  );
}

/** The card's title (30px, medium, tight tracking). */
export function EmailTitle({ children }: { readonly children: ReactNode }) {
  return (
    <Heading
      as="h1"
      m="0"
      fontSize="30px"
      fontWeight="medium"
      lineHeight="1.15"
      letterSpacing="heading"
      color="fg"
    >
      {children}
    </Heading>
  );
}

/** A body paragraph in the card. */
export function EmailParagraph({ children }: { readonly children: ReactNode }) {
  return (
    <Text m="0" mt="16px" fontSize="16px" lineHeight="1.6" color="fg.secondary">
      {children}
    </Text>
  );
}

/** The small grey note at the bottom of the card. */
export function EmailNote({ children }: { readonly children: ReactNode }) {
  return (
    <Text m="0" mt="28px" fontSize="14px" lineHeight="1.55" color="fg.muted">
      {children}
    </Text>
  );
}

import { Box, chakra, Flex } from '@chakra-ui/react';
import NextLink from 'next/link';
import { useId, type ComponentProps } from 'react';

import { LogoPill } from './logo';
import { OssMark } from './oss-mark';
import { ThemeSwitch } from './theme-switch';

interface FooterLink {
  readonly label: string;
  readonly href: string;
  readonly mono?: boolean;
}

const npmPackage = (name: string): FooterLink => ({
  label: `@postkit/${name}`,
  href: `https://www.npmjs.com/package/@postkit/${name}`,
  mono: true,
});

// 01 §4. Elsewhere lists only accounts with a confirmed URL (09 Q8): Bluesky and X wait.
const columns: readonly { title: string; links: readonly FooterLink[] }[] = [
  {
    title: 'Product',
    links: [
      { label: 'Components', href: '/components' },
      { label: 'Docs', href: '/docs' },
      { label: 'Notes', href: '/notes' },
      { label: 'Changelog', href: '/changelog' },
    ],
  },
  {
    title: 'Packages',
    links: ['react', 'chakra', 'email', 'core'].map(npmPackage),
  },
  {
    title: 'Elsewhere',
    links: [
      { label: 'GitHub', href: 'https://github.com/postkit-org/postkit-js' },
      { label: 'npm', href: 'https://www.npmjs.com/org/postkit' },
    ],
  },
];

// Hover is colour only, 120ms ease-out, and only where the device can hover (02 §6).
const hoverTo = (color: string) => ({
  transitionProperty: 'color',
  transitionDuration: 'hover',
  transitionTimingFunction: 'ease-out',
  '@media (hover: hover)': { _hover: { color } },
});

/** Internal routes go through next/link; everything else is a plain anchor. */
function FooterAnchor({
  href,
  children,
  ...props
}: Omit<ComponentProps<typeof chakra.a>, 'href'> & { href: string }) {
  if (href.startsWith('/')) {
    return (
      <chakra.a asChild {...props}>
        <NextLink href={href}>{children}</NextLink>
      </chakra.a>
    );
  }
  return (
    <chakra.a href={href} {...props}>
      {children}
    </chakra.a>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: readonly FooterLink[];
}) {
  const headingId = useId();
  return (
    <chakra.nav
      aria-labelledby={headingId}
      display="flex"
      flexDirection="column"
      alignItems="flex-start"
      gap="8px"
    >
      <chakra.p id={headingId} margin="0 0 4px" color="fg.muted">
        {title}
      </chakra.p>
      {links.map((link) => (
        <FooterAnchor
          key={link.href}
          href={link.href}
          color="fg"
          textDecoration="none"
          borderRadius="xs"
          {...(link.mono && { fontFamily: 'mono', fontSize: '13px' })}
          css={hoverTo('fg.muted')}
        >
          {link.label}
        </FooterAnchor>
      ))}
    </chakra.nav>
  );
}

/**
 * The site footer (01 §4, every board): the brand line and three link columns, then the
 * bottom row with the licence line, Licensing, Privacy, the "w/ OSS" badge and the theme
 * switch. The Commune band follows it (`CommuneBand`).
 */
export function Footer() {
  return (
    <chakra.footer borderTopWidth="1px" borderTopColor="border">
      <Box
        maxW="content"
        boxSizing="content-box"
        marginInline="auto"
        paddingTop="48px"
        paddingInline="gutter"
      >
        <Box
          display="grid"
          gridTemplateColumns="repeat(auto-fit, minmax(180px, 1fr))"
          gap="32px 24px"
          fontSize="14px"
        >
          <Flex direction="column" align="flex-start" gap="8px">
            <chakra.a
              asChild
              display="inline-flex"
              alignItems="center"
              gap="9px"
              color="fg"
              fontSize="16px"
              fontWeight="medium"
              letterSpacing="-0.02em"
              textDecoration="none"
              borderRadius="xs"
            >
              <NextLink href="/">
                <LogoPill width="26px" height="14px" />
                Postkit
              </NextLink>
            </chakra.a>
            <chakra.p margin="4px 0 0" maxW="22em" color="fg.muted">
              Richer posts, written once, right everywhere.
            </chakra.p>
          </Flex>
          {columns.map((column) => (
            <FooterColumn key={column.title} {...column} />
          ))}
        </Box>

        <Flex
          marginTop="48px"
          paddingBlock="18px"
          borderTopWidth="1px"
          borderTopColor="border"
          wrap="wrap"
          justify="space-between"
          align="center"
          gap="12px"
          fontSize="13px"
          color="fg.muted"
        >
          <span>© 2026 Postkit. MIT licensed.</span>
          <Flex wrap="wrap" align="center" gap="20px">
            <FooterAnchor
              href="/licensing"
              color="fg.muted"
              textDecoration="none"
              borderRadius="xs"
              css={hoverTo('fg')}
            >
              Licensing
            </FooterAnchor>
            <FooterAnchor
              href="/privacy"
              color="fg.muted"
              textDecoration="none"
              borderRadius="xs"
              css={hoverTo('fg')}
            >
              Privacy
            </FooterAnchor>
            <FooterAnchor
              href="/withoss"
              // The name starts with the badge's own text (WCAG 2.5.3, label in name).
              aria-label="w/ OSS: made with open-source software"
              title="Made with OSS"
              display="inline-flex"
              alignItems="center"
              gap="4px"
              height="18px"
              color="fg.muted"
              textDecoration="none"
              borderRadius="xs"
              css={hoverTo('fg')}
            >
              <span aria-hidden="true">w/</span>
              <Box
                as="span"
                display="block"
                height="18px"
                aspectRatio="579 / 285"
              >
                <OssMark />
              </Box>
            </FooterAnchor>
            <ThemeSwitch />
          </Flex>
        </Flex>
      </Box>
    </chakra.footer>
  );
}

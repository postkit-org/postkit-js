import { chakra } from '@chakra-ui/react';
import { gradients } from '@postkit/site-theme';
import NextLink from 'next/link';
import { useId, type ReactNode } from 'react';

import { TwoToneHeading } from '../layout';

const legalPages = [
  { href: '/licensing', label: 'Licensing' },
  { href: '/privacy', label: 'Privacy' },
] as const;

/** Licensing | Privacy, with the gradient bar under the current one (SiteLicensing, SitePrivacy). */
function LegalNav({ current }: { current: string }) {
  return (
    <chakra.nav
      aria-label="Legal"
      display="flex"
      gap="24px"
      borderBottomWidth="1px"
      borderColor="border"
      fontSize="md"
    >
      {legalPages.map((page) => {
        const active = page.href === current;
        return (
          <chakra.a
            key={page.href}
            asChild
            position="relative"
            display="inline-flex"
            alignItems="center"
            minHeight="44px"
            textDecoration="none"
            color={active ? 'fg' : 'fg.muted'}
            fontWeight={active ? 'medium' : 'regular'}
            transitionProperty="color"
            transitionDuration="hover"
            transitionTimingFunction="ease-out"
            css={{ '@media (hover: hover)': { _hover: { color: 'fg' } } }}
          >
            <NextLink
              href={page.href}
              aria-current={active ? 'page' : undefined}
            >
              {page.label}
              {active ? (
                <chakra.span
                  aria-hidden="true"
                  position="absolute"
                  left="0"
                  right="0"
                  bottom="-1px"
                  height="2px"
                  borderTopRadius="2px"
                  backgroundImage={gradients.brand}
                />
              ) : null}
            </NextLink>
          </chakra.a>
        );
      })}
    </chakra.nav>
  );
}

export interface LegalPageProps {
  /** `/licensing` or `/privacy`: marks the tab. */
  readonly path: string;
  readonly title: string;
  readonly quiet: string;
  readonly lede: ReactNode;
  /** `YYYY-MM-DD` and its display form, from `lastUpdated` at build time. */
  readonly updated: { readonly iso: string; readonly label: string };
  readonly children: ReactNode;
}

/** The shared layout of the Licensing and Privacy pages: 760px column, tabs, title, lede, date. */
export function LegalPage({
  path,
  title,
  quiet,
  lede,
  updated,
  children,
}: LegalPageProps) {
  return (
    <chakra.div
      // The boards' 760px column (no size token matches it), inside the 24px gutters.
      maxW="calc(760px + 2 * {spacing.gutter})"
      marginInline="auto"
      paddingInline="gutter"
      paddingTop={{ base: '64px', md: '96px' }}
      paddingBottom="section"
    >
      <LegalNav current={path} />
      <TwoToneHeading
        as="h1"
        textStyle="pageTitle"
        fontSize="clamp(40px, 5vw, 64px)"
        marginTop="48px"
        title={title}
        quiet={quiet}
      />
      <chakra.p
        margin="0"
        marginTop="24px"
        fontSize="lg"
        lineHeight="1.6"
        color="fg.secondary"
      >
        {lede}
      </chakra.p>
      <chakra.p margin="0" marginTop="16px" fontSize="14px" color="fg.muted">
        Last updated <time dateTime={updated.iso}>{updated.label}</time>
      </chakra.p>
      {children}
    </chakra.div>
  );
}

export interface LegalSectionProps {
  readonly title: string;
  readonly children: ReactNode;
}

/** A titled section, 56px below the one before. */
export function LegalSection({ title, children }: LegalSectionProps) {
  const id = useId();
  return (
    <chakra.section aria-labelledby={id} marginTop="56px">
      <chakra.h2
        id={id}
        margin="0"
        fontWeight="medium"
        fontSize="26px"
        lineHeight="1.15"
        letterSpacing="heading"
      >
        {title}
      </chakra.h2>
      {children}
    </chakra.section>
  );
}

/** Body copy inside a section. */
export function LegalText({ children }: { readonly children: ReactNode }) {
  return (
    <chakra.p
      margin="0"
      marginTop="16px"
      fontSize="body"
      lineHeight="1.65"
      color="fg.secondary"
    >
      {children}
    </chakra.p>
  );
}

/** A list of ✓ items between hairlines ("What you can do", "What we collect"). */
export function CheckList({ items }: { readonly items: readonly ReactNode[] }) {
  return (
    <chakra.ul margin="0" marginTop="16px" padding="0" listStyleType="none">
      {items.map((item, index) => (
        <chakra.li
          key={index}
          display="flex"
          gap="12px"
          paddingBlock="10px"
          borderTopWidth="1px"
          borderColor="border"
          fontSize="body"
          lineHeight="1.55"
          color="fg.secondary"
        >
          <chakra.span aria-hidden="true" flex="0 0 20px" color="tone.tip">
            ✓
          </chakra.span>
          <span>{item}</span>
        </chakra.li>
      ))}
    </chakra.ul>
  );
}

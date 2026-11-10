import { Box, chakra, Container, Flex } from '@chakra-ui/react';
import { gradients } from '@postkit/site-theme';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { useRef, type ReactNode } from 'react';

import {
  externalLinks,
  sectionFromPathname,
  type SiteSection,
} from '../lib/site-sections';
import { CloseIcon, MenuIcon, SearchIcon } from './icons';
import { Logo } from './logo';
import { PhoneMenu, usePhoneMenu } from './phone-menu';
import { Button, Kbd } from './primitives';

const MENU_ID = 'site-menu';

export interface HeaderProps {
  /**
   * Opens site search. PK-041 passes the dialog's opener here (and binds ⌘K / Ctrl+K);
   * until then the trigger renders but does nothing.
   */
  readonly onOpenSearch?: () => void;
}

/**
 * The site header (01 §4, PK-010): glass and sticky, the Main nav with the current section's
 * gradient bar on the bottom edge, the search trigger, Get started and, under 761px, the
 * phone menu button. The skip link renders first so it's the first thing Tab reaches.
 */
export function Header({ onOpenSearch }: HeaderProps) {
  const { pathname } = useRouter();
  const current = sectionFromPathname(pathname);
  const headerRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menu = usePhoneMenu({
    containerRef: headerRef,
    buttonRef: menuButtonRef,
  });

  return (
    <>
      <SkipLink />
      <chakra.header
        ref={headerRef}
        // Any link followed from the open menu (a sheet row, the logo, Get started) closes it,
        // including links to the page you're already on, which fire no route change.
        onClickCapture={(event) => {
          if (menu.open && (event.target as Element).closest('a[href]')) {
            menu.close();
          }
        }}
        position="sticky"
        top="0"
        zIndex="sticky"
        bg="bg.glass"
        borderBottomWidth="1px"
        borderBottomColor="border.header"
        css={{
          WebkitBackdropFilter: 'saturate(180%) blur(20px)',
          backdropFilter: 'saturate(180%) blur(20px)',
        }}
      >
        <Container
          // The boards' content-box: 1120px of content inside the 24px gutters.
          maxW="calc({sizes.content} + 2 * {spacing.gutter})"
          paddingInline="gutter"
          height="header"
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          gap="12px"
        >
          <Logo flexShrink={0} />
          <Flex
            as="nav"
            aria-label="Main"
            alignSelf="stretch"
            alignItems="stretch"
            gap={{ base: '8px', md: '24px' }}
            fontSize="14px"
          >
            <NavLink href="/components" section="components" current={current}>
              Components
            </NavLink>
            <NavLink href="/docs" section="docs" current={current}>
              Docs
            </NavLink>
            <NavLink href="/notes" section="notes" current={current}>
              Notes
            </NavLink>
            <NavLink href={externalLinks.github} external>
              GitHub
            </NavLink>

            {/* PK-041: wire the search dialog through `onOpenSearch`. */}
            <SearchTrigger onClick={onOpenSearch} />

            <Button
              variant="primary"
              asChild
              alignSelf="center"
              flexShrink={0}
              // Under 370px (e.g. 320 and 360) the phone row can't fit all four controls with
              // 24px gutters; Get started yields first.
              css={{ '@media (max-width: 369px)': { display: 'none' } }}
            >
              <NextLink href="/docs/quick-start">Get started</NextLink>
            </Button>

            <chakra.button
              ref={menuButtonRef}
              type="button"
              aria-label={menu.open ? 'Close menu' : 'Menu'}
              aria-expanded={menu.open}
              aria-controls={MENU_ID}
              onClick={menu.toggle}
              display={{ base: 'inline-flex', md: 'none' }}
              alignSelf="center"
              alignItems="center"
              justifyContent="center"
              flexShrink={0}
              width="tap"
              height="tap"
              padding="0"
              border="0"
              borderRadius="full"
              bg="bg.subtle"
              color="fg"
              cursor="pointer"
              transitionProperty="background-color"
              transitionDuration="hover"
              transitionTimingFunction="ease-out"
              css={hoverBg}
            >
              {menu.open ? <CloseIcon /> : <MenuIcon />}
            </chakra.button>
          </Flex>
        </Container>

        <PhoneMenu id={MENU_ID} open={menu.open} current={current} />
      </chakra.header>
    </>
  );
}

const hoverBg = {
  '@media (hover: hover)': { '&:hover': { bg: 'bg.hover' } },
  '&:active': { bg: 'bg.pressed' },
} as const;

/** The bar on the header's bottom edge: gradient when current, `border.hover` on hover. */
const navBar = {
  content: '""',
  position: 'absolute',
  insetInline: '0',
  bottom: '-1px',
  height: '2px',
  borderTopRadius: '2px',
  transitionProperty: 'background-color',
  transitionDuration: 'hover',
  transitionTimingFunction: 'ease-out',
} as const;

interface NavLinkProps {
  readonly href: string;
  readonly children: ReactNode;
  readonly section?: SiteSection;
  readonly current?: SiteSection | null;
  readonly external?: boolean;
}

/**
 * A header link stretched to the header's full height, so its bar sits on the bottom edge.
 * The focus ring wraps the label (Interaction states board), not the whole 56px column.
 */
function NavLink({ href, children, section, current, external }: NavLinkProps) {
  const isCurrent = section != null && section === current;
  const label = (
    <chakra.span
      data-label=""
      paddingBlock="2px"
      paddingInline="4px"
      marginInline="-4px"
      borderRadius="6px"
    >
      {children}
      {external ? (
        <chakra.span
          aria-hidden="true"
          color="fg.quiet"
          marginInlineStart="0.25em"
        >
          ↗
        </chakra.span>
      ) : null}
    </chakra.span>
  );

  return (
    <chakra.a
      asChild={!external}
      href={external ? href : undefined}
      aria-current={isCurrent ? 'page' : undefined}
      position="relative"
      display={{ base: 'none', md: 'inline-flex' }}
      alignItems="center"
      color="fg"
      fontWeight={isCurrent ? 'medium' : 'regular'}
      textDecoration="none"
      whiteSpace="nowrap"
      _after={
        isCurrent
          ? { ...navBar, backgroundImage: gradients.brand }
          : { ...navBar, bg: 'transparent' }
      }
      css={{
        '@media (hover: hover)': isCurrent
          ? {}
          : { '&:hover::after': { bg: 'border.hover' } },
        '&:focus-visible': { outline: 'none' },
        '&:focus-visible [data-label]': {
          outline: '2px solid',
          outlineColor: 'accent',
          outlineOffset: '2px',
        },
      }}
    >
      {external ? label : <NextLink href={href}>{label}</NextLink>}
    </chakra.a>
  );
}

/** A pill with ⌘K on desktop; a 44px icon button on phones (01 §4). */
function SearchTrigger({ onClick }: { readonly onClick?: () => void }) {
  return (
    <chakra.button
      type="button"
      aria-label="Search"
      aria-keyshortcuts="Meta+K Control+K"
      aria-haspopup="dialog"
      onClick={onClick}
      alignSelf="center"
      flexShrink={0}
      display="inline-flex"
      alignItems="center"
      justifyContent={{ base: 'center', md: 'flex-start' }}
      gap="8px"
      width={{ base: 'tap', md: 'auto' }}
      height={{ base: 'tap', md: '32px' }}
      paddingInlineStart={{ base: '0', md: '12px' }}
      paddingInlineEnd={{ base: '0', md: '6px' }}
      border="0"
      borderRadius="full"
      bg="bg.subtle"
      color={{ base: 'fg', md: 'fg.muted' }}
      font="inherit"
      fontSize="13px"
      cursor="pointer"
      transitionProperty="background-color"
      transitionDuration="hover"
      transitionTimingFunction="ease-out"
      css={hoverBg}
    >
      <SearchIcon />
      <Box
        as="span"
        display={{ base: 'none', md: 'inline' }}
        minWidth="64px"
        textAlign="start"
      >
        Search
      </Box>
      <Kbd display={{ base: 'none', md: 'inline-flex' }}>⌘K</Kbd>
    </chakra.button>
  );
}

/** Hidden until focused; the first Tab stop on every page (01 §13). */
function SkipLink() {
  return (
    <chakra.a
      href="#main"
      position="fixed"
      top="8px"
      insetInlineStart="16px"
      zIndex="skipNav"
      display="inline-flex"
      alignItems="center"
      minHeight="40px"
      paddingInline="18px"
      borderRadius="full"
      bg="bg.inverted"
      color="fg.inverted"
      fontSize="14px"
      textDecoration="none"
      css={{
        '&:not(:focus)': {
          clip: 'rect(0 0 0 0)',
          clipPath: 'inset(50%)',
          width: '1px',
          height: '1px',
          minHeight: '0',
          padding: '0',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
        },
      }}
    >
      Skip to content
    </chakra.a>
  );
}

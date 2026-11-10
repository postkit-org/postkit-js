import { Box, chakra } from '@chakra-ui/react';
import { gradients } from '@postkit/site-theme';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from 'react';

import { componentCategoryGroups, componentEntries } from '../lib/components';
import { externalLinks, type SiteSection } from '../lib/site-sections';

/** Matches the `md` breakpoint (761px): the menu exists only below it. */
const DESKTOP_QUERY = '(min-width: 761px)';

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

const numberWords = [
  'zero',
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten',
];

/** "six kits" reads better than "6 kits"; larger counts stay as digits. */
function countWord(count: number): string {
  return numberWords[count] ?? String(count);
}

/** Inlined at build by next.config.js from the newest released changelog entry (01 §5.2). */
const latestReleasedVersion = process.env.POSTKIT_LATEST_RELEASE;

const rows: readonly {
  section: SiteSection;
  href: string;
  label: string;
  description: string;
}[] = [
  {
    section: 'components',
    href: '/components',
    label: 'Components',
    // Counted from the component manifest (handoff 08 rule 7), never hard-coded.
    description: `${componentEntries.length} components in ${countWord(componentCategoryGroups.length)} kits`,
  },
  {
    section: 'docs',
    href: '/docs',
    label: 'Docs',
    description: 'Install, customize, render',
  },
  {
    section: 'notes',
    href: '/notes',
    label: 'Notes',
    description: 'Guides, releases and case studies',
  },
  {
    section: 'changelog',
    href: '/changelog',
    label: 'Changelog',
    // The newest released changelog entry (01 §5.2); upcoming entries never count.
    description: latestReleasedVersion
      ? `Latest: ${latestReleasedVersion}`
      : 'Release notes',
  },
];

const elsewhere = [
  { href: externalLinks.github, label: 'GitHub' },
  { href: externalLinks.npm, label: 'npm' },
  { href: externalLinks.bluesky, label: 'Bluesky' },
] as const;

const legal = [
  { href: '/licensing', label: 'Licensing' },
  { href: '/privacy', label: 'Privacy' },
  { href: '/withoss', label: 'Made with OSS' },
] as const;

export interface UsePhoneMenuOptions {
  /** The trap: the header, which holds the menu button and the sheet. */
  readonly containerRef: RefObject<HTMLElement | null>;
  /** The menu button; focus returns here whenever the menu closes. */
  readonly buttonRef: RefObject<HTMLButtonElement | null>;
}

/**
 * The phone menu's behaviour (01 §4, PK-011). While open it:
 * - traps Tab and Shift+Tab inside the header (menu button and sheet), and makes the rest of
 *   the page `inert` so pointer, focus and screen-reader cursors can't reach it;
 * - closes on Esc, on the menu (close) button and on route change (the header also closes it
 *   when a link is followed), then returns focus to the menu button;
 * - locks page scroll, and closes quietly if the window widens past the phone layout.
 */
export function usePhoneMenu({ containerRef, buttonRef }: UsePhoneMenuOptions) {
  const [open, setOpen] = useState(false);
  const restoreFocus = useRef(false);
  const router = useRouter();

  const close = useCallback((options?: { restoreFocus?: boolean }) => {
    restoreFocus.current = options?.restoreFocus ?? true;
    setOpen(false);
  }, []);

  const toggle = useCallback(() => {
    if (open) close();
    else setOpen(true);
  }, [open, close]);

  // Focus goes back to the menu button after the sheet has gone.
  useEffect(() => {
    if (open || !restoreFocus.current) return;
    restoreFocus.current = false;
    buttonRef.current?.focus();
  }, [open, buttonRef]);

  useEffect(() => {
    if (!open) return;
    const container = containerRef.current;
    if (!container) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== 'Tab') return;

      const focusable = Array.from(
        container.querySelectorAll<HTMLElement>(FOCUSABLE),
      ).filter(
        (element) =>
          element.getClientRects().length > 0 && !element.closest('[hidden]'),
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      const inside = active instanceof Node && container.contains(active);

      if (event.shiftKey && (active === first || !inside)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || !inside)) {
        event.preventDefault();
        first.focus();
      }
    };

    // Everything beside the header (skip link, main, footer) goes inert.
    const siblings = Array.from(container.parentElement?.children ?? []).filter(
      (element): element is HTMLElement =>
        element !== container &&
        element instanceof HTMLElement &&
        !element.hasAttribute('inert'),
    );
    siblings.forEach((element) => element.setAttribute('inert', ''));

    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    root.style.overflow = 'hidden';

    const onRouteChange = () => close();
    router.events.on('routeChangeStart', onRouteChange);

    const desktop = window.matchMedia(DESKTOP_QUERY);
    const onWiden = (event: MediaQueryListEvent) => {
      if (event.matches) close({ restoreFocus: false });
    };
    desktop.addEventListener('change', onWiden);

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      desktop.removeEventListener('change', onWiden);
      router.events.off('routeChangeStart', onRouteChange);
      root.style.overflow = previousOverflow;
      siblings.forEach((element) => element.removeAttribute('inert'));
    };
  }, [open, close, containerRef, router.events]);

  return { open, toggle, close };
}

export interface PhoneMenuProps {
  /** Referenced by the menu button's `aria-controls`. */
  readonly id: string;
  readonly open: boolean;
  readonly current: SiteSection | null;
}

const linkReset = {
  color: 'fg',
  textDecoration: 'none',
} as const;

/**
 * The full-screen sheet under the header (PhoneMenuOpen, PhoneMenuOpenDark). It renders inside
 * the header, which is `position: sticky`, so it hangs from the header's bottom border.
 */
export function PhoneMenu({ id, open, current }: PhoneMenuProps) {
  return (
    <chakra.div
      id={id}
      hidden={!open}
      display={{ base: open ? 'flex' : 'none', md: 'none' }}
      flexDirection="column"
      position="absolute"
      top="calc(100% + 1px)"
      insetInline="0"
      height="calc(100dvh - {sizes.header} - 1px)"
      overflowY="auto"
      overscrollBehavior="contain"
      bg="bg"
      paddingTop="8px"
      paddingInline="gutter"
      paddingBottom="32px"
    >
      <nav aria-label="Menu">
        <chakra.ul margin="0" padding="0" listStyleType="none">
          {rows.map((row) => {
            const isCurrent = row.section === current;
            return (
              <chakra.li
                key={row.href}
                borderBottomWidth="1px"
                borderBottomColor="border"
              >
                <chakra.a
                  asChild
                  {...linkReset}
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                  gap="16px"
                  paddingBlock="18px"
                  css={{
                    '@media (hover: hover)': {
                      '&:hover [data-chevron]': { color: 'fg' },
                    },
                  }}
                >
                  <NextLink
                    href={row.href}
                    aria-current={isCurrent ? 'page' : undefined}
                  >
                    <span>
                      <chakra.span
                        position="relative"
                        display="inline-block"
                        fontSize="28px"
                        lineHeight="1.15"
                        letterSpacing="-0.02em"
                        fontWeight={isCurrent ? 'medium' : 'regular'}
                      >
                        {row.label}
                        {isCurrent ? (
                          <Box
                            as="span"
                            aria-hidden="true"
                            position="absolute"
                            insetInline="0"
                            bottom="-6px"
                            height="2px"
                            borderRadius="2px"
                            backgroundImage={gradients.brand}
                          />
                        ) : null}
                      </chakra.span>
                      <chakra.span
                        display="block"
                        marginTop="6px"
                        fontSize="14px"
                        color="fg.muted"
                      >
                        {row.description}
                      </chakra.span>
                    </span>
                    <chakra.span
                      aria-hidden="true"
                      data-chevron=""
                      fontSize="20px"
                      color="fg.quiet"
                      transitionProperty="color"
                      transitionDuration="hover"
                      transitionTimingFunction="ease-out"
                    >
                      ›
                    </chakra.span>
                  </NextLink>
                </chakra.a>
              </chakra.li>
            );
          })}
        </chakra.ul>
      </nav>

      {/* Each link fills a 44px row (02 §6); the board's 14px gaps sit inside those rows. */}
      <chakra.ul
        aria-label="Elsewhere"
        margin="0"
        marginTop="15px"
        padding="0"
        listStyleType="none"
        display="flex"
        flexDirection="column"
        fontSize="17px"
      >
        {elsewhere.map((link) => (
          <li key={link.href}>
            <chakra.a
              {...linkReset}
              href={link.href}
              display="inline-flex"
              alignItems="center"
              gap="0.3em"
              minHeight="tap"
            >
              {link.label}
              <chakra.span aria-hidden="true" color="fg.quiet">
                ↗
              </chakra.span>
            </chakra.a>
          </li>
        ))}
      </chakra.ul>

      <chakra.p
        marginTop="auto"
        marginBottom="0"
        paddingTop="8px"
        borderTopWidth="1px"
        borderTopColor="border"
        display="flex"
        flexWrap="wrap"
        columnGap="20px"
        fontSize="14px"
        color="fg.muted"
      >
        {legal.map((link) => (
          <chakra.a
            key={link.href}
            asChild
            color="fg.muted"
            textDecoration="none"
            display="inline-flex"
            alignItems="center"
            minHeight="tap"
          >
            <NextLink href={link.href}>{link.label}</NextLink>
          </chakra.a>
        ))}
      </chakra.p>
    </chakra.div>
  );
}

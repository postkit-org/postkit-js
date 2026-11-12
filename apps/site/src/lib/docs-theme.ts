import { defineConfig, type SlotRecipeConfig } from '@chakra-ui/react';
import {
  chakraDocsRecipeKeys,
  chakraDocsSlotRecipes,
  type ChakraDocsRecipeKey,
} from '@chakra-docs/chakra/theme';
import { gradients } from '@postkit/site-theme';

/**
 * chakra-docs' slot recipes, restyled to the SiteDocs* and PhoneDocs* boards (01 §6.5,
 * 02 §4–6). `site-theme.ts` merges this over `chakraDocsThemeConfig`, so only the slots that
 * differ are set here; colours come from the site's semantic tokens.
 *
 * Breakpoints follow the boards: the nav and TOC show from `md` (761px), where chakra-docs
 * defaults to `lg` and `xl`.
 */

/**
 * 02 §6: a 2px accent ring, 2px off the control, on `:focus-visible` only. The colour is in
 * the shorthand too: chakra-docs' recipes set `outline: 2px solid`, and an atomic shorthand
 * emitted after `outlineColor` would reset it to `currentColor`.
 */
const focusRing = {
  outline: '2px solid {colors.accent}',
  outlineColor: 'accent',
  outlineOffset: '2px',
} as const;

/** The vertical gradient pill on the current page and section (02 §3, §6 "Current"). */
const gradientPill = {
  content: '""',
  flex: '0 0 3px',
  alignSelf: 'stretch',
  marginBlock: '3px',
  borderRadius: '3px',
  background: gradients.brandVertical,
} as const;

/** Stretches a pager link over its whole card. */
const cardOverlay = {
  content: '""',
  position: 'absolute',
  inset: '0',
  borderRadius: 'inherit',
} as const;

/** Sticky offset for the nav and TOC: under the 56px header with 24px to spare (board: 80px). */
export const DOCS_STICKY_TOP = 'calc({sizes.header} + 24px)';

/**
 * A partial override of one chakra-docs slot recipe. Chakra merges configs deeply (arrays by
 * index), so repeating the recipe's own `slots` changes nothing; it only satisfies the type.
 */
function restyle(
  key: ChakraDocsRecipeKey,
  recipe: Omit<SlotRecipeConfig, 'slots'>,
): Record<string, SlotRecipeConfig> {
  return {
    [key]: { slots: [...chakraDocsSlotRecipes[key].slots], ...recipe },
  };
}

export const siteDocsThemeConfig = defineConfig({
  theme: {
    slotRecipes: {
      // The three-column shell: nav 220, main ≤ 720, TOC 180, inside the 1280 docs width.
      // Like the boards it wraps rather than squeezing: between 761px and ~950px the TOC
      // drops below the article.
      ...restyle(chakraDocsRecipeKeys.layout, {
        base: {
          root: {
            maxW: 'calc({sizes.docs} + 2 * {spacing.gutter})',
            // Chakra's Container recipe widens its padding at md and lg; the docs keep 24px.
            px: { base: 'gutter', md: 'gutter', lg: 'gutter' },
            py: '0',
          },
          inner: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: '32px 56px',
          },
          sidebar: { display: { base: 'none', md: 'block' } },
          content: {
            flex: '1 1 440px',
            w: 'auto',
            maxW: 'docsMain',
            pt: { base: '32px', md: '72px' },
            // The boards leave 120px between the last line and the footer (64px on phones).
            pb: { base: '64px', md: '120px' },
          },
        },
      }),
      ...restyle(chakraDocsRecipeKeys.sidebar, {
        base: {
          root: {
            // 220px of nav plus the 4px focus-ring room on each side (cancelled by `mx`).
            flex: '0 1 228px',
            w: { base: 'auto', md: '228px', lg: '228px' },
            position: { base: 'static', md: 'sticky' },
            alignSelf: 'flex-start',
            // The nav is longer than short viewports: it scrolls on its own.
            maxH: { md: `calc(100dvh - ${DOCS_STICKY_TOP})` },
            overflowY: { md: 'auto' },
            overscrollBehavior: 'contain',
            py: { base: '0', md: '40px' },
            // Room for focus rings inside the scroll box.
            px: '4px',
            mx: '-4px',
            fontSize: '15px',
            '& > ol > li + li': { mt: '24px' },
          },
          item: { py: '0' },
          // Group labels ("Get started").
          sectionTitle: {
            m: '0 0 6px 12px',
            fontSize: '13px',
            fontWeight: 'regular',
            color: 'fg.muted',
          },
          children: {
            mt: '0',
            ps: '0',
            // A "Soon" item has no page: chakra-docs renders its label as text, not a link.
            '& li > p': {
              m: '0',
              py: '6px',
              ps: '12px',
              fontSize: '15px',
              color: 'fg.secondary',
            },
          },
          link: {
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            w: 'full',
            // 44px touch targets in the phone menu (02 §6); the board's 6px rows from md.
            minH: { base: '44px', md: 'auto' },
            px: '12px',
            py: '6px',
            borderRadius: 'sm',
            color: 'fg.secondary',
            textDecoration: 'none',
            transitionProperty: 'color',
            transitionDuration: 'hover',
            transitionTimingFunction: 'ease-out',
            _hover: { color: 'fg', textDecoration: 'none' },
            _focusVisible: focusRing,
          },
          badge: {
            ms: '6px',
            p: '0',
            bg: 'transparent',
            borderWidth: '0',
            fontSize: '12px',
            fontWeight: 'regular',
            color: 'fg.muted',
            textTransform: 'none',
          },
        },
        variants: {
          active: {
            true: {
              link: {
                ps: '8px',
                bg: 'bg.subtle',
                color: 'fg',
                fontWeight: 'medium',
                _before: gradientPill,
              },
            },
          },
        },
      }),
      // "On this page" (SiteDocs* right rail).
      ...restyle(chakraDocsRecipeKeys.tableOfContents, {
        base: {
          root: {
            display: { base: 'none', md: 'block' },
            flex: '0 1 180px',
            alignSelf: 'flex-start',
            pt: '80px',
            fontSize: '14px',
          },
          label: {
            mb: '8px',
            fontSize: '14px',
            fontWeight: 'regular',
            color: 'fg.muted',
          },
          item: { py: '0' },
          link: {
            display: 'flex',
            gap: '10px',
            px: '0',
            py: '4px',
            position: 'static',
            fontSize: '14px',
            fontWeight: 'regular',
            color: 'fg.muted',
            textDecoration: 'none',
            transitionProperty: 'color',
            transitionDuration: 'hover',
            transitionTimingFunction: 'ease-out',
            _hover: { color: 'fg', textDecoration: 'none' },
            _focusVisible: focusRing,
          },
          activeIndicator: {
            position: 'static',
            flex: '0 0 3px',
            w: '3px',
            alignSelf: 'stretch',
            marginBlock: '3px',
            borderRadius: '3px',
          },
        },
        variants: {
          active: {
            true: {
              link: { color: 'fg' },
              activeIndicator: { background: gradients.brandVertical },
            },
          },
        },
      }),
      ...restyle(chakraDocsRecipeKeys.article, {
        base: { root: { maxW: 'full', mx: '0' } },
      }),
      // Prev/next cards (SiteDocs*: bg.subtle, 16px radius, the whole card is the link).
      ...restyle(chakraDocsRecipeKeys.pagination, {
        base: {
          root: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
            mt: '72px',
            pt: '0',
            borderTopWidth: '0',
          },
          item: {
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
            px: '20px',
            py: '18px',
            borderRadius: 'xl',
            bg: 'bg.subtle',
            transitionProperty: 'background-color',
            transitionDuration: 'hover',
            transitionTimingFunction: 'ease-out',
            _hover: { bg: 'bg.hover' },
            // The ring goes on the card, since the link's hit area is the whole card.
            '&:has(a:focus-visible)': focusRing,
          },
          label: { fontSize: '14px', color: 'fg.muted' },
          link: {
            fontSize: '17px',
            color: 'fg',
            textDecoration: 'none',
            _hover: { textDecoration: 'none' },
            _focusVisible: { outline: 'none' },
          },
        },
        variants: {
          direction: {
            // ‹ before the previous title, › after the next one; the other pseudo-element
            // stretches the link over the card.
            previous: {
              item: {
                '& a::before': { content: '"‹ "' },
                '& a::after': cardOverlay,
              },
            },
            next: {
              item: {
                '& a::after': { content: '" ›"' },
                '& a::before': cardOverlay,
              },
            },
          },
        },
      }),
      ...restyle(chakraDocsRecipeKeys.badge, {
        base: {
          root: {
            px: '8px',
            py: '2px',
            borderRadius: 'full',
            borderWidth: '0',
            bg: 'bg.subtle',
            color: 'fg.muted',
            fontFamily: 'mono',
            fontSize: '12px',
            fontWeight: 'regular',
            textTransform: 'none',
            letterSpacing: '0',
          },
        },
      }),
    },
  },
});

import { Box, chakra } from '@chakra-ui/react';
import { DocsSidebar } from '@chakra-docs/chakra';
import type { DocsNavItem, DocsPage } from '@chakra-docs/core';
import { useEffect, useId, useState } from 'react';

export interface DocsMenuProps {
  readonly nav: DocsNavItem[];
  readonly page: DocsPage;
  /** The current page's nav group ("Get started"), shown before the page title. */
  readonly group: string | null;
}

/**
 * The docs nav on phones (under 761px; PhoneDocs* boards): a "Group / Page ▾" disclosure
 * above the content that opens chakra-docs' `DocsSidebar` in place. A button with
 * `aria-expanded` controls it, and it closes when the page changes.
 *
 * chakra-docs' own phone navigation is a modal drawer, so the layout turns it off
 * (`mobileNavigation={false}`) and this owns the phone nav instead.
 */
export function DocsMenu({ nav, page, group }: DocsMenuProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  useEffect(() => {
    setOpen(false);
  }, [page.route]);

  return (
    <Box
      display={{ base: 'block', md: 'none' }}
      marginBottom="40px"
      borderRadius="lg"
      background="bg.subtle"
    >
      <chakra.button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        gap="12px"
        width="100%"
        minHeight="48px"
        paddingInline="16px"
        border="0"
        borderRadius="lg"
        background="transparent"
        color="fg"
        font="inherit"
        fontSize="15px"
        textAlign="start"
        cursor="pointer"
      >
        <span>
          {group ? (
            <chakra.span color="fg.muted">{group} / </chakra.span>
          ) : null}
          {page.title}
        </span>
        <chakra.span
          aria-hidden="true"
          color="fg.muted"
          transform={open ? 'rotate(180deg)' : undefined}
        >
          ▾
        </chakra.span>
      </chakra.button>
      <Box id={panelId} hidden={!open} padding="4px 4px 16px">
        <DocsSidebar
          nav={nav}
          page={page}
          slotProps={{ 'aria-label': 'Docs' }}
        />
      </Box>
    </Box>
  );
}

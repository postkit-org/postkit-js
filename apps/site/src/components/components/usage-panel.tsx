import { Box, chakra, Flex } from '@chakra-ui/react';
import { useEffect, useRef, useState } from 'react';

import { SegmentedControl } from '../primitives';
import type { UsageSyntax } from './usage-source';
import { CheckIcon, CopyIcon } from '../icons';

const syntaxItems = [
  { value: 'mdx', label: 'MDX' },
  { value: 'markdown', label: 'Markdown' },
] as const;

/**
 * The segmented control on a `bg.subtle` panel (SiteComponent* boards): the track a step
 * darker (`bg.hover`), and unselected labels in `fg.secondary` so they keep 4.5:1 on it
 * (the boards' `#4A4A4E`; `fg.muted` drops to 4.2:1 on this track).
 */
export const segmentedOnSubtle = {
  '& .site-segmented-control__root': { bg: 'bg.hover' },
  '& .site-segmented-control__item[data-state=unchecked]': {
    color: 'fg.secondary',
  },
} as const;

function CopyButton({ text }: { readonly text: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      return;
    }
    setCopied(true);
    clearTimeout(timer.current);
    // 02 §6: "Copied" for 1.6s, then back.
    timer.current = setTimeout(() => setCopied(false), 1600);
  };

  return (
    <chakra.button
      type="button"
      onClick={copy}
      display="inline-flex"
      alignItems="center"
      gap="6px"
      minWidth="44px"
      minHeight="40px"
      paddingInline="16px"
      border="0"
      borderRadius="full"
      bg="transparent"
      color="fg"
      fontFamily="inherit"
      fontSize="13px"
      cursor="pointer"
      transitionProperty="background-color"
      transitionDuration="hover"
      transitionTimingFunction="ease-out"
      css={{ '@media (hover: hover)': { '&:hover': { bg: 'bg.hover' } } }}
    >
      {copied ? (
        <chakra.span display="inline-flex" color="tone.tip">
          <CheckIcon />
        </chakra.span>
      ) : (
        <CopyIcon />
      )}
      {/* The papers icon alone when idle; "Copied" shows (and is announced) after copying. */}
      <chakra.span aria-live="polite" srOnly={!copied}>
        {copied ? 'Copied' : 'Copy code'}
      </chakra.span>
    </chakra.button>
  );
}

export interface UsagePanelProps {
  readonly syntax: UsageSyntax;
  readonly onSyntaxChange: (syntax: UsageSyntax) => void;
  readonly source: string;
}

/**
 * The Usage panel (SiteComponent* boards): MDX / Markdown as a segmented control, a copy
 * button, and the source for the preview's current state.
 */
export function UsagePanel({
  syntax,
  onSyntaxChange,
  source,
}: UsagePanelProps) {
  return (
    <Box marginTop="28px" borderRadius="xl" bg="bg.subtle" overflow="hidden">
      <Flex
        wrap="wrap"
        justify="space-between"
        align="center"
        gap="8px"
        paddingBlock="8px"
        paddingInlineStart="12px"
        paddingInlineEnd="8px"
        borderBottomWidth="1px"
        borderBottomColor="bg.hover"
        css={segmentedOnSubtle}
      >
        <SegmentedControl
          aria-label="Syntax"
          items={syntaxItems}
          value={syntax}
          onValueChange={onSyntaxChange}
        />
        <CopyButton text={source} />
      </Flex>
      <chakra.pre
        margin="0"
        paddingBlock="20px"
        paddingInline="22px"
        fontFamily="mono"
        fontSize={{ base: '13px', md: '14px' }}
        lineHeight="1.75"
        color="fg"
        whiteSpace="pre-wrap"
        overflowWrap="anywhere"
      >
        <code>{source}</code>
      </chakra.pre>
    </Box>
  );
}

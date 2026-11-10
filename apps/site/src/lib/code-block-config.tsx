import { chakra } from '@chakra-ui/react';
import type { PostkitCodeBlockConfig } from '@postkit/chakra';

import { CheckIcon, CopyIcon } from '../components/icons';

/**
 * Every Postkit CodeBlock on the site (docs, notes, changelog, component pages) copies with
 * the papers icon. The idle button is icon-only and keeps its "Copy code" accessible name;
 * copying swaps in the tip-green tick and "Copied", announced politely (02 §6).
 */
export const siteCodeBlockConfig: PostkitCodeBlockConfig = {
  copyIcon: <CopyIcon />,
  copyLabel: null,
  copiedIcon: (
    <chakra.span display="inline-flex" color="tone.tip">
      <CheckIcon />
    </chakra.span>
  ),
  copiedLabel: 'Copied',
  copyAriaLabel: 'Copy code',
  copyFeedback: 'inline',
};

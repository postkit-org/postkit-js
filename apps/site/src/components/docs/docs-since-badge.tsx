import { VisuallyHidden } from '@chakra-ui/react';
import { DocsBadge } from '@chakra-docs/chakra';

export interface DocsSinceBadgeProps {
  /** The release that introduced the documented API: `'0.3.0'`. */
  readonly since: string;
}

/**
 * The version badge (01 §5.1 `since`): "0.3.0" beside the group label. chakra-docs'
 * `DocsBadge`, restyled in `docs-theme.ts`. Screen readers hear "Since version 0.3.0".
 */
export function DocsSinceBadge({ since }: DocsSinceBadgeProps) {
  return (
    <DocsBadge>
      <VisuallyHidden>Since version </VisuallyHidden>
      {since}
    </DocsBadge>
  );
}

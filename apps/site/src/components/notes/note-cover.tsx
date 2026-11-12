import { Box, chakra, type BoxProps } from '@chakra-ui/react';
import { gradients } from '@postkit/site-theme';

import { hasGradientCover, type NoteSummary } from '../../lib/notes';

export interface NoteCoverProps extends Omit<BoxProps, 'children'> {
  readonly note: Pick<NoteSummary, 'cover' | 'title'>;
  /**
   * The image's text alternative. Index thumbnails sit inside a link that already names the
   * note, so they pass `''`; the article's lead image names itself.
   */
  readonly alt?: string;
}

/**
 * A note's cover: its image, or the brand gradient's softer `cover` stops when the note
 * says `cover: gradient` (02 §3). The gradient is decoration, so it's hidden from assistive
 * tech. Size and radius come from the caller.
 */
export function NoteCover({ note, alt = '', ...props }: NoteCoverProps) {
  if (hasGradientCover(note)) {
    return (
      <Box
        aria-hidden="true"
        backgroundImage={gradients.cover}
        overflow="hidden"
        {...props}
      />
    );
  }

  return (
    <Box overflow="hidden" bg="bg.subtle" {...props}>
      <chakra.img
        src={note.cover}
        alt={alt}
        display="block"
        width="100%"
        height="100%"
        objectFit="cover"
      />
    </Box>
  );
}

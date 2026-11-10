import { chakra } from '@chakra-ui/react';

import type { NoteAuthor } from '../../lib/notes';

export interface AuthorAvatarProps {
  readonly author: NoteAuthor;
  /** The circle's diameter in px: 36 on the article, 28 on the index. */
  readonly size: number;
}

/** "Ryan Hefner" → "RH"; one name → its first letter. */
export function authorInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '';
  const first = words[0][0] ?? '';
  const last = words.length > 1 ? (words[words.length - 1][0] ?? '') : '';
  return `${first}${last}`.toUpperCase();
}

/**
 * The author's circle avatar, falling back to their initials on `bg.subtle` when the note
 * has no `author.avatar`. Decorative: the name always sits next to it.
 */
export function AuthorAvatar({ author, size }: AuthorAvatarProps) {
  const common = {
    flex: '0 0 auto',
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: 'full',
    boxShadow: 'inset 0 0 0 1px {colors.border}',
  } as const;

  if (author.avatar) {
    return (
      <chakra.img
        src={author.avatar}
        alt=""
        {...common}
        objectFit="cover"
        bg="bg.subtle"
      />
    );
  }

  return (
    <chakra.span
      aria-hidden="true"
      {...common}
      display="inline-flex"
      alignItems="center"
      justifyContent="center"
      bg="bg.subtle"
      color="fg.muted"
      fontSize={`${Math.round(size * 0.38)}px`}
      fontWeight="medium"
      lineHeight="1"
      letterSpacing="0.02em"
    >
      {authorInitials(author.name)}
    </chakra.span>
  );
}

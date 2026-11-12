import { chakra, useSlotRecipe } from '@chakra-ui/react';
import NextLink from 'next/link';
import type { ComponentPropsWithRef, ReactNode } from 'react';

export interface TileProps extends Omit<
  ComponentPropsWithRef<typeof NextLink>,
  'children'
> {
  /** The name under the preview; "›" follows it on hover. */
  label: ReactNode;
  /** An optional two-line description under the label. */
  description?: ReactNode;
  /** The live preview drawn on the `bg.subtle` panel. */
  children?: ReactNode;
}

/**
 * A tile that is one link (`siteTile` recipe): preview panel, label with a hover "›",
 * optional description. Hover and press only change colour; focus rings the preview.
 */
export function Tile({
  label,
  description,
  children,
  className,
  ...linkProps
}: TileProps) {
  const recipe = useSlotRecipe({ key: 'siteTile' });
  const styles = recipe({});
  const classes = recipe.classNameMap ?? {};

  return (
    <chakra.a
      asChild
      className={[classes.root, className].filter(Boolean).join(' ')}
      css={styles.root}
    >
      <NextLink {...linkProps}>
        <chakra.span className={classes.preview} css={styles.preview}>
          {children}
        </chakra.span>
        <chakra.span className={classes.label} css={styles.label}>
          {label}
          <chakra.span
            aria-hidden="true"
            className={classes.chevron}
            css={styles.chevron}
          >
            ›
          </chakra.span>
        </chakra.span>
        {description ? (
          <chakra.span className={classes.description} css={styles.description}>
            {description}
          </chakra.span>
        ) : null}
      </NextLink>
    </chakra.a>
  );
}

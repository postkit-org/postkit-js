import { createRecipeContext, type HTMLChakraProps } from '@chakra-ui/react';
import type { MouseEvent } from 'react';

const { withContext } = createRecipeContext({ key: 'siteButton' });

export interface ButtonProps extends HTMLChakraProps<'button'> {
  /** `primary` (`bg.inverted`, one per view) or `secondary` (`bg.subtle`). */
  variant?: 'primary' | 'secondary';
  /** `md` is 40px tall (with a 44px hit area), `lg` is 48px. */
  size?: 'md' | 'lg';
}

const StyledButton = withContext<HTMLButtonElement, ButtonProps>('button');

/**
 * The site's pill button (`siteButton` recipe). `disabled` sets `aria-disabled` instead of
 * removing the control: it stays focusable and visible, and clicks are swallowed.
 * Use `asChild` to render a link: `<Button asChild><NextLink href="/docs">…</NextLink></Button>`.
 */
export function Button({
  disabled,
  onClick,
  type,
  asChild,
  ...props
}: ButtonProps) {
  return (
    <StyledButton
      {...props}
      asChild={asChild}
      type={asChild ? type : (type ?? 'button')}
      aria-disabled={disabled || props['aria-disabled'] || undefined}
      onClick={(event: MouseEvent<HTMLButtonElement>) => {
        if (disabled) {
          event.preventDefault();
          return;
        }
        onClick?.(event);
      }}
    />
  );
}

import { chakra, useSlotRecipe } from '@chakra-ui/react';
import { useId, type ComponentPropsWithRef, type ReactNode } from 'react';

export interface TextFieldProps extends Omit<
  ComponentPropsWithRef<'input'>,
  'size'
> {
  /** Always required for the accessible name; hide it visually with `hideLabel`. */
  label: ReactNode;
  hideLabel?: boolean;
  /** Shows the caution ring, sets `aria-invalid` and renders the message below with a "!" badge. */
  error?: ReactNode;
  /** `md` is 44px tall, `lg` 48px (the subscribe form). */
  size?: 'md' | 'lg';
  /** `rounded` (14px, 02 §4) or `pill` (as the boards draw it). */
  shape?: 'rounded' | 'pill';
  /** `subtle` when the field sits on a `bg.subtle` surface: the field turns `bg.raised`. */
  surface?: 'page' | 'subtle';
}

/**
 * A labelled text input (`siteTextField` recipe) with its error message wired up through
 * `aria-invalid` and `aria-describedby`.
 */
export function TextField({
  label,
  hideLabel = false,
  error,
  size = 'md',
  shape = 'rounded',
  surface = 'page',
  id,
  className,
  'aria-describedby': describedBy,
  'aria-invalid': ariaInvalid,
  ...inputProps
}: TextFieldProps) {
  const recipe = useSlotRecipe({ key: 'siteTextField' });
  const styles = recipe({ size, shape, surface });
  const classes = recipe.classNameMap ?? {};
  const generatedId = useId();
  const inputId = id ?? `text-field-${generatedId}`;
  const errorId = `${inputId}-error`;
  const hasError = error != null && error !== false && error !== '';

  return (
    <chakra.div
      className={[classes.root, className].filter(Boolean).join(' ')}
      css={styles.root}
    >
      <chakra.label
        htmlFor={inputId}
        className={classes.label}
        css={hideLabel ? { ...styles.label, srOnly: true } : styles.label}
      >
        {label}
      </chakra.label>
      <chakra.input
        {...inputProps}
        id={inputId}
        aria-invalid={hasError ? true : ariaInvalid}
        aria-describedby={
          [describedBy, hasError ? errorId : undefined]
            .filter(Boolean)
            .join(' ') || undefined
        }
        className={classes.input}
        css={styles.input}
      />
      {hasError ? (
        <chakra.p id={errorId} className={classes.error} css={styles.error}>
          <chakra.span
            aria-hidden="true"
            className={classes.errorBadge}
            css={styles.errorBadge}
          >
            !
          </chakra.span>
          {error}
        </chakra.p>
      ) : null}
    </chakra.div>
  );
}

import { chakra, type HTMLChakraProps } from '@chakra-ui/react';
import type { ReactNode } from 'react';

export interface CautionAlertProps extends Omit<
  HTMLChakraProps<'div'>,
  'title'
> {
  /** The first sentence, in medium weight: "We couldn’t sign you up just now." */
  readonly title: ReactNode;
  /** The rest, in regular weight: "Nothing was saved. Try again in a minute." */
  readonly children?: ReactNode;
}

/**
 * The caution-tinted error box from form state 6 (04 §2, SiteSignupStates), also used by the
 * unsubscribe page's "Couldn't unsubscribe" state (04 §1a). `role="alert"`, so it's
 * announced as soon as it appears.
 */
export function CautionAlert({ title, children, ...props }: CautionAlertProps) {
  return (
    <chakra.div
      role="alert"
      display="flex"
      gap="10px"
      padding="12px 14px"
      borderRadius="md"
      bg="tint.caution"
      color="fg"
      fontSize="14px"
      lineHeight="1.45"
      textAlign="left"
      {...props}
    >
      <chakra.span
        aria-hidden="true"
        flex="0 0 18px"
        height="18px"
        marginTop="1px"
        borderRadius="full"
        bg="tone.caution"
        color="fg.inverted"
        fontSize="9px"
        fontWeight="semibold"
        lineHeight="1"
        display="inline-flex"
        alignItems="center"
        justifyContent="center"
      >
        !
      </chakra.span>
      <span>
        <chakra.span fontWeight="medium">{title}</chakra.span>
        {children ? <> {children}</> : null}
      </span>
    </chakra.div>
  );
}

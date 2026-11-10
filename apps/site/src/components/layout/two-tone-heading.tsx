import { chakra, type HTMLChakraProps } from '@chakra-ui/react';
import type { ReactNode } from 'react';

export type TwoToneHeadingTextStyle =
  'hero' | 'pageTitle' | 'section' | 'docsH2';

export interface TwoToneHeadingProps extends Omit<
  HTMLChakraProps<'h1'>,
  'title' | 'as' | 'textStyle'
> {
  /** The heading element. Defaults to `h2`. */
  readonly as?: 'h1' | 'h2' | 'h3';
  /** A type style from 02 §2. Defaults to `section`. */
  readonly textStyle?: TwoToneHeadingTextStyle;
  /** The statement, in `fg`: "Callout." */
  readonly title: ReactNode;
  /** The value line, in `fg.quiet`: "Make sure the important part gets read." */
  readonly quiet?: ReactNode;
}

const elements = { h1: chakra.h1, h2: chakra.h2, h3: chakra.h3 } as const;

/**
 * A two-tone headline (02 §1–2): the statement in `fg`, then the value line in `fg.quiet`
 * at the same weight, as a `<span>` inside the same heading, so it reads as one heading.
 * Write both halves wherever the boards show them. `quiet` is optional only for the
 * headings the boards set in one tone (docs `h2`s).
 *
 * Other Chakra style props (`maxW`, `marginTop`, `textAlign`…) pass through.
 */
export function TwoToneHeading({
  as = 'h2',
  textStyle = 'section',
  title,
  quiet,
  ...props
}: TwoToneHeadingProps) {
  const Heading = elements[as];

  return (
    <Heading
      textStyle={textStyle}
      fontFamily="heading"
      color="fg"
      margin="0"
      css={{ textWrap: 'balance' }}
      {...props}
    >
      {title}
      {quiet ? (
        <>
          {' '}
          <chakra.span color="fg.quiet">{quiet}</chakra.span>
        </>
      ) : null}
    </Heading>
  );
}

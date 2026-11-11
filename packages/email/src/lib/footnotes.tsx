import { Column, Row, Section, Text } from '@chakra-email/core';
import { Children, isValidElement, type ReactNode } from 'react';

import { usePostkitEmailGrays } from './theme.js';

/**
 * Footnotes in email (03 §7.1): always end notes, with superscript numbers
 * and no links, since in-message anchors are unreliable across clients.
 * Every placement (side, popover, inline) becomes the end list.
 */

/** Numbering formats, as `@postkit/core` names them. */
export type PostkitEmailFootnoteNumbering =
  'decimal' | 'lower-alpha' | 'lower-roman' | 'symbol';

const symbols = ['*', '†', '‡', '§', '‖', '¶'] as const;

function alpha(index: number): string {
  let value = index;
  let result = '';
  while (value > 0) {
    value -= 1;
    result = String.fromCharCode(97 + (value % 26)) + result;
    value = Math.floor(value / 26);
  }
  return result;
}

function roman(index: number): string {
  const numerals = [
    [1000, 'm'],
    [900, 'cm'],
    [500, 'd'],
    [400, 'cd'],
    [100, 'c'],
    [90, 'xc'],
    [50, 'l'],
    [40, 'xl'],
    [10, 'x'],
    [9, 'ix'],
    [5, 'v'],
    [4, 'iv'],
    [1, 'i'],
  ] as const;
  let value = index;
  let result = '';
  for (const [amount, numeral] of numerals) {
    while (value >= amount) {
      result += numeral;
      value -= amount;
    }
  }
  return result;
}

/** A note's mark: `1`, `ii`, `b` or `†`. Matches `@postkit/core`'s numbering. */
export function postkitEmailFootnoteMark(
  index: number,
  numbering: PostkitEmailFootnoteNumbering | undefined = 'decimal',
): string {
  if (!Number.isFinite(index) || index < 1) return String(index);
  switch (numbering) {
    case 'lower-roman':
      return roman(index);
    case 'lower-alpha':
      return alpha(index);
    case 'symbol': {
      const symbol = symbols[(index - 1) % symbols.length] as string;
      return symbol.repeat(Math.floor((index - 1) / symbols.length) + 1);
    }
    default:
      return String(index);
  }
}

function number(value: unknown, fallback: number): number {
  const parsed = typeof value === 'string' ? Number(value) : value;
  return typeof parsed === 'number' && Number.isFinite(parsed) && parsed > 0
    ? Math.trunc(parsed)
    : fallback;
}

function numbering(value: unknown): PostkitEmailFootnoteNumbering {
  return value === 'lower-alpha' ||
    value === 'lower-roman' ||
    value === 'symbol'
    ? value
    : 'decimal';
}

export interface FootnoteProps {
  /** The note's number, by order of first reference. */
  readonly index?: number | string;
  readonly numbering?: PostkitEmailFootnoteNumbering;
  /**
   * The note's content. Ignored here: in email the note is only in the end
   * list.
   */
  readonly children?: ReactNode;
  readonly [prop: string]: unknown;
}

/** A footnote mark: a superscript number, without a link. */
export function Footnote({ index, numbering: format }: FootnoteProps) {
  const mark = postkitEmailFootnoteMark(number(index, 1), numbering(format));
  return (
    <sup
      data-postkit-component="Footnote"
      style={{ fontSize: '0.75em', lineHeight: 0, verticalAlign: 'super' }}
    >
      {mark}
    </sup>
  );
}

export interface FootnotesProps {
  /** The list heading. Defaults to "Notes"; `false` hides it. */
  readonly title?: string | false;
  readonly numbering?: PostkitEmailFootnoteNumbering;
  /** The notes, as `Footnote` elements (the Markdown tooling writes them). */
  readonly children?: ReactNode;
  readonly [prop: string]: unknown;
}

/** The notes at the end of the message: `1. Note text`, no backlinks. */
export function Footnotes({
  title,
  numbering: format,
  children,
}: FootnotesProps) {
  const gray = usePostkitEmailGrays();
  const notes = Children.toArray(children).flatMap((child, position) => {
    if (!isValidElement(child)) return [];
    const props = child.props as {
      readonly index?: unknown;
      readonly children?: ReactNode;
    };
    return [
      { index: number(props.index, position + 1), content: props.children },
    ];
  });
  if (notes.length === 0) return null;
  const heading =
    title === false || String(title) === 'false'
      ? undefined
      : typeof title === 'string' && title.trim()
        ? title
        : 'Notes';
  const style = numbering(format);
  return (
    <Section
      data-postkit-component="Footnotes"
      borderTop={`1px solid ${gray[200]}`}
      pt={3}
      mt={6}
      mb={4}
    >
      {heading ? (
        <Text color={gray[600]} fontSize="sm" fontWeight="bold" mb={2}>
          {heading}
        </Text>
      ) : null}
      {/* A row per note: the number in its own cell keeps block content
          (paragraphs, lists) beside it in every client. */}
      <table
        role="presentation"
        width="100%"
        cellPadding={0}
        cellSpacing={0}
        style={{ borderCollapse: 'collapse' }}
      >
        <tbody>
          {notes.map((note) => (
            <Row key={note.index}>
              <Column width={28} style={{ verticalAlign: 'top' }}>
                <Text color={gray[600]} fontSize="sm" mb={2}>
                  {`${postkitEmailFootnoteMark(note.index, style)}${style === 'symbol' ? '' : '.'}`}
                </Text>
              </Column>
              <Column style={{ verticalAlign: 'top' }}>
                <Text as="div" color={gray[700]} fontSize="sm" mb={2}>
                  {note.content}
                </Text>
              </Column>
            </Row>
          ))}
        </tbody>
      </table>
    </Section>
  );
}

/** The footnote views for an email MDX component map. */
export const postkitEmailFootnoteComponents = Object.freeze({
  Footnote,
  Footnotes,
});

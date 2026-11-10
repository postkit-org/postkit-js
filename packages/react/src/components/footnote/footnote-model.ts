import {
  parsePostkitFootnotePlacement,
  postkitDefaultSideBreakpoint,
  postkitFootnoteMarkers,
  postkitFootnoteNumberings,
  postkitFootnotePlacementSteps,
  postkitFootnotePlacementsUsed,
  postkitFootnoteScope,
  type PostkitFootnoteMarker,
  type PostkitFootnoteNumberingValue,
  type PostkitFootnotePlacementValue,
} from '@postkit/core/components';
import { Children, isValidElement, type ReactNode } from 'react';

/** The settings a reference and its list share, after defaults (03 §7.1). */
export interface PostkitFootnoteSettings {
  readonly marker: PostkitFootnoteMarker;
  readonly numbering: PostkitFootnoteNumberingValue;
  readonly placement: PostkitFootnotePlacementValue;
  readonly sideBreakpoint: number;
  readonly scope: string | undefined;
}

/** The shared props as a view receives them, before defaults. */
export interface PostkitFootnoteSettingsInput {
  readonly marker?: unknown;
  readonly numbering?: unknown;
  readonly placement?: unknown;
  readonly sideBreakpoint?: unknown;
  readonly scope?: unknown;
}

function pick<Value extends string>(
  values: readonly Value[],
  ...candidates: unknown[]
): Value | undefined {
  return candidates.find((candidate): candidate is Value =>
    values.includes(candidate as Value),
  );
}

/** A number from a prop that may be a string (`index="2"` in MDX). */
export function postkitFootnoteNumber(
  value: unknown,
  fallback: number,
): number {
  const parsed = typeof value === 'string' ? Number(value) : value;
  return typeof parsed === 'number' && Number.isFinite(parsed) && parsed > 0
    ? Math.trunc(parsed)
    : fallback;
}

/**
 * Resolves the settings a reference and the list share: the view's own
 * prop, then the site's `Footnotes` defaults, then the built-in default, so
 * one site setting styles both.
 */
export function resolvePostkitFootnoteSettings(
  props: PostkitFootnoteSettingsInput,
  listDefaults: Readonly<Record<string, unknown>> | undefined,
): PostkitFootnoteSettings {
  const numbering =
    typeof props.numbering === 'function'
      ? (props.numbering as (index: number) => string)
      : typeof listDefaults?.['numbering'] === 'function' &&
          props.numbering === undefined
        ? (listDefaults['numbering'] as (index: number) => string)
        : (pick(
            postkitFootnoteNumberings,
            props.numbering,
            listDefaults?.['numbering'],
          ) ?? 'decimal');
  return {
    marker:
      pick(postkitFootnoteMarkers, props.marker, listDefaults?.['marker']) ??
      'superscript',
    numbering,
    placement:
      parsePostkitFootnotePlacement(props.placement) ??
      parsePostkitFootnotePlacement(listDefaults?.['placement']) ??
      'end',
    sideBreakpoint: postkitFootnoteNumber(
      props.sideBreakpoint ?? listDefaults?.['sideBreakpoint'],
      postkitDefaultSideBreakpoint,
    ),
    scope: postkitFootnoteScope(props.scope ?? listDefaults?.['scope']),
  };
}

/** `data-placement`: `end`, or the steps of a responsive value (`inline md:end xl:side`). */
export function postkitFootnotePlacementAttribute(
  value: PostkitFootnotePlacementValue,
): string {
  return postkitFootnotePlacementSteps(value)
    .map(([breakpoint, placement]) =>
      breakpoint === 'base' ? placement : `${breakpoint}:${placement}`,
    )
    .join(' ');
}

/** Whether a placement value ever shows notes beside their references. */
export function postkitFootnoteUsesSidenotes(
  value: PostkitFootnotePlacementValue,
): boolean {
  const used = postkitFootnotePlacementsUsed(value);
  return used.has('side') || used.has('popover') || used.has('inline');
}

/** One note in a `Footnotes` list. */
export interface PostkitFootnoteListNote {
  readonly index: number;
  readonly identifier: string | undefined;
  readonly references: number;
  readonly content: ReactNode;
}

/**
 * The notes a `Footnotes` list holds: its children are `Footnote` elements
 * (the Markdown tooling writes them), read for their number, reference
 * count and content. Children without an `index` are numbered in order.
 */
export function postkitFootnoteListNotes(
  children: ReactNode,
): PostkitFootnoteListNote[] {
  return Children.toArray(children).flatMap((child, position) => {
    if (!isValidElement(child)) return [];
    const props = child.props as {
      readonly index?: unknown;
      readonly identifier?: unknown;
      readonly references?: unknown;
      readonly children?: ReactNode;
    };
    return [
      {
        index: postkitFootnoteNumber(props.index, position + 1),
        identifier:
          typeof props.identifier === 'string' ? props.identifier : undefined,
        references: postkitFootnoteNumber(props.references, 1),
        content: props.children,
      },
    ];
  });
}

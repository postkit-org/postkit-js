import {
  footnoteDefinition,
  formatPostkitFootnoteNumber,
  postkitFootnoteIds,
  type PostkitFootnoteNumberingValue,
  type PostkitSlotOf,
} from '@postkit/core/components';

import { usePostkitComponentConfig } from '../../lib/config.js';
import { postkitView, type PostkitViewProps } from '../../lib/view.js';
import { Sidenote } from '../sidenote/sidenote.js';
import {
  postkitFootnoteNumber,
  postkitFootnotePlacementAttribute,
  postkitFootnoteUsesSidenotes,
  resolvePostkitFootnoteSettings,
} from './footnote-model.js';

export type FootnoteSlot = PostkitSlotOf<typeof footnoteDefinition>;

export type FootnoteProps = Omit<
  PostkitViewProps<typeof footnoteDefinition>,
  'numbering'
> & {
  /** A numbering format, or a function from the note's number to its mark. */
  readonly numbering?: PostkitFootnoteNumberingValue;
};

/**
 * A footnote reference (03 §7.1): a mark linking to its note in the
 * `Footnotes` list. Its content (the note) is copied beside the first
 * reference as a `Sidenote` when the placement can show it in place; the
 * footnotes behaviour reveals it. Shared settings (marker, numbering,
 * placement) fall back to the site's `Footnotes` defaults.
 */
export const Footnote = postkitView<typeof footnoteDefinition, FootnoteProps>(
  footnoteDefinition,
  ({ props, part }) => {
    const settings = resolvePostkitFootnoteSettings(
      props,
      usePostkitComponentConfig('Footnotes')?.defaults,
    );
    const index = postkitFootnoteNumber(props.index, 1);
    const occurrence = postkitFootnoteNumber(props.occurrence, 1);
    const ids = postkitFootnoteIds(index, settings.scope);
    const mark = formatPostkitFootnoteNumber(index, settings.numbering);
    const hasNote =
      props.children !== undefined &&
      props.children !== null &&
      props.children !== false;
    return (
      <span
        {...part('root')}
        id={ids.reference(occurrence)}
        data-marker={settings.marker}
        data-placement={postkitFootnotePlacementAttribute(settings.placement)}
      >
        <a
          {...part('marker')}
          href={`#${ids.note}`}
          role="doc-noteref"
          aria-label={`Note ${mark}`}
        >
          {settings.marker === 'superscript' ? (
            <sup>{mark}</sup>
          ) : settings.marker === 'bracket' ? (
            `[${mark}]`
          ) : (
            mark
          )}
        </a>
        {hasNote &&
        occurrence === 1 &&
        postkitFootnoteUsesSidenotes(settings.placement) ? (
          <Sidenote
            index={index}
            mark={mark}
            size={props.size}
            variant={props.variant}
            rootProps={{ id: ids.sidenote, hidden: true }}
          >
            {props.children}
          </Sidenote>
        ) : null}
      </span>
    );
  },
);

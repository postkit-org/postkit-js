// @vitest-environment jsdom
import {
  formatPostkitFootnoteNumber,
  postkitFootnoteBacklinkLabel,
  postkitFootnoteIds,
} from '../../components/footnote/footnote.model.js';
import {
  createBareDriver,
  element,
} from '../testing/bare-driver.spec-support.js';
import { registerBehaviorSpec } from '../testing/harness.js';
import {
  footnotesBehaviorSpec,
  type FootnotesBehaviorFixture,
} from './footnotes.behavior.spec-suite.js';
import {
  createFootnotes,
  layoutPostkitSidenotes,
  type FootnotesBehaviorApi,
} from './footnotes.behavior.js';

/** The anatomy every renderer emits, written by hand. */
const driver = createBareDriver<FootnotesBehaviorFixture, FootnotesBehaviorApi>(
  (container, fixture) => {
    fixture.notes.forEach((note, position) => {
      const index = position + 1;
      const ids = postkitFootnoteIds(index, fixture.scope);
      for (let occurrence = 1; occurrence <= note.references; occurrence += 1) {
        const paragraph = element('p', 'Text');
        const reference = element('sup');
        reference.id = ids.reference(occurrence);
        reference.setAttribute('data-postkit-component', 'Footnote');
        reference.setAttribute('data-postkit-part', 'root');
        const marker = element('a', formatPostkitFootnoteNumber(index));
        marker.href = `#${ids.note}`;
        marker.setAttribute('data-postkit-part', 'marker');
        reference.append(marker);
        if (occurrence === 1) {
          const sidenote = element('span', note.text);
          sidenote.id = ids.sidenote;
          sidenote.hidden = true;
          sidenote.setAttribute('data-postkit-component', 'Sidenote');
          reference.append(sidenote);
        }
        paragraph.append(reference, '.');
        container.append(paragraph);
      }
    });
    const list = element('section');
    list.setAttribute('data-postkit-component', 'Footnotes');
    const items = element('ol');
    fixture.notes.forEach((note, position) => {
      const index = position + 1;
      const ids = postkitFootnoteIds(index, fixture.scope);
      const item = element('li', note.text);
      item.id = ids.note;
      item.setAttribute('data-postkit-part', 'item');
      item.setAttribute('data-footnote-index', String(index));
      item.setAttribute('data-footnote-references', String(note.references));
      for (let occurrence = 1; occurrence <= note.references; occurrence += 1) {
        const backlink = element(
          'a',
          note.references > 1 ? postkitFootnoteBacklinkLabel(occurrence) : '↩',
        );
        backlink.href = `#${ids.reference(occurrence)}`;
        item.append(' ', backlink);
      }
      items.append(item);
    });
    list.append(items);
    container.append(list);
    return {
      behavior: createFootnotes({
        root: list,
        placement: fixture.placement,
        sideBreakpoint: fixture.sideBreakpoint,
        scope: fixture.scope,
      }),
      update: () => undefined,
    };
  },
);

registerBehaviorSpec(
  footnotesBehaviorSpec(driver),
  { describe, it },
  {
    label: 'bare behaviour',
  },
);

describe('sidenote layout', () => {
  it('starts each note at its line and pushes a later note down', () => {
    expect(
      layoutPostkitSidenotes(
        [
          { top: 100, height: 80 },
          { top: 120, height: 40 },
          { top: 400, height: 20 },
        ],
        { gap: 16 },
      ),
    ).toEqual([100, 196, 400]);
  });
});

import {
  footnotesBehaviorSpec,
  registerBehaviorSpec,
  type FootnotesBehaviorFixture,
} from '@postkit/core/behaviors/testing';

import {
  runner,
  testingLibraryDriver,
} from '../../lib/testing-library-driver.spec-support.js';
import { Footnote } from '../footnote/footnote.js';
import { Footnotes } from './footnotes.js';

/** The shared article: one paragraph per reference, then the list. */
export function FootnotesFixture({
  fixture,
}: {
  readonly fixture: FootnotesBehaviorFixture;
}) {
  const shared = {
    placement: fixture.placement,
    scope: fixture.scope,
    ...(fixture.sideBreakpoint === undefined
      ? {}
      : { sideBreakpoint: fixture.sideBreakpoint }),
  };
  return (
    <div>
      {fixture.notes.flatMap((note, position) =>
        Array.from({ length: note.references }, (_, occurrence) => (
          <p key={`${position}-${occurrence}`}>
            Text
            <Footnote
              {...shared}
              index={position + 1}
              occurrence={occurrence + 1}
            >
              {occurrence === 0 ? note.text : undefined}
            </Footnote>
            .
          </p>
        )),
      )}
      <Footnotes {...shared}>
        {fixture.notes.map((note, position) => (
          <Footnote
            key={position}
            index={position + 1}
            references={note.references}
          >
            <p>{note.text}</p>
          </Footnote>
        ))}
      </Footnotes>
    </div>
  );
}

registerBehaviorSpec(
  footnotesBehaviorSpec(
    testingLibraryDriver((fixture) => <FootnotesFixture fixture={fixture} />),
  ),
  runner,
  { label: '@postkit/react Footnotes' },
);

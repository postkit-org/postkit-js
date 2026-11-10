import { defaultSystem } from '@chakra-ui/react';
import {
  footnotesBehaviorSpec,
  registerBehaviorSpec,
  settle,
  type BehaviorDriver,
  type FootnotesBehaviorFixture,
} from '@postkit/core/behaviors/testing';
import { act, cleanup, render, waitFor } from '@testing-library/react';

import { PostkitProvider } from '../../lib/provider.js';
import { Footnote } from '../footnote/footnote.js';
import { Footnotes } from './footnotes.js';

/** The shared article: one paragraph per reference, then the list. */
function FootnotesFixture({
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

/**
 * Runs the shared footnotes spec from `@postkit/core/behaviors/testing`
 * against the Chakra views, with Chakra's default breakpoints.
 */
const driver: BehaviorDriver<FootnotesBehaviorFixture> = {
  async render(fixture) {
    const { container } = render(
      <PostkitProvider system={defaultSystem}>
        <FootnotesFixture fixture={fixture} />
      </PostkitProvider>,
    );
    await act(async () => {
      await settle();
    });
    return container;
  },
  async interact(action) {
    await act(async () => {
      action();
      await settle();
    });
  },
  waitFor: (assertion, options) =>
    waitFor(assertion, { timeout: options?.timeout ?? 2000 }),
  cleanup: () => cleanup(),
};

registerBehaviorSpec(
  footnotesBehaviorSpec(driver),
  { describe, it },
  {
    label: '@postkit/chakra Footnotes',
  },
);

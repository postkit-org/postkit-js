import { settle, type BehaviorDriver } from '@postkit/core/behaviors/testing';
import { act, cleanup, render, waitFor } from '@testing-library/react';
import type { ReactElement } from 'react';

/**
 * A Testing Library driver for the shared behaviour specs in
 * `@postkit/core/behaviors/testing`, mirroring the one `@postkit/chakra` runs
 * its views with: the headless views must pass the same specs.
 */
export function testingLibraryDriver<Fixture>(
  view: (fixture: Fixture) => ReactElement,
): BehaviorDriver<Fixture> {
  return {
    async render(fixture) {
      const { container } = render(view(fixture));
      // Zag starts its machines in an effect; let it settle.
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
}

/** The runner the specs register their cases with. */
export const runner = { describe, it };

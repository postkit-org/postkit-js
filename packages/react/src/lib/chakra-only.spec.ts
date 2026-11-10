import { postkitBuiltInDefinitions } from '@postkit/core/components';

import * as Headless from '../index.js';
import { chakraOnly } from './chakra-only.js';

describe('chakraOnly', () => {
  it('lists built-in components that have no headless view', () => {
    const names = new Set<string>(
      Object.values(postkitBuiltInDefinitions).map(
        (definition) => definition.name,
      ),
    );
    for (const name of chakraOnly) {
      expect(names.has(name)).toBe(true);
      expect(Headless).not.toHaveProperty(name);
    }
  });
});

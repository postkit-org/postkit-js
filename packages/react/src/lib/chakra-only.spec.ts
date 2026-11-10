import { postkitBuiltInDefinitions } from '@postkit/core/components';

import * as Headless from '../index.js';
import { chakraOnly } from './chakra-only.js';

describe('chakraOnly', () => {
  it('names built-in components that have no headless view', () => {
    const builtIns = new Set(
      Object.values(postkitBuiltInDefinitions).map(
        (definition) => definition.name,
      ),
    );
    for (const name of chakraOnly) {
      expect(builtIns.has(name)).toBe(true);
      expect(Headless).not.toHaveProperty(name);
    }
    expect(Object.isFrozen(chakraOnly)).toBe(true);
  });
});

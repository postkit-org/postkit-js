import { postkitBuiltInDefinitions } from '@postkit/core/components';

import * as Headless from '../index.js';
import { chakraOnly } from './chakra-only.js';

describe('chakraOnly', () => {
  it('lists built-in components that have no headless view', () => {
    const exported = Headless as Record<string, unknown>;
    for (const name of chakraOnly) {
      expect(postkitBuiltInDefinitions[name].name).toBe(name);
      expect(exported[name]).toBeUndefined();
    }
  });
});

import { postkitBuiltInDefinitions } from '@postkit/core/components';

import * as Headless from '../index.js';
import { chakraOnly } from './chakra-only.js';

describe('chakraOnly', () => {
  it('lists built-in components that have no headless view', () => {
    for (const name of chakraOnly) {
      expect(postkitBuiltInDefinitions[name].name).toBe(name);
      expect(name in Headless).toBe(false);
    }
  });
});

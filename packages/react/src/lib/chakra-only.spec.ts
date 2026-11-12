import {
  postkitBuiltInDefinitions,
  type PostkitBuiltInComponentName,
} from '@postkit/core/components';

import * as Headless from '../index.js';
import { chakraOnly } from './chakra-only.js';

describe('chakraOnly', () => {
  it('lists built-in components that have no headless view', () => {
    const exported = Headless as Record<string, unknown>;
    for (const name of chakraOnly as readonly PostkitBuiltInComponentName[]) {
      expect(postkitBuiltInDefinitions[name].name).toBe(name);
      expect(exported[name]).toBeUndefined();
    }
  });

  it('is empty and frozen: every built-in component has a headless view', () => {
    expect(chakraOnly).toEqual([]);
    expect(Object.isFrozen(chakraOnly)).toBe(true);
    const exported = Headless as Record<string, unknown>;
    for (const name of Object.keys(postkitBuiltInDefinitions)) {
      expect(exported[name], name).toBeTypeOf('function');
    }
  });
});

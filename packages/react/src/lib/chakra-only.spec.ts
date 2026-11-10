import * as Headless from '../index.js';
import { chakraOnly } from './chakra-only.js';

describe('chakraOnly', () => {
  it('lists only components @postkit/react has no view for', () => {
    const exported = Headless as Record<string, unknown>;
    for (const name of chakraOnly) expect(exported[name]).toBeUndefined();
  });
});

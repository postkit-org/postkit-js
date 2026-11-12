import {
  registerBehaviorSpec,
  tabsBehaviorSpec,
} from '@postkit/core/behaviors/testing';

import {
  runner,
  testingLibraryDriver,
} from '../../lib/testing-library-driver.spec-support.js';
import { Tabs } from './tabs.js';

registerBehaviorSpec(
  tabsBehaviorSpec(
    testingLibraryDriver((fixture) => (
      <Tabs
        label={fixture.label}
        initialIndex={fixture.initialIndex}
        items={fixture.items.map((item) => ({
          id: item.value,
          label: item.label,
          content: item.content,
        }))}
      />
    )),
  ),
  runner,
  { label: '@postkit/react Tabs' },
);

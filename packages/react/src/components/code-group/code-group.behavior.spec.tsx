import {
  registerBehaviorSpec,
  tabsBehaviorSpec,
} from '@postkit/core/behaviors/testing';

import {
  runner,
  testingLibraryDriver,
} from '../../lib/testing-library-driver.spec-support.js';
import { CodeGroup } from './code-group.js';

registerBehaviorSpec(
  tabsBehaviorSpec(
    testingLibraryDriver((fixture) => (
      <CodeGroup
        label={fixture.label}
        initialIndex={fixture.initialIndex}
        items={fixture.items.map((item) => ({
          label: item.label,
          code: item.content,
          language: 'sh',
        }))}
      />
    )),
  ),
  runner,
  { label: '@postkit/react CodeGroup' },
);

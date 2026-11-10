import {
  registerBehaviorSpec,
  shareActionsBehaviorSpec,
} from '@postkit/core/behaviors/testing';

import {
  runner,
  testingLibraryDriver,
} from '../../lib/testing-library-driver.spec-support.js';
import { ShareActions } from './share-actions.js';

registerBehaviorSpec(
  shareActionsBehaviorSpec(
    testingLibraryDriver((fixture) => (
      <ShareActions
        url={fixture.url}
        title={fixture.title}
        text={fixture.text}
        label={fixture.label}
        services={fixture.services}
        onShare={fixture.onShare}
      />
    )),
  ),
  runner,
  { label: '@postkit/react ShareActions' },
);

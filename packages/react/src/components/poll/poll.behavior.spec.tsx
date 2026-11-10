import {
  pollBehaviorSpec,
  registerBehaviorSpec,
} from '@postkit/core/behaviors/testing';

import {
  runner,
  testingLibraryDriver,
} from '../../lib/testing-library-driver.spec-support.js';
import { Poll } from './poll.js';

registerBehaviorSpec(
  pollBehaviorSpec(
    testingLibraryDriver((fixture) => (
      <Poll
        question={fixture.question}
        options={fixture.options}
        totalVotes={fixture.totalVotes}
        selectedId={fixture.selectedId}
        onVote={fixture.onVote}
      />
    )),
  ),
  runner,
  { label: '@postkit/react Poll' },
);

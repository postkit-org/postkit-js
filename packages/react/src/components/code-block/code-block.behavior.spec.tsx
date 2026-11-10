import {
  codeCopyBehaviorSpec,
  registerBehaviorSpec,
} from '@postkit/core/behaviors/testing';

import {
  runner,
  testingLibraryDriver,
} from '../../lib/testing-library-driver.spec-support.js';
import { CodeBlock } from './code-block.js';

for (const copyFeedback of ['inline', 'tooltip'] as const) {
  registerBehaviorSpec(
    codeCopyBehaviorSpec(
      testingLibraryDriver((fixture) => (
        <CodeBlock
          code={fixture.code}
          language="sh"
          copyAriaLabel={fixture.label}
          copyLabel={fixture.label}
          copiedLabel={fixture.copiedLabel}
          copyFeedback={copyFeedback}
        />
      )),
    ),
    runner,
    { label: `@postkit/react CodeBlock, ${copyFeedback} feedback` },
  );
}

import {
  embedConsentBehaviorSpec,
  registerBehaviorSpec,
  type EmbedConsentBehaviorFixture,
} from '@postkit/core/behaviors/testing';
import type { ResolvedLinkPreview } from '@postkit/unfurl';

import {
  runner,
  testingLibraryDriver,
} from '../../lib/testing-library-driver.spec-support.js';
import { LinkPreview } from './link-preview.js';

/** The fixture as resolved metadata, as the Chakra registration builds it. */
function embedMetadata(
  fixture: EmbedConsentBehaviorFixture,
): ResolvedLinkPreview {
  return {
    requestedUrl: fixture.href,
    url: fixture.href,
    title: fixture.title,
    siteName: fixture.provider,
    images: [],
    audio: [],
    video: [],
    embed: { type: 'video', src: fixture.src, title: fixture.title },
    provider: { id: 'fixture' },
  };
}

registerBehaviorSpec(
  embedConsentBehaviorSpec(
    testingLibraryDriver((fixture) => (
      <LinkPreview
        href={fixture.href}
        presentation="embed"
        activation={fixture.activation}
        metadata={embedMetadata(fixture)}
      />
    )),
  ),
  runner,
  { label: '@postkit/react LinkPreview' },
);

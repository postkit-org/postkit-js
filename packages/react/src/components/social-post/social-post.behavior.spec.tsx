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
import { SocialPost } from './social-post.js';

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
      <SocialPost
        href={fixture.href}
        activation={fixture.activation}
        metadata={embedMetadata(fixture)}
      />
    )),
  ),
  runner,
  { label: '@postkit/react SocialPost' },
);

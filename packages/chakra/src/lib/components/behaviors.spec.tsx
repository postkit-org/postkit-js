import { defaultSystem } from '@chakra-ui/react';
import {
  carouselBehaviorSpec,
  codeCopyBehaviorSpec,
  embedConsentBehaviorSpec,
  registerBehaviorSpec,
  settle,
  tabsBehaviorSpec,
  type BehaviorDriver,
  type EmbedConsentBehaviorFixture,
} from '@postkit/core/behaviors/testing';
import type { ResolvedLinkPreview } from '@postkit/unfurl';
import { act, cleanup, render, waitFor } from '@testing-library/react';
import type { ReactElement } from 'react';

import { PostkitProvider } from '../provider.js';
import { Tabs } from '../../components/tabs/tabs.js';
import { Carousel } from '../../components/carousel/carousel.js';
import { LinkPreview } from '../../components/link-preview/link-preview.js';
import { SocialPost } from '../../components/social-post/social-post.js';
import { CodeBlock } from '../../components/code-block/code-block.js';
import { CodeGroup } from '../../components/code-group/code-group.js';

/**
 * Runs the shared behaviour specs from `@postkit/core/behaviors/testing`
 * against today's Chakra components (03 §5.3): Chakra keeps its Ark
 * implementation as long as it passes the same specs as the bare machines.
 */
function testingLibraryDriver<Fixture>(
  view: (fixture: Fixture) => ReactElement,
): BehaviorDriver<Fixture> {
  return {
    async render(fixture) {
      const { container } = render(
        <PostkitProvider system={defaultSystem}>
          {view(fixture)}
        </PostkitProvider>,
      );
      // Ark starts its machines in a microtask after layout effects.
      await act(async () => {
        await settle();
      });
      return container;
    },
    async interact(action) {
      await act(async () => {
        action();
        await settle();
      });
    },
    waitFor: (assertion, options) =>
      waitFor(assertion, { timeout: options?.timeout ?? 2000 }),
    cleanup: () => cleanup(),
  };
}

const runner = { describe, it };

registerBehaviorSpec(
  carouselBehaviorSpec(
    testingLibraryDriver((fixture) => (
      <Carousel
        label={fixture.label}
        initialIndex={fixture.initialIndex}
        items={fixture.slides.map((title) => ({ title }))}
      />
    )),
  ),
  runner,
  { label: '@postkit/chakra Carousel' },
);

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
  { label: '@postkit/chakra Tabs' },
);

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
  { label: '@postkit/chakra CodeGroup' },
);

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
    { label: `@postkit/chakra CodeBlock, ${copyFeedback} feedback` },
  );
}

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
  { label: '@postkit/chakra LinkPreview' },
);

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
  { label: '@postkit/chakra SocialPost' },
);

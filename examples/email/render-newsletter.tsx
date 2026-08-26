import { render } from '@chakra-email/core';
import { Callout, CallToAction, PostkitEmailProvider } from '@postkit/email';

export function renderPostkitNewsletter(): Promise<string> {
  return render(
    <PostkitEmailProvider>
      <Callout title="Before you publish" tone="warning">
        Review the destination and audience for this newsletter.
      </Callout>
      <CallToAction
        title="Read the field guide"
        description="A practical guide to portable publishing workflows."
        primaryLabel="Read now"
        primaryHref="https://example.com/field-guide"
      />
    </PostkitEmailProvider>,
  );
}

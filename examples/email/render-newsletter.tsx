import { render } from '@chakra-email/core';
import {
  PostkitEmailCallout,
  PostkitEmailCallToAction,
  PostkitEmailProvider,
} from '@postkit/email';

export function renderPostkitNewsletter(): Promise<string> {
  return render(
    <PostkitEmailProvider>
      <PostkitEmailCallout title="Before you publish" tone="warning">
        Review the destination and audience for this newsletter.
      </PostkitEmailCallout>
      <PostkitEmailCallToAction
        title="Read the field guide"
        description="A practical guide to portable publishing workflows."
        primaryLabel="Read now"
        primaryHref="https://example.com/field-guide"
      />
    </PostkitEmailProvider>,
  );
}

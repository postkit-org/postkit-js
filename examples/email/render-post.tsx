import { Body, Container, Html, Text } from '@chakra-email/core';
import { renderEmail, type RenderEmailResult } from '@postkit/email';
import type { ReactNode } from 'react';

function Layout({ children }: { readonly children?: ReactNode }) {
  return (
    <Html lang="en">
      <Body bg="white">
        <Container maxW="600px" px="20px" py="32px">
          {children}
          <Text fontSize="sm">You subscribed at example.com.</Text>
        </Container>
      </Body>
    </Html>
  );
}

/** A post's Markdown, with directives, as an email: HTML, plain text and warnings. */
export function renderPostEmail(markdown: string): Promise<RenderEmailResult> {
  return renderEmail(markdown, {
    format: 'markdown',
    baseUrl: 'https://example.com',
    url: 'https://example.com/notes/hello',
    wrapper: Layout,
  });
}

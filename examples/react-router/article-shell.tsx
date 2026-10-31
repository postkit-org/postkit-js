import { PostkitProvider, postkitDefaultTheme } from '@postkit/chakra';
import type { ReactNode } from 'react';
import { BrowserRouter } from 'react-router';

export function ArticleShell({ children }: { readonly children: ReactNode }) {
  return (
    <BrowserRouter>
      <PostkitProvider preset={postkitDefaultTheme}>{children}</PostkitProvider>
    </BrowserRouter>
  );
}

import { PostkitProvider } from '@postkit/react';
import type { ReactNode } from 'react';
import { BrowserRouter } from 'react-router';

export function ArticleShell({ children }: { readonly children: ReactNode }) {
  return (
    <BrowserRouter>
      <PostkitProvider>{children}</PostkitProvider>
    </BrowserRouter>
  );
}

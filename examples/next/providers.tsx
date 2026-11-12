import { PostkitProvider, postkitDefaultTheme } from '@postkit/chakra';
import type { ReactNode } from 'react';

export function Providers({ children }: { readonly children: ReactNode }) {
  return (
    <PostkitProvider preset={postkitDefaultTheme}>{children}</PostkitProvider>
  );
}

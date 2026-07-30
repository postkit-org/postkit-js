import { PostkitProvider } from '@postkit/react';
import type { ReactNode } from 'react';

export function Providers({ children }: { readonly children: ReactNode }) {
  return <PostkitProvider>{children}</PostkitProvider>;
}

import { ThemeProvider, type ThemeInput } from '@chakra-email/core';
import type { ReactNode } from 'react';

export interface PostkitEmailProviderProps {
  readonly children: ReactNode;
  /** Chakra Email theme tokens layered over its email-safe defaults. */
  readonly theme?: ThemeInput | null;
}

export function PostkitEmailProvider({
  children,
  theme,
}: PostkitEmailProviderProps) {
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}

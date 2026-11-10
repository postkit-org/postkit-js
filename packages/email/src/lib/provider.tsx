import { ThemeProvider, type ThemeInput } from '@chakra-email/core';
import type { ReactNode } from 'react';

import { postkitEmailTheme } from './theme.js';

export interface PostkitEmailProviderProps {
  readonly children: ReactNode;
  /**
   * Chakra Email theme tokens layered over the light Postkit email theme
   * (`postkitEmailTheme`), which is itself layered over Chakra Email's
   * email-safe defaults.
   */
  readonly theme?: ThemeInput | null;
}

export function PostkitEmailProvider({
  children,
  theme,
}: PostkitEmailProviderProps) {
  return (
    <ThemeProvider theme={postkitEmailTheme}>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </ThemeProvider>
  );
}

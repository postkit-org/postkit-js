'use client';

import { defaultSystem } from '@chakra-ui/react';

import { PostkitHostProvider, type PostkitProviderProps } from './provider.js';

/**
 * Supplies Chakra and Postkit context to the components beneath it: the
 * site's Chakra `system` (Chakra's `defaultSystem` when none is passed) with
 * the optional `preset` beneath it and `theme` above it, the code block
 * adapter, link resolvers, social services and newsletter configuration.
 */
export function PostkitProvider({ system, ...props }: PostkitProviderProps) {
  return <PostkitHostProvider {...props} system={system ?? defaultSystem} />;
}

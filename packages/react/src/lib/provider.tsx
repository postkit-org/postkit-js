'use client';

import {
  createCallbackResolver,
  createLinkResolverRegistry,
  type LinkResolver,
  type LinkResolverCallback,
  type LinkResolverId,
  type ResolveLinkOptions,
  type ResolvedLinkPreview,
} from '@postkit/unfurl';
import {
  ChakraProvider,
  CodeBlock,
  defaultSystem,
  type CodeBlockAdapter,
  type SystemConfig,
  type SystemContext,
} from '@chakra-ui/react';
import { createContext, type ReactNode, useContext, useMemo } from 'react';

import { createPostkitSystem } from './theme.js';
import { postkitPlainTextCodeBlockAdapter } from './code-block-adapter.js';
import type { PostkitNewsletterConfig } from './newsletter.js';
import {
  mergePostkitSocialServices,
  type PostkitSocialServiceRegistry,
} from './social-services.js';

export interface PostkitResolverErrorContext {
  readonly url: string;
  readonly options?: ResolveLinkOptions;
}

export interface PostkitContextValue {
  readonly resolver?: LinkResolver;
  readonly defaultResolver?: LinkResolverId;
  readonly resolveLink?: LinkResolverCallback;
  readonly socialServices: PostkitSocialServiceRegistry;
  readonly newsletter?: PostkitNewsletterConfig;
  readonly codeBlock: PostkitCodeBlockConfig;
}

export type PostkitCodeBlockSize = 'sm' | 'md' | 'lg';
export type PostkitCodeBlockVariant = 'outline' | 'subtle' | 'plain';

export interface PostkitCodeBlockConfig {
  /** Whether non-empty code blocks show a copy action. @default true */
  readonly copy?: boolean;
  /** Whether code blocks show line numbers. @default false */
  readonly lineNumbers?: boolean;
  /** Whether long code lines wrap instead of scrolling. @default false */
  readonly wrap?: boolean;
  /** Chakra CodeBlock size applied across Postkit-rendered code. */
  readonly size?: PostkitCodeBlockSize;
  /** Postkit recipe variant applied across Postkit-rendered code. */
  readonly variant?: PostkitCodeBlockVariant;
  /** Highlighting and semantic-token color scheme. Chakra defaults to dark. */
  readonly colorScheme?: NonNullable<CodeBlock.RootProps['defaultColorScheme']>;
  /** Visible content shown before the source is copied. */
  readonly copyLabel?: ReactNode;
  /** Copied-state content shown inline or in the copied tooltip. */
  readonly copiedLabel?: ReactNode;
  /** Optional icon rendered before the idle label. */
  readonly copyIcon?: ReactNode;
  /** Optional copied-state icon. Tooltip mode falls back to Chakra's check. */
  readonly copiedIcon?: ReactNode;
  /** Accessible name for the copy button. */
  readonly copyAriaLabel?: string;
  /** How copied-state feedback is presented. @default 'inline' */
  readonly copyFeedback?: 'inline' | 'tooltip';
}

export interface PostkitProviderProps {
  readonly children: ReactNode;
  /**
   * The site's contextual Chakra system. Its tokens, component recipes,
   * global styles, and Postkit recipe customizations are preserved.
   */
  readonly system?: SystemContext;
  /**
   * Optional visual defaults layered beneath the site's Chakra system. Pass
   * `postkitDefaultTheme` to opt into Postkit's standalone appearance.
   */
  readonly preset?: SystemConfig;
  /**
   * Chakra configuration merged after the optional preset and contextual
   * system. Use createPostkitTheme to target only the nearest Postkit context
   * without changing site-wide component defaults.
   */
  readonly theme?: SystemConfig;
  /**
   * Optional syntax-highlighting adapter used by Chakra CodeBlock. Hosts can
   * supply createShikiAdapter or createHighlightJsAdapter while Postkit keeps
   * plain-text rendering as the dependency-free fallback.
   */
  readonly codeBlockAdapter?: CodeBlockAdapter;
  /**
   * Provider-level behavior and copy-control defaults used by every Postkit
   * CodeBlock. Individual CodeBlock props take precedence.
   */
  readonly codeBlock?: PostkitCodeBlockConfig;
  /**
   * A configured resolver or a custom callback. A callback is assigned the
   * `defaultResolver` id, or `custom` when no id is supplied.
   */
  readonly resolver?: LinkResolver | LinkResolverCallback;
  /**
   * A resolver collection from which Postkit will create a registry.
   */
  readonly resolvers?: readonly LinkResolver[];
  /**
   * The registry default, and the provider hint supplied to a direct callback
   * when a LinkPreview does not request a provider itself.
   */
  readonly defaultResolver?: LinkResolverId;
  /**
   * Ordered registry fallbacks. Fallbacks remain opt-in.
   */
  readonly fallbackResolvers?: readonly LinkResolverId[];
  readonly onResolverError?: (
    error: unknown,
    context: PostkitResolverErrorContext,
  ) => void;
  /**
   * Service labels, branding, and optional share handlers consumed by
   * SocialPost, ShareActions, and AppearsOn.
   */
  readonly socialServices?: PostkitSocialServiceRegistry;
  /**
   * Host-owned newsletter submission configuration. Authored MDX cannot set
   * this boundary, keeping provider credentials and endpoint choices outside
   * document content.
   */
  readonly newsletter?: PostkitNewsletterConfig;
}

const PostkitContext = createContext<PostkitContextValue>(
  Object.freeze({
    codeBlock: Object.freeze({}),
    socialServices: mergePostkitSocialServices(),
  }) as PostkitContextValue,
);

function isLinkResolver(
  resolver: LinkResolver | LinkResolverCallback,
): resolver is LinkResolver {
  return (
    typeof resolver === 'object' &&
    resolver !== null &&
    typeof resolver.resolve === 'function'
  );
}

function configuredResolver({
  resolver,
  resolvers,
  defaultResolver,
  fallbackResolvers,
}: Pick<
  PostkitProviderProps,
  'defaultResolver' | 'fallbackResolvers' | 'resolver' | 'resolvers'
>): LinkResolver | undefined {
  if (resolver && resolvers?.length) {
    throw new TypeError(
      'PostkitProvider accepts either resolver or resolvers, not both.',
    );
  }

  if (resolver) {
    return isLinkResolver(resolver)
      ? resolver
      : createCallbackResolver(defaultResolver ?? 'custom', resolver);
  }

  if (!resolvers?.length) {
    return undefined;
  }

  const conventionalDefault = resolvers.some(
    (candidate) => candidate.id === 'opengraphs',
  )
    ? 'opengraphs'
    : resolvers[0].id;

  return createLinkResolverRegistry({
    resolvers,
    defaultProvider: defaultResolver ?? conventionalDefault,
    fallbackProviders: fallbackResolvers,
  });
}

export function PostkitProvider({
  children,
  system,
  preset,
  theme,
  codeBlockAdapter,
  codeBlock,
  resolver,
  resolvers,
  defaultResolver,
  fallbackResolvers,
  onResolverError,
  socialServices,
  newsletter,
}: PostkitProviderProps) {
  const chakraSystem = useMemo(
    () =>
      createPostkitSystem({
        system: system ?? defaultSystem,
        preset,
        theme,
      }),
    [preset, system, theme],
  );
  const configured = useMemo(
    () =>
      configuredResolver({
        resolver,
        resolvers,
        defaultResolver,
        fallbackResolvers,
      }),
    [defaultResolver, fallbackResolvers, resolver, resolvers],
  );
  const configuredSocialServices = useMemo(
    () => mergePostkitSocialServices(socialServices),
    [socialServices],
  );
  const configuredCodeBlock = useMemo(
    () => Object.freeze({ ...codeBlock }),
    [codeBlock],
  );
  const context = useMemo<PostkitContextValue>(() => {
    if (!configured) {
      return Object.freeze({
        codeBlock: configuredCodeBlock,
        defaultResolver,
        newsletter,
        socialServices: configuredSocialServices,
      });
    }

    const selectedDefault =
      defaultResolver ??
      ('defaultProvider' in configured &&
      typeof configured.defaultProvider === 'string'
        ? configured.defaultProvider
        : configured.id);
    const resolveLink: LinkResolverCallback = async (
      url,
      options = {},
    ): Promise<ResolvedLinkPreview> => {
      const resolvedOptions = {
        ...options,
        provider: options.provider ?? selectedDefault,
      };

      try {
        return await configured.resolve(url, resolvedOptions);
      } catch (error) {
        onResolverError?.(error, { url, options: resolvedOptions });
        throw error;
      }
    };

    return Object.freeze({
      codeBlock: configuredCodeBlock,
      resolver: configured,
      defaultResolver: selectedDefault,
      resolveLink,
      newsletter,
      socialServices: configuredSocialServices,
    });
  }, [
    configured,
    configuredCodeBlock,
    configuredSocialServices,
    defaultResolver,
    newsletter,
    onResolverError,
  ]);

  return (
    <PostkitContext.Provider value={context}>
      <ChakraProvider value={chakraSystem}>
        <CodeBlock.AdapterProvider
          value={codeBlockAdapter ?? postkitPlainTextCodeBlockAdapter}
        >
          {children}
        </CodeBlock.AdapterProvider>
      </ChakraProvider>
    </PostkitContext.Provider>
  );
}

export function usePostkit(): PostkitContextValue {
  return useContext(PostkitContext);
}

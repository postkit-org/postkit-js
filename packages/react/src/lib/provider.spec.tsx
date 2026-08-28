/**
 * @jest-environment jsdom
 */

import type {
  LinkResolver,
  ResolveLinkOptions,
  ResolvedLinkPreview,
} from '@postkit/unfurl';
import {
  type CodeBlockAdapter,
  createSystem,
  defaultConfig,
  useChakraContext,
} from '@chakra-ui/react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { LinkPreview } from './components/link-preview.js';
import { NewsletterSignup } from './components/newsletter-signup.js';
import { ShareActions } from './components/share-actions.js';
import { SocialPost } from './components/social-post.js';
import { CodeBlock } from './components/technical-content.js';
import { PostkitProvider, usePostkit } from './provider.js';
import { postkitDefaultSocialServices } from './social-services.js';
import {
  createPostkitTheme,
  postkitDefaultTheme,
  postkitRecipeKeys,
} from './theme.js';

globalThis.structuredClone ??= <T,>(value: T): T =>
  value === undefined ? value : (JSON.parse(JSON.stringify(value)) as T);
globalThis.ResizeObserver ??= class ResizeObserver {
  disconnect() {
    return undefined;
  }
  observe() {
    return undefined;
  }
  unobserve() {
    return undefined;
  }
};

function result(
  provider: string,
  title = `Resolved by ${provider}`,
): ResolvedLinkPreview {
  return {
    requestedUrl: 'https://example.com/article',
    url: 'https://example.com/article',
    title,
    images: [],
    audio: [],
    video: [],
    provider: { id: provider },
  };
}

function resolver(
  id: string,
  implementation: (
    url: string,
    options?: ResolveLinkOptions,
  ) => Promise<ResolvedLinkPreview>,
): LinkResolver {
  return { id, resolve: implementation };
}

function ThemeProbe() {
  const system = useChakraContext();
  const linkPreviewRecipe = system.getSlotRecipe(
    postkitRecipeKeys.linkPreview,
  ) as {
    readonly base?: {
      readonly root?: {
        readonly boxShadow?: string;
        readonly overflow?: string;
      };
    };
  };

  return (
    <>
      <span data-testid="context-token">
        {system.token('colors.contextAccent')}
      </span>
      <span data-testid="default-recipe">
        {linkPreviewRecipe.base?.root?.overflow}
      </span>
      <span data-testid="recipe-override">
        {linkPreviewRecipe.base?.root?.boxShadow}
      </span>
    </>
  );
}

function ServiceProbe() {
  const { socialServices } = usePostkit();
  return (
    <span data-testid="service-label">
      {socialServices.linegraph?.label}:{socialServices.copy?.label}
    </span>
  );
}

describe('PostkitProvider', () => {
  it('supplies a host syntax-highlighting adapter to code blocks', () => {
    const adapter: CodeBlockAdapter = {
      loadContextSync: () => true,
      getHighlighter:
        () =>
        ({ code, meta }) => ({
          highlighted: true,
          code: code
            .split('\n')
            .map((line, index) => {
              const lineNumber = index + 1;
              const highlighted = meta?.highlightLines?.includes(lineNumber)
                ? ' data-highlight'
                : '';
              return `<span data-line="${lineNumber}"${highlighted}>${line}</span>`;
            })
            .join('\n'),
        }),
    };

    const { container } = render(
      <PostkitProvider codeBlockAdapter={adapter}>
        <CodeBlock
          code={'const answer = 42;\nconsole.log(answer);'}
          language="typescript"
          highlightLines="2"
        />
      </PostkitProvider>,
    );

    expect(container.querySelector('[data-highlight]')?.textContent).toBe(
      'console.log(answer);',
    );
  });

  it('configures accessible code-block copy content for every document', async () => {
    const writeText = vi.fn(async () => undefined);
    const originalClipboard = navigator.clipboard;
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    try {
      render(
        <PostkitProvider
          codeBlock={{
            copyAriaLabel: 'Copy snippet',
            copyIcon: <span data-testid="copy-icon">clipboard</span>,
            copyLabel: null,
            copiedIcon: <span data-testid="copied-icon">check</span>,
            copiedLabel: 'Copied!',
          }}
        >
          <CodeBlock code="const answer = 42;" />
        </PostkitProvider>,
      );

      const trigger = screen.getByRole('button', { name: 'Copy snippet' });
      expect(trigger.textContent).toBe('clipboard');

      fireEvent.click(trigger);

      await waitFor(() => expect(writeText).toHaveBeenCalled());
      await screen.findByText('Copied!');
      expect(screen.getByTestId('copied-icon')).toBeTruthy();
    } finally {
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: originalClipboard,
      });
    }
  });

  it('can present copied feedback as an icon and tooltip', async () => {
    const writeText = vi.fn(async () => undefined);
    const originalClipboard = navigator.clipboard;
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    try {
      render(
        <PostkitProvider
          codeBlock={{
            copyAriaLabel: 'Copy snippet',
            copyFeedback: 'tooltip',
            copyIcon: <span data-testid="copy-icon">clipboard</span>,
            copyLabel: null,
            copiedLabel: 'Copied!',
          }}
        >
          <CodeBlock code="const answer = 42;" />
        </PostkitProvider>,
      );

      const trigger = screen.getByRole('button', { name: 'Copy snippet' });
      expect(trigger.textContent).toBe('clipboard');
      expect(screen.queryByRole('tooltip')).toBeNull();

      fireEvent.click(trigger);

      await waitFor(() => expect(writeText).toHaveBeenCalled());
      expect((await screen.findByRole('tooltip')).textContent).toBe('Copied!');
      expect(screen.queryByTestId('copy-icon')).toBeNull();
      expect(trigger.querySelector('svg')).toBeTruthy();
    } finally {
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: originalClipboard,
      });
    }
  });

  it('lets an individual code block override provider copy content', () => {
    render(
      <PostkitProvider
        codeBlock={{
          copyAriaLabel: 'Provider copy',
          copyIcon: <span>provider icon</span>,
          copyLabel: 'Provider label',
        }}
      >
        <CodeBlock
          code="const answer = 42;"
          copyAriaLabel="Copy this example"
          copyIcon={null}
          copyLabel="Duplicate"
        />
      </PostkitProvider>,
    );

    const trigger = screen.getByRole('button', {
      name: 'Copy this example',
    });
    expect(trigger.textContent).toBe('Duplicate');
  });

  it('resolves missing LinkPreview metadata with a custom callback', async () => {
    const callback = vi.fn(async () => result('site-callback'));

    render(
      <PostkitProvider resolver={callback} defaultResolver="site-callback">
        <LinkPreview href="https://example.com/article" />
      </PostkitProvider>,
    );

    expect(await screen.findByText('Resolved by site-callback')).toBeTruthy();
    expect(callback).toHaveBeenCalledWith(
      'https://example.com/article',
      expect.objectContaining({
        provider: 'site-callback',
        signal: expect.any(AbortSignal),
      }),
    );
    expect(
      screen.getByRole('article').getAttribute('data-postkit-resolution'),
    ).toBe('resolved');
  });

  it('uses the configured registry default and permits a per-link override', async () => {
    const primary = vi.fn(async () => result('primary'));
    const alternate = vi.fn(async () => result('alternate'));

    render(
      <PostkitProvider
        resolvers={[
          resolver('primary', primary),
          resolver('alternate', alternate),
        ]}
        defaultResolver="alternate"
      >
        <LinkPreview href="https://example.com/article" />
        <LinkPreview href="https://example.com/other" provider="primary" />
      </PostkitProvider>,
    );

    expect(await screen.findByText('Resolved by alternate')).toBeTruthy();
    expect(await screen.findByText('Resolved by primary')).toBeTruthy();
    expect(alternate).toHaveBeenCalledTimes(1);
    expect(primary).toHaveBeenCalledTimes(1);
  });

  it('keeps authored metadata authoritative', async () => {
    const callback = vi.fn(async () => result('callback'));

    render(
      <PostkitProvider resolver={callback}>
        <LinkPreview
          href="https://example.com/article"
          metadata={result('authored', 'Authored metadata')}
        />
      </PostkitProvider>,
    );

    expect(screen.getByText('Authored metadata')).toBeTruthy();
    await waitFor(() => expect(callback).not.toHaveBeenCalled());
    expect(
      screen.getByRole('article').getAttribute('data-postkit-resolution'),
    ).toBe('provided');
  });

  it('honors explicit live and snapshot SocialPost resolution modes', async () => {
    const callback = vi.fn(async (url: string) => ({
      ...result('site-callback'),
      requestedUrl: url,
      url,
    }));
    const frozen = result('authored');

    render(
      <PostkitProvider resolver={callback}>
        <SocialPost
          href="https://social.example/frozen"
          metadata={frozen}
          resolution="snapshot"
        />
        <SocialPost
          href="https://social.example/live"
          metadata={frozen}
          resolution="live"
        />
      </PostkitProvider>,
    );

    await waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
    expect(callback).toHaveBeenCalledWith(
      'https://social.example/live',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it('layers an optional Postkit preset beneath the contextual Chakra theme and overrides', () => {
    const contextualSystem = createSystem(defaultConfig, {
      theme: {
        tokens: {
          colors: {
            contextAccent: { value: '#663399' },
          },
        },
      },
    });

    render(
      <PostkitProvider
        system={contextualSystem}
        preset={postkitDefaultTheme}
        theme={createPostkitTheme({
          linkPreview: {
            base: {
              root: {
                boxShadow: 'sm',
              },
            },
          },
        })}
      >
        <ThemeProbe />
      </PostkitProvider>,
    );

    expect(screen.getByTestId('context-token').textContent).toBe('#663399');
    expect(screen.getByTestId('default-recipe').textContent).toBe('hidden');
    expect(screen.getByTestId('recipe-override').textContent).toBe('sm');
  });

  it('reports resolver errors while preserving the link fallback', async () => {
    const error = new Error('unavailable');
    const onResolverError = vi.fn();

    render(
      <PostkitProvider
        resolver={async () => {
          throw error;
        }}
        onResolverError={onResolverError}
      >
        <LinkPreview href="https://example.com/article" />
      </PostkitProvider>,
    );

    await waitFor(() =>
      expect(
        screen.getByRole('article').getAttribute('data-postkit-resolution'),
      ).toBe('error'),
    );
    expect(onResolverError).toHaveBeenCalledWith(
      error,
      expect.objectContaining({
        url: 'https://example.com/article',
      }),
    );
    expect(screen.getAllByText('example.com')).toHaveLength(3);
  });

  it('merges custom social services with Postkit defaults', () => {
    render(
      <PostkitProvider
        socialServices={{
          linegraph: {
            label: 'Linegraph Syndication',
            accent: 'purple.600',
          },
        }}
      >
        <ServiceProbe />
      </PostkitProvider>,
    );

    expect(screen.getByTestId('service-label').textContent).toBe(
      'Linegraph Syndication:Copy link',
    );
  });

  it('runs a configured social share callback', async () => {
    const share = vi.fn(async () => undefined);

    render(
      <PostkitProvider
        socialServices={{
          linegraph: {
            label: 'Linegraph',
            share,
          },
        }}
      >
        <ShareActions
          url="https://example.com/article"
          title="Article"
          services={['linegraph']}
        />
      </PostkitProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: /Linegraph/ }));
    await waitFor(() =>
      expect(share).toHaveBeenCalledWith({
        url: 'https://example.com/article',
        title: 'Article',
        text: undefined,
      }),
    );
  });

  it('submits newsletter signup through the host callback', async () => {
    const subscribe = vi.fn(async () => ({
      message: 'Check your inbox.',
    }));

    render(
      <PostkitProvider newsletter={{ subscribe }}>
        <NewsletterSignup title="Get new essays" list="essays" />
      </PostkitProvider>,
    );

    fireEvent.change(screen.getByLabelText('Email address'), {
      target: { value: 'reader@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Subscribe' }));

    await waitFor(() =>
      expect(subscribe).toHaveBeenCalledWith({
        email: 'reader@example.com',
        list: 'essays',
      }),
    );
    expect(await screen.findByText('Check your inbox.')).toBeTruthy();
  });

  it('keeps newsletter endpoints host-owned and disables unconfigured forms', () => {
    const { rerender } = render(
      <PostkitProvider>
        <NewsletterSignup title="Get new essays" />
      </PostkitProvider>,
    );

    expect(
      (screen.getByRole('button', { name: 'Subscribe' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
    expect(
      screen.getByText('Newsletter signup is not configured.'),
    ).toBeTruthy();

    rerender(
      <PostkitProvider
        newsletter={{
          action: 'https://newsletter.example/subscribe',
          method: 'get',
        }}
      >
        <NewsletterSignup title="Get new essays" />
      </PostkitProvider>,
    );

    const form = screen
      .getByRole('button', { name: 'Subscribe' })
      .closest('form');
    expect(form?.getAttribute('action')).toBe(
      'https://newsletter.example/subscribe',
    );
    expect(form?.getAttribute('method')).toBe('get');
  });

  it('provides script-free web share URLs for common social services', () => {
    const request = {
      url: 'https://example.com/article?edition=1',
      title: 'Portable publishing',
    };

    expect(
      postkitDefaultSocialServices.bluesky?.createShareUrl?.(request),
    ).toContain('bsky.app/intent/compose');
    expect(
      postkitDefaultSocialServices.facebook?.createShareUrl?.(request),
    ).toContain(encodeURIComponent(request.url));
    expect(
      postkitDefaultSocialServices.linkedin?.createShareUrl?.(request),
    ).toContain('linkedin.com/sharing/share-offsite');
    expect(
      postkitDefaultSocialServices.threads?.createShareUrl?.(request),
    ).toContain('threads.net/intent/post');
    expect(postkitDefaultSocialServices.x?.createShareUrl?.(request)).toContain(
      'x.com/intent/post',
    );
  });
});

import {
  Body,
  Container,
  Head,
  Html,
  render,
  type ThemeInput,
} from '@chakra-email/core';
import {
  serializePostkitText,
  type PostkitDocument,
  type PostkitStaticViewOptions,
} from '@postkit/core';
import {
  postkitBuiltInDefinitions,
  type AnyPostkitComponentDefinition,
} from '@postkit/core/components';
import type { ComponentType, ReactNode } from 'react';

import { postkitEmailViews, type PostkitEmailView } from '../email-views.js';
import { PostkitEmailProvider } from '../provider.js';
import { parseEmailSource, type RenderEmailFormat } from './parse.js';
import type { EmailRenderContext } from './plan.js';
import { renderEmailNodes } from './render-nodes.js';
import { toEmailTextDocument } from './text-document.js';
import { EmailWarnings, type RenderEmailWarning } from './warnings.js';

/** The layout `renderEmail` puts the content in. */
export type RenderEmailWrapper = ComponentType<{
  readonly children?: ReactNode;
}>;

export interface RenderEmailOptions {
  /**
   * `mdx`, `markdown` (the default for a string) or `document` (a
   * `@postkit/core` document or its JSON; the default for an object).
   */
  readonly format?: RenderEmailFormat;
  /**
   * Chakra Email theme tokens over the light Postkit email theme
   * (`postkitEmailTheme`). Email stays light (03 §5.5).
   */
  readonly theme?: ThemeInput | null;
  /** Resolves relative links and images: `https://postkit.org`. */
  readonly baseUrl?: string;
  /**
   * The post on the web. `link` fallbacks without a URL of their own (a
   * Poll) point here; without it they render as text.
   */
  readonly url?: string;
  /**
   * Overrides keyed like an MDX component map. A PascalCase key is a view
   * over `postkitEmailViews`: replace one, or give a site component an
   * email view (a component with a view is never a fallback). A lower-case
   * key (`h2`, `p`, `ul`, `li`, `a`, `pre`, `code`…) replaces that prose
   * element; it gets the element's attributes and rendered children.
   */
  readonly components?: Readonly<Record<string, PostkitEmailView>>;
  /**
   * The definitions the source may use. Defaults to every built-in; pass
   * `createPostkit().definitions` plus your own for exactly the site's set.
   */
  readonly definitions?: readonly AnyPostkitComponentDefinition[];
  /**
   * The layout: header, footer, unsubscribe link. It receives the rendered
   * content as `children` and renders the whole message, `<Html>` included.
   * Defaults to a plain 600px column on white.
   */
  readonly wrapper?: RenderEmailWrapper;
  /** The audiences this email is for (`AudienceBoundary`); see core. */
  readonly audiences?: readonly string[];
  /** Where a `NewsletterSignup` would link; see core. */
  readonly newsletterUrl?: string;
  /** Indents the HTML, for review. */
  readonly pretty?: boolean;
}

export interface RenderEmailResult {
  /** The full HTML message. */
  readonly html: string;
  /**
   * The plain-text part, from `@postkit/core`'s text serializer: the same
   * content, with links as URLs and footnote marks as `[1]`.
   */
  readonly text: string;
  /** What fell back, was left out, or couldn't be shown (never thrown). */
  readonly warnings: readonly RenderEmailWarning[];
}

/** The default layout: a 600px column on white, light only. */
function DefaultEmailWrapper({ children }: { readonly children?: ReactNode }) {
  return (
    <Html lang="en">
      <Head>
        <meta name="color-scheme" content="light only" />
        <meta name="supported-color-schemes" content="light" />
      </Head>
      <Body bg="white" color="fg" fontFamily="body">
        <Container maxW="600px" px="20px" py="32px">
          {children}
        </Container>
      </Body>
    </Html>
  );
}

function definitionMap(
  definitions: readonly AnyPostkitComponentDefinition[] | undefined,
): Map<string, AnyPostkitComponentDefinition> {
  return new Map(
    (definitions ?? Object.values(postkitBuiltInDefinitions)).map(
      (definition) => [definition.name, definition],
    ),
  );
}

/**
 * Renders a post as an email (03 §6.1): it parses the source with the
 * site's validation, maps each component to its email view or its
 * definition's declared fallback, and renders with Chakra Email. It returns
 * the HTML, a plain-text part and warnings; it never throws on content the
 * site renders. Footnotes become end notes: superscript numbers, no
 * links, and the notes at the end (the `Footnote` and `Footnotes` views).
 *
 * ```ts
 * const { html, text, warnings } = await renderEmail(source, {
 *   format: 'mdx',
 *   baseUrl: 'https://postkit.org',
 *   wrapper: Layout,
 * });
 * ```
 */
export async function renderEmail(
  source: string | PostkitDocument,
  options: RenderEmailOptions = {},
): Promise<RenderEmailResult> {
  // PascalCase keys are components; lower-case keys are prose elements.
  const views: Record<string, PostkitEmailView> = { ...postkitEmailViews };
  const elements: Record<string, PostkitEmailView> = {};
  for (const [name, view] of Object.entries(options.components ?? {})) {
    if (/^[a-z]/.test(name)) elements[name] = view;
    else views[name] = view;
  }
  const parsed = parseEmailSource(source, {
    format: options.format,
    definitions: options.definitions,
    components: Object.keys(options.components ?? {}).filter((name) =>
      /^[A-Z]/.test(name),
    ),
  });
  const warnings = new EmailWarnings();
  for (const warning of parsed.warnings) warnings.add(warning);

  const staticOptions: PostkitStaticViewOptions = {
    ...(options.baseUrl ? { baseUrl: options.baseUrl } : {}),
    ...(options.audiences ? { audiences: options.audiences } : {}),
    ...(options.newsletterUrl ? { newsletterUrl: options.newsletterUrl } : {}),
  };
  const context: EmailRenderContext = {
    views,
    elements,
    definitions: definitionMap(options.definitions),
    baseUrl: options.baseUrl,
    url: options.url,
    staticOptions,
  };
  const content = renderEmailNodes(parsed.document.children, context, warnings);

  const Wrapper = options.wrapper ?? DefaultEmailWrapper;
  const html = await render(
    <PostkitEmailProvider theme={options.theme}>
      <Wrapper>{content}</Wrapper>
    </PostkitEmailProvider>,
    { pretty: options.pretty },
  );
  const text = serializePostkitText(
    toEmailTextDocument(parsed.document, context),
    staticOptions,
  );
  return { html, text, warnings: warnings.list };
}

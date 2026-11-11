import { Box, chakra, Flex, Text } from '@chakra-ui/react';
import { Callout } from '@postkit/chakra';
import { useTheme } from 'next-themes';
import { useCallback, useEffect, useRef, useState } from 'react';

import { segmentedOnSubtle } from '../components/usage-panel';
import { SegmentedControl } from '../primitives';
import {
  rendererArticle,
  rendererTabs,
  type RendererId,
  type RendererTab,
} from './home-content';
import { HomeSection } from './home-section';

/** The documents the framed tabs show, each rendered at build time. */
export interface RendererDocuments {
  /** `@postkit/react` with no stylesheet (`renderHeadlessArticle`). */
  readonly headless: string;
  /** `@postkit/email`'s HTML (`renderEmailArticle`). */
  readonly email: string;
  /** `@postkit/react` with `styles.css`, the Prismark preview (`renderEditorArticle`). */
  readonly editor: string;
}

export interface RendererPanelProps {
  readonly documents: RendererDocuments;
}

/**
 * "Your design, not ours." (SiteHome): the same short article in each renderer, switched by
 * a four-segment SegmentedControl (01 §6.1, 06 PK-030).
 *
 * - Headless: `@postkit/react`'s views with no stylesheet, in an iframe of its own, so the
 *   browser's defaults are the only styles (none of the site's reach it).
 * - Chakra: live `@postkit/chakra` components on the site's system.
 * - Email: `@postkit/email`'s HTML in an iframe.
 * - Editor: `@postkit/react` with `@postkit/react/styles.css` (03 D10), in an iframe. The
 *   baseline sets tokens on `:root` and styles every `[data-postkit-component]`, which
 *   `@postkit/chakra` stamps too, so it only ever loads inside that frame's own document.
 *
 * The three framed documents are rendered at build time and passed in as `srcDoc`.
 */
export function RendererPanel({ documents }: RendererPanelProps) {
  const [current, setCurrent] = useState<RendererId>('headless');
  const tab =
    rendererTabs.find((item) => item.value === current) ?? rendererTabs[0];

  return (
    <HomeSection
      id="home-renderers"
      title="Your design, not ours."
      quiet="Bring your own CSS or Chakra theme, and switch later without touching a post."
    >
      <Box bg="bg.subtle" borderRadius="3xl" padding="clamp(16px, 5vw, 56px)">
        <Box
          display={{ base: 'block', md: 'inline-block' }}
          css={{
            // A step up from the default track, so it reads on the panel's `bg.subtle`, with
            // unselected labels that keep 4.5:1 on it.
            ...segmentedOnSubtle,
            '@media (min-width: 761px)': {
              '& [role=radio]': {
                height: '40px',
                paddingInline: '18px',
                fontSize: '15px',
              },
            },
          }}
        >
          <SegmentedControl
            aria-label="Renderer"
            items={rendererTabs.map(({ value, label }) => ({ value, label }))}
            value={current}
            onValueChange={setCurrent}
            fullWidth
          />
        </Box>
        <Flex
          as="figure"
          margin="0"
          marginTop={{ base: '8', md: '12' }}
          wrap="wrap"
          gap="6"
          align="stretch"
        >
          <Flex
            flex="1 1 320px"
            minW="0"
            minH="180px"
            direction="column"
            justify="center"
            gap="4"
            paddingBlock="2"
          >
            <RendererView id={current} documents={documents} />
          </Flex>
          <RendererCaption tab={tab} />
        </Flex>
      </Box>
    </HomeSection>
  );
}

function RendererCaption({ tab }: { readonly tab: RendererTab }) {
  return (
    <Box
      as="figcaption"
      flex="1 1 300px"
      alignSelf="center"
      minW="0"
      borderRadius="lg"
      bg="bg"
      paddingBlock="18px"
      paddingInline="5"
    >
      <Text margin="0 0 6px" fontFamily="mono" fontSize="sm">
        {tab.pkg}
      </Text>
      <Text margin="0" fontSize="md" lineHeight="body">
        {tab.description}
      </Text>
    </Box>
  );
}

function RendererView({
  id,
  documents,
}: {
  readonly id: RendererId;
  readonly documents: RendererDocuments;
}) {
  switch (id) {
    case 'chakra':
      return <ChakraView />;
    case 'email':
      return (
        <FramedDocument
          // Emails are designed light only (02 §3), so the frame keeps the email's own
          // white page in both themes.
          key="email"
          title="The article as @postkit/email renders it for an inbox"
          html={documents.email}
          theme="none"
          measure="body"
        />
      );
    case 'editor':
      return (
        <FramedDocument
          key="editor"
          title="The article in the Prismark preview: @postkit/react with its baseline stylesheet"
          html={documents.editor}
          theme="class"
          measure="root"
        />
      );
    default:
      return (
        <FramedDocument
          key="headless"
          title="The article as @postkit/react renders it, with no stylesheet"
          html={documents.headless}
          theme="color-scheme"
          measure="root"
        />
      );
  }
}

function ChakraView() {
  const { lead, callout } = rendererArticle;
  return (
    <>
      <Text margin="0" color="fg.secondary" fontSize="md" lineHeight="1.6">
        {lead}
      </Text>
      <Callout tone={callout.tone} title={callout.title}>
        {callout.body}
      </Callout>
    </>
  );
}

/**
 * How a framed document follows the site's colour mode:
 * - `none`: it doesn't (the email is light only);
 * - `color-scheme`: the root's `color-scheme`, so the browser's own defaults go dark;
 * - `class`: the root's `light` or `dark` class, which `@postkit/react/styles.css` reads.
 */
type FrameTheme = 'none' | 'color-scheme' | 'class';

/**
 * A build-time document in an iframe, sized to its content. Same-origin so the panel can
 * measure it and set its colour mode; no scripts run inside it.
 */
function FramedDocument({
  title,
  html,
  theme,
  measure,
}: {
  readonly title: string;
  readonly html: string;
  readonly theme: FrameTheme;
  /** `body`: the body's scroll height; `root`: the root box, body margins included. */
  readonly measure: 'body' | 'root';
}) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(200);
  const { resolvedTheme } = useTheme();

  const sync = useCallback(() => {
    const document = frame.current?.contentDocument;
    if (!document?.body) return;
    const root = document.documentElement;
    if (resolvedTheme === 'dark' || resolvedTheme === 'light') {
      if (theme === 'class') {
        root.classList.toggle('dark', resolvedTheme === 'dark');
        root.classList.toggle('light', resolvedTheme === 'light');
      } else if (theme === 'color-scheme') {
        root.style.colorScheme = resolvedTheme;
      }
    }
    setHeight(
      Math.ceil(
        measure === 'body'
          ? document.body.scrollHeight
          : root.getBoundingClientRect().height,
      ),
    );
  }, [measure, resolvedTheme, theme]);

  // The default tab's frame is in the server HTML and can finish loading before hydration;
  // a theme change re-syncs too.
  useEffect(() => {
    if (frame.current?.contentDocument?.readyState === 'complete') sync();
  }, [sync]);

  useEffect(() => {
    const node = frame.current;
    if (!node || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => sync());
    observer.observe(node);
    return () => observer.disconnect();
  }, [sync]);

  return (
    <Box borderRadius="lg" overflow="hidden" bg="bg">
      <chakra.iframe
        ref={frame}
        title={title}
        srcDoc={html}
        // Same-origin so the frame can be measured and themed; no scripts run inside it.
        sandbox="allow-same-origin"
        onLoad={sync}
        display="block"
        width="100%"
        height={`${height}px`}
        border="0"
      />
    </Box>
  );
}

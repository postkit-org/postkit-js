import { Box, chakra, Flex, Text } from '@chakra-ui/react';
import { Callout } from '@postkit/chakra';
import { useCallback, useEffect, useRef, useState } from 'react';

import { SegmentedControl } from '../primitives';
import {
  rendererArticle,
  rendererTabs,
  type RendererId,
  type RendererTab,
} from './home-content';
import { HomeSection } from './home-section';

export interface RendererPanelProps {
  /** The article rendered by `@postkit/email` at build time (`renderEmailArticle`). */
  readonly emailHtml: string;
}

/**
 * "Your design, not ours." (SiteHome): the same short article in each renderer, switched by
 * a four-segment SegmentedControl (01 §6.1, 06 PK-030).
 *
 * - Chakra: live `@postkit/chakra` components.
 * - Email: `@postkit/email`'s HTML, rendered at build time, in an `<iframe srcDoc>`.
 * - Headless and Editor: static renders reproduced from the board's markup until the headless
 *   views (03 step 7) and `styles.css` (step 8) ship, marked with the release they arrive in.
 */
export function RendererPanel({ emailHtml }: RendererPanelProps) {
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
            // A step up from the default track, so it reads on the panel's `bg.subtle`.
            '& [role=radiogroup]': { bg: 'bg.hover' },
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
            paddingBlock={current === 'editor' ? '10' : '2'}
          >
            <RendererView id={current} emailHtml={emailHtml} />
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
      {tab.staticUntil ? (
        <Text margin="10px 0 0" fontSize="sm" color="fg.muted">
          A static render for now; the live view ships in {tab.staticUntil}.
        </Text>
      ) : null}
    </Box>
  );
}

function RendererView({
  id,
  emailHtml,
}: {
  readonly id: RendererId;
  readonly emailHtml: string;
}) {
  switch (id) {
    case 'chakra':
      return <ChakraView />;
    case 'email':
      return <EmailView html={emailHtml} />;
    case 'editor':
      return <EditorView />;
    default:
      return <HeadlessView />;
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

/** Body copy shared by the two static renders. */
const StaticLead = chakra('p', {
  base: {
    margin: '0',
    color: 'fg.secondary',
    fontSize: 'md',
    lineHeight: '1.6',
  },
});

const StaticCallout = chakra('aside', {
  base: {
    position: 'relative',
    width: '100%',
    display: 'flex',
    gap: '3',
    borderRadius: 'lg',
    bg: 'bg',
    paddingBlock: '18px',
    paddingInline: '5',
  },
});

const StaticMark = chakra('span', {
  base: {
    flex: '0 0 auto',
    width: '8px',
    height: '8px',
    marginTop: '8px',
    borderRadius: 'full',
  },
});

function StaticCalloutBody() {
  const { callout } = rendererArticle;
  return (
    <div>
      <Text margin="0" fontWeight="medium">
        {callout.title}
      </Text>
      <Text margin="0" fontSize="md" color="fg.secondary">
        {callout.body}
      </Text>
    </div>
  );
}

/**
 * The headless render (board markup): semantic `<aside>` and the named parts under the
 * quiet stylesheet, a hairline border and an `fg` mark.
 */
function HeadlessView() {
  return (
    <>
      <StaticLead>{rendererArticle.lead}</StaticLead>
      <StaticCallout
        aria-label={rendererArticle.callout.title}
        borderWidth="1px"
        borderColor="border"
      >
        <StaticMark aria-hidden="true" bg="fg" />
        <StaticCalloutBody />
      </StaticCallout>
    </>
  );
}

/** The editor render (board markup): the callout block selected, with its name on a tab. */
function EditorView() {
  return (
    <>
      <StaticLead>{rendererArticle.lead}</StaticLead>
      <StaticCallout
        aria-label={`${rendererArticle.callout.title}, Callout block, selected`}
        marginTop="8"
        outline="2px solid"
        outlineColor="accent"
        outlineOffset="4px"
      >
        <Text
          as="span"
          aria-hidden="true"
          position="absolute"
          top="-32px"
          left="-4px"
          paddingBlock="0.5"
          paddingInline="2"
          borderRadius="sm"
          bg="accent"
          color="fg.inverted"
          fontSize="xs"
        >
          Callout
        </Text>
        <StaticMark aria-hidden="true" bg="accent" />
        <StaticCalloutBody />
      </StaticCallout>
    </>
  );
}

/**
 * The `@postkit/email` render in an iframe, sized to its content. Emails are designed light
 * only (02 §3), so the frame keeps the email's own white page in both themes.
 */
function EmailView({ html }: { readonly html: string }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(200);

  const measure = useCallback(() => {
    const body = frame.current?.contentDocument?.body;
    if (body) setHeight(Math.ceil(body.scrollHeight));
  }, []);

  useEffect(() => {
    const node = frame.current;
    if (!node || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => measure());
    observer.observe(node);
    return () => observer.disconnect();
  }, [measure]);

  return (
    <Box borderRadius="lg" overflow="hidden" bg="bg">
      <chakra.iframe
        ref={frame}
        title="The article as @postkit/email renders it for an inbox"
        srcDoc={html}
        // Same-origin so the frame can be measured; no scripts run inside it.
        sandbox="allow-same-origin"
        onLoad={measure}
        display="block"
        width="100%"
        height={`${height}px`}
        border="0"
      />
    </Box>
  );
}

import { chakra, Flex, Text } from '@chakra-ui/react';
import { useEffect, useRef, useState } from 'react';

import { PageContainer, TwoToneHeading } from '../layout';
import { Button } from '../primitives';
import { CheckIcon, CopyIcon } from '../icons';

/** How long "Copied" stays before the label reverts (02 §6, the `copyRevert` duration). */
export const COPY_REVERT_MS = 1600;

export interface CopyCommandProps {
  /** The command shown and copied. */
  readonly command: string;
  /** Called after the command reaches the clipboard. */
  readonly onCopy?: (command: string) => void;
}

/**
 * The install command in a pill with its copy button (SiteHome). Copying swaps the label
 * for a tip-green tick and "Copied", announces it through a polite live region, and reverts
 * after 1.6s (02 §6).
 */
export function CopyCommand({ command, onCopy }: CopyCommandProps) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(command);
    } catch {
      // No clipboard (an insecure context, or permission refused): the command stays on
      // screen to select by hand, and nothing claims it was copied.
      return;
    }
    setCopied(true);
    onCopy?.(command);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), COPY_REVERT_MS);
  };

  return (
    <>
      <Flex
        margin="40px auto 0"
        maxW="420px"
        align="center"
        justify="space-between"
        gap="2"
        paddingLeft="5"
        borderRadius="full"
        bg="bg.subtle"
        fontFamily="mono"
        fontSize="14px"
        textAlign="start"
      >
        <chakra.code
          minW="0"
          fontFamily="inherit"
          overflowWrap="anywhere"
          paddingBlock="2"
        >
          {command}
        </chakra.code>
        <Button
          variant="primary"
          size="lg"
          minW="48px"
          flexShrink={0}
          fontFamily="mono"
          fontSize="sm"
          aria-label="Copy install command"
          onClick={copy}
        >
          {copied ? (
            <>
              <chakra.span display="inline-flex" color="tone.tip">
                <CheckIcon width="14" height="14" />
              </chakra.span>
              Copied
            </>
          ) : (
            <CopyIcon />
          )}
        </Button>
      </Flex>
      <chakra.span srOnly aria-live="polite" role="status">
        {copied ? `Copied ${command} to the clipboard` : ''}
      </chakra.span>
    </>
  );
}

export type InstallCtaProps = CopyCommandProps;

/** "Start with one component." (SiteHome): the install command, then the other routes in. */
export function InstallCta({ command, onCopy }: InstallCtaProps) {
  return (
    <PageContainer
      as="section"
      aria-labelledby="home-start"
      paddingTop={{ base: 'sectionPhone', md: 'section' }}
      paddingBottom={{ base: '20', md: '120px' }}
      textAlign="center"
    >
      <TwoToneHeading
        id="home-start"
        title="Start with one component."
        quiet="Add the rest when you need them."
        maxW="18ch"
        marginInline="auto"
      />
      <CopyCommand command={command} onCopy={onCopy} />
      <Text margin="18px 0 0" fontSize="md" color="fg.muted">
        Or{' '}
        <chakra.code fontFamily="mono" fontSize="sm" color="fg">
          @postkit/chakra
        </chakra.code>{' '}
        for the Chakra views. Works with Next.js, React Router, TanStack Router
        and Astro.
      </Text>
    </PageContainer>
  );
}

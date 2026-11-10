import { Box, chakra } from '@chakra-ui/react';
import { useId, useState, type FormEvent } from 'react';

import { noteFeeds } from '../../lib/notes';
import { TwoToneHeading } from '../layout';
import { Button, TextField } from '../primitives';

export interface SubscribeCardProps {
  /**
   * Called with the address when the form is submitted. The card is UI only for now:
   * PK-051 wires this to the subscribe API (the one `/newsletter/subscribe` posts to) and
   * adds the other five form states from 04 §2 (invalid, sending, check your inbox,
   * already subscribed, couldn't subscribe).
   */
  readonly onSubmit?: (email: string) => void;
}

const feedLinkStyles = {
  color: 'accent',
  textDecoration: 'underline',
  textDecorationThickness: '1px',
  textUnderlineOffset: '3px',
  borderRadius: 'xs',
  _hover: { textDecorationThickness: '2px' },
} as const;

/**
 * "Follow along." (SiteNotes, 04 §2 state 1, idle): the pill email field and Subscribe
 * button, plus the RSS, Atom and JSON Feed links. `id="subscribe"` so emails and other
 * pages can link to `/notes#subscribe`.
 */
export function SubscribeCard({ onSubmit }: SubscribeCardProps) {
  const headingId = `subscribe-heading-${useId()}`;
  const [email, setEmail] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // PK-051: validate on submit (04 §2), post to the subscribe API and show the result.
    onSubmit?.(email);
  };

  return (
    <chakra.section
      id="subscribe"
      aria-labelledby={headingId}
      scrollMarginTop="calc({sizes.header} + 24px)"
      display="flex"
      flexWrap="wrap"
      gap="24px 48px"
      alignItems="center"
      padding="clamp(28px, 5vw, 56px)"
      borderRadius="3xl"
      bg="bg.subtle"
    >
      <Box flex="1 1 320px" minW="0">
        <TwoToneHeading
          as="h2"
          id={headingId}
          title="Follow along."
          quiet="One email per release, nothing else."
          fontSize="clamp(26px, 3vw, 34px)"
          lineHeight="heading"
          letterSpacing="heading"
        />
        <chakra.p margin="12px 0 0" fontSize="15px" color="fg.muted">
          Or subscribe with{' '}
          {noteFeeds.map((feed, index) => (
            <span key={feed.href}>
              <chakra.a href={feed.href} type={feed.type} {...feedLinkStyles}>
                {feed.label}
              </chakra.a>
              {index === noteFeeds.length - 2
                ? ' or '
                : index < noteFeeds.length - 2
                  ? ', '
                  : '.'}
            </span>
          ))}
        </chakra.p>
      </Box>
      <chakra.form
        onSubmit={handleSubmit}
        noValidate
        flex="1 1 280px"
        minW="0"
        display="flex"
        flexWrap="wrap"
        gap="8px"
      >
        <Box flex="1 1 180px" minW="0">
          <TextField
            label="Email address"
            hideLabel
            type="email"
            name="email"
            autoComplete="email"
            placeholder="you@example.com"
            size="lg"
            shape="pill"
            surface="subtle"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </Box>
        <Button type="submit" variant="primary" size="lg">
          Subscribe
        </Button>
      </chakra.form>
    </chakra.section>
  );
}

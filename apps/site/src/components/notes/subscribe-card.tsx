import { Box, chakra } from '@chakra-ui/react';
import { useId } from 'react';

import { noteFeeds } from '../../lib/notes';
import { TwoToneHeading } from '../layout';
import { FeedLinks } from '../newsletter/feed-links';
import { SubscribeForm } from '../newsletter/subscribe-form';

/**
 * "Follow along." (SiteNotes): the heading, the notes feeds, and the release-email
 * `SubscribeForm` with its six states (04 §2, SiteSignupStates) in place. `id="subscribe"`
 * so emails and other pages can link to `/notes#subscribe`.
 */
export function SubscribeCard() {
  const headingId = `subscribe-heading-${useId()}`;

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
          Or subscribe with <FeedLinks feeds={noteFeeds} />
        </chakra.p>
      </Box>
      <SubscribeForm flex="1 1 280px" minW="0" layout="card" surface="subtle" />
    </chakra.section>
  );
}

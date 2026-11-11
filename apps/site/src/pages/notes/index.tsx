import { Box } from '@chakra-ui/react';
import type { GetStaticProps, InferGetStaticPropsType } from 'next';
import Head from 'next/head';

import {
  BreadcrumbJsonLd,
  PageContainer,
  PageMeta,
  TwoToneHeading,
} from '../../components/layout';
import { NotesIndex } from '../../components/notes/notes-index';
import { SubscribeCard } from '../../components/notes/subscribe-card';
import { noteFeeds, type NoteSummary } from '../../lib/notes';
import { getNotes } from '../../lib/notes.server';

interface NotesPageProps {
  readonly notes: readonly NoteSummary[];
}

/** Until the first note is published, production has no Notes page: `/notes` is a 404. */
export const getStaticProps: GetStaticProps<NotesPageProps> = async () => {
  const notes = getNotes();
  if (!notes.length) return { notFound: true };
  return { props: { notes } };
};

export default function NotesPage({
  notes,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  return (
    <>
      <PageMeta
        title="Notes"
        description="Releases, guides and how people publish with Postkit."
        path="/notes"
      />
      <Head>
        {/* 01 §10: the notes feeds (built in PK-042). */}
        {noteFeeds.map((feed) => (
          <link
            key={feed.href}
            rel="alternate"
            type={feed.type}
            href={feed.href}
            title={`Postkit notes (${feed.label})`}
          />
        ))}
      </Head>
      <BreadcrumbJsonLd items={[{ name: 'Notes', path: '/notes' }]} />

      <PageContainer
        paddingTop={{ base: '64px', md: '96px' }}
        paddingBottom="120px"
      >
        <TwoToneHeading
          as="h1"
          textStyle="pageTitle"
          title="Notes."
          quiet="Releases, guides and how people publish with Postkit."
          maxW="22ch"
          fontSize="clamp(44px, 6vw, 80px)"
        />

        <NotesIndex notes={notes} />

        <Box marginTop={{ base: '64px', md: '96px' }}>
          <SubscribeCard />
        </Box>
      </PageContainer>
    </>
  );
}

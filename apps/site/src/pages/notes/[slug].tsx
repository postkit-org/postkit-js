import { Box } from '@chakra-ui/react';
import type {
  GetStaticPaths,
  GetStaticProps,
  InferGetStaticPropsType,
} from 'next';
import { Schema } from 'react-structured';

import {
  absoluteUrl,
  BreadcrumbJsonLd,
  PageContainer,
  PageMeta,
} from '../../components/layout';
import { ArticleHeader } from '../../components/notes/article-header';
import { NoteBody } from '../../components/notes/note-body';
import { NoteEnd } from '../../components/notes/note-end';
import {
  hasGradientCover,
  noteHref,
  type NoteEntry,
  type NoteSummary,
} from '../../lib/notes';
import { getNote, getNotes } from '../../lib/notes.server';

interface NotePageProps {
  readonly note: NoteEntry;
  readonly next: Pick<NoteSummary, 'slug' | 'title'> | null;
}

interface NoteParams extends Record<string, string> {
  readonly slug: string;
}

export const getStaticPaths: GetStaticPaths<NoteParams> = async () => ({
  fallback: false,
  paths: getNotes().map((note) => ({ params: { slug: note.slug } })),
});

export const getStaticProps: GetStaticProps<
  NotePageProps,
  NoteParams
> = async ({ params }) => {
  const notes = getNotes();
  const index = notes.findIndex((note) => note.slug === params?.slug);
  if (index < 0) return { notFound: true };

  // "Next note" is the one after this on the index (newest first): the next one down.
  const following = notes[index + 1];

  return {
    props: {
      note: await getNote(notes[index].slug),
      next: following ? { slug: following.slug, title: following.title } : null,
    },
  };
};

export default function NotePage({
  note,
  next,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  const path = noteHref(note);
  const headline = note.subtitle
    ? `${note.title} ${note.subtitle}`
    : note.title;

  return (
    <>
      <PageMeta
        title={note.title}
        description={note.summary}
        path={path}
        type="article"
      />
      <Schema
        id="article-jsonld"
        type="Article"
        data={{
          headline,
          description: note.summary,
          url: absoluteUrl(path),
          mainEntityOfPage: absoluteUrl(path),
          datePublished: note.date,
          author: { '@type': 'Person', name: note.author.name },
          // 01 §7 wants the note's share image here; those arrive in PK-061. Until then an
          // image cover stands in, and a gradient cover leaves `image` out.
          ...(hasGradientCover(note) ? {} : { image: absoluteUrl(note.cover) }),
        }}
      />
      <BreadcrumbJsonLd
        items={[
          { name: 'Notes', path: '/notes' },
          { name: note.title, path },
        ]}
      />

      <Box as="article" paddingBottom="120px">
        <ArticleHeader note={note} />
        <NoteBody source={note.source} />
        <PageContainer width="prose">
          <NoteEnd components={note.components} next={next} />
        </PageContainer>
      </Box>
    </>
  );
}

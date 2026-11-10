import { chakra } from '@chakra-ui/react';
import { Callout } from '@postkit/chakra';
import Head from 'next/head';
import { useState, type FormEvent } from 'react';

import { PageMeta, ResultPage } from '../components/layout';
import { TextLink } from '../components/legal/text-link';
import { Button, TextField } from '../components/primitives';
import { useSearch } from '../lib/search';

const destinations = [
  { href: '/components', label: 'Components' },
  { href: '/docs', label: 'Docs' },
  { href: '/notes', label: 'Notes' },
] as const;

/** The search field: submitting opens the site search dialog with the query (01 §6.8). */
function NotFoundSearch() {
  const { openSearch } = useSearch();
  const [query, setQuery] = useState('');

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    openSearch({ query: query.trim() });
  };

  return (
    <chakra.form
      role="search"
      onSubmit={onSubmit}
      marginInline="auto"
      marginTop="32px"
      maxW="480px"
      display="flex"
      gap="8px"
      textAlign="left"
    >
      <chakra.div flex="1" minWidth="0">
        <TextField
          label="Search postkit.org"
          hideLabel
          type="search"
          name="q"
          size="lg"
          shape="pill"
          placeholder="Search components and docs"
          autoComplete="off"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </chakra.div>
      <Button type="submit" variant="primary" size="lg" flex="none">
        Search
      </Button>
    </chakra.form>
  );
}

/** Next's static 404 (SiteNotFound, PhoneNotFound): it renders for every unknown URL. */
export default function NotFoundPage() {
  return (
    <>
      <PageMeta
        title="Page not found"
        description="Nothing here. It moved, or it never was. Search Postkit's components and docs instead."
        path="/404"
      />
      <Head>
        <meta key="robots" name="robots" content="noindex" />
      </Head>

      <ResultPage
        label="404"
        title="Nothing here."
        quiet="It moved, or it never was."
        titleMaxW="16ch"
        actions={destinations.map((destination) => (
          <TextLink
            key={destination.href}
            href={destination.href}
            variant="plain"
            display="inline-flex"
            alignItems="center"
            minHeight="44px"
            paddingInline="8px"
            fontSize="body"
          >
            {destination.label} ›
          </TextLink>
        ))}
      >
        <chakra.div marginInline="auto" maxW="480px" textAlign="left">
          <Callout tone="caution" title="Unknown page">
            If this were a component, the build would have caught it. Try
            searching instead.
          </Callout>
        </chakra.div>
        <NotFoundSearch />
      </ResultPage>
    </>
  );
}

import { Box, chakra, Flex, Grid } from '@chakra-ui/react';
import type { PostkitComponentCatalogEntry } from '@postkit/chakra';
import { useDeferredValue, useState } from 'react';

import type { ComponentKit } from '../../lib/components';
import { TwoToneHeading } from '../layout';
import { TextField } from '../primitives';
import { ComponentTile } from './component-tile';
import { KitChips } from './kit-chips';

function matches(component: PostkitComponentCatalogEntry, query: string) {
  if (!query) return true;
  const haystack = [
    component.name,
    component.description,
    component.category,
    ...component.keywords,
  ]
    .join(' ')
    .toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => haystack.includes(term));
}

function countLabel(count: number): string {
  return `${count} ${count === 1 ? 'component' : 'components'}`;
}

/**
 * The catalog under the page title (SiteComponents, PhoneComponents): the "Search
 * components" filter and the kit chips, then one section per kit with its tiles. Counts
 * are the manifest's. The filter narrows the tiles in place; it isn't a second site search.
 */
export function ComponentCatalog({
  kits,
}: {
  readonly kits: readonly ComponentKit[];
}) {
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query.trim());
  const visibleKits = kits
    .map((kit) => ({
      kit,
      components: kit.components.filter((component) =>
        matches(component, deferredQuery),
      ),
    }))
    .filter((entry) => entry.components.length > 0);
  const visibleCount = visibleKits.reduce(
    (total, entry) => total + entry.components.length,
    0,
  );

  return (
    <>
      <Flex marginTop="48px" wrap="wrap" align="center" gap="12px">
        <Box flex="1 1 260px" maxWidth={{ base: '100%', md: '360px' }}>
          <TextField
            label="Search components"
            hideLabel
            shape="pill"
            type="search"
            placeholder="Search components"
            autoComplete="off"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </Box>
        <Box
          minWidth="0"
          maxWidth="100%"
          flex={{ base: '1 1 100%', md: '0 1 auto' }}
        >
          <KitChips
            kits={kits.map((kit) => ({
              id: kit.id,
              name: kit.name,
              count: kit.components.length,
            }))}
          />
        </Box>
      </Flex>

      <chakra.p srOnly aria-live="polite">
        {deferredQuery ? `${countLabel(visibleCount)} found` : ''}
      </chakra.p>

      {visibleKits.length === 0 ? (
        <chakra.p marginTop="64px" color="fg.muted" fontSize="17px">
          No components match “{deferredQuery}”.
        </chakra.p>
      ) : null}

      {visibleKits.map(({ kit, components }) => (
        <chakra.section
          key={kit.id}
          id={kit.id}
          aria-labelledby={`${kit.id}-heading`}
          // The top padding clears the sticky header when a kit chip jumps here.
          paddingTop={{ base: '64px', md: '96px' }}
        >
          <Flex
            wrap="wrap"
            align="baseline"
            justify="space-between"
            gap="8px 24px"
            paddingBottom="20px"
            borderBottomWidth="1px"
            borderBottomColor="border"
          >
            <TwoToneHeading
              as="h2"
              id={`${kit.id}-heading`}
              textStyle="docsH2"
              fontSize="clamp(28px, 3vw, 36px)"
              lineHeight="1.12"
              title={`${kit.name}.`}
              quiet={kit.tagline}
            />
            <chakra.span fontSize="15px" color="fg.muted">
              {countLabel(kit.components.length)}
            </chakra.span>
          </Flex>
          <Grid
            as="ul"
            margin="28px 0 0"
            padding="0"
            listStyleType="none"
            templateColumns={{
              base: 'repeat(2, minmax(0, 1fr))',
              md: 'repeat(auto-fill, minmax(240px, 1fr))',
            }}
            gap={{ base: '28px 12px', md: '40px 20px' }}
          >
            {components.map((component) => (
              <chakra.li key={component.name} minWidth="0">
                <ComponentTile component={component} />
              </chakra.li>
            ))}
          </Grid>
        </chakra.section>
      ))}
    </>
  );
}

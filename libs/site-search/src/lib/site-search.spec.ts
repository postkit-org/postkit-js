// The search acceptance rows in 07 §2, against the real site content (libs/content, the
// component manifest and apps/site/src/content/search-*.json).
import {
  loadSiteContent,
  loadSiteSearchConfig,
} from '../../tests/site-content';
import {
  buildSearchIndex,
  createSiteSearch,
  createSiteSearchHandler,
  findUnknownSynonymTargets,
  groupSearchResults,
  resolveFeatured,
  SearchFeaturedError,
  toSearchContent,
  type SiteSearchResponse,
} from '../index';

const content = loadSiteContent();
const config = loadSiteSearchConfig();
const production = buildSearchIndex(toSearchContent(content), {
  includeDrafts: false,
});
const search = createSiteSearch(production, config);

const draftRoutes = new Set([
  ...content.docs
    .filter((entry) => entry.status === 'draft')
    .map((entry) => `/docs/${entry.slug}`),
  ...content.notes
    .filter((note) => note.status === 'draft')
    .map((note) => `/notes/${note.slug}`),
]);
const pageRoute = (route: string) => route.split('#')[0];

describe('records', () => {
  it('build deterministically, whatever order the content arrives in', () => {
    const reversed = buildSearchIndex(
      toSearchContent({
        components: [...content.components].reverse(),
        componentPages: [...content.componentPages].reverse(),
        docs: [...content.docs].reverse(),
        notes: [...content.notes].reverse(),
        changelog: [...content.changelog].reverse(),
      }),
      { includeDrafts: false },
    );
    expect(JSON.stringify(reversed)).toBe(JSON.stringify(production));
    expect(
      JSON.stringify(
        buildSearchIndex(toSearchContent(content), { includeDrafts: false }),
      ),
    ).toBe(JSON.stringify(production));
  });

  it('have one record per component, docs section, note and changelog entry', () => {
    const ids = production.records.map((record) => record.id);
    expect(new Set(ids).size).toBe(ids.length);

    const byCollection = (id: string) =>
      production.records.filter((record) => record.collectionId === id);
    expect(byCollection('components')).toHaveLength(content.components.length);
    expect(byCollection('changelog')).toHaveLength(content.changelog.length);
    expect(
      byCollection('docs').filter((record) => record.kind === 'heading').length,
    ).toBeGreaterThan(content.docs.length);

    const quickStart = byCollection('docs').filter(
      (record) => record.pageId === 'docs:/docs/quick-start',
    );
    expect(quickStart[0]).toMatchObject({ kind: 'page', title: 'Quick start' });
    for (const section of quickStart.slice(1)) {
      expect(section.kind).toBe('heading');
      expect(section.route).toBe(`/docs/quick-start#${section.headingId}`);
      expect(section.sectionTitle).toBeTruthy();
    }
  });

  it('leave drafts out in production and keep upcoming changelog entries', () => {
    expect(draftRoutes.size).toBeGreaterThan(0);
    for (const record of production.records) {
      expect(draftRoutes.has(pageRoute(record.route))).toBe(false);
    }
    const upcoming = content.changelog.find(
      (entry) => entry.status === 'upcoming',
    );
    expect(upcoming).toBeDefined();
    expect(
      production.records.some(
        (record) => record.route === `/changelog/${upcoming?.slug}`,
      ),
    ).toBe(true);

    const development = buildSearchIndex(toSearchContent(content), {
      includeDrafts: true,
    });
    expect(
      development.records.some((record) =>
        draftRoutes.has(pageRoute(record.route)),
      ),
    ).toBe(true);
  });

  it('drop code fences, comments and directive fences from the text', () => {
    for (const record of production.records) {
      expect(record.text).not.toMatch(/```|\{\/\*|^:::/m);
    }
  });
});

describe('search', () => {
  it('"callout" puts Callout first', () => {
    const response = search.search({ query: 'callout' });
    expect(response.results[0]).toMatchObject({
      title: 'Callout',
      route: '/components/callout',
      collectionId: 'components',
    });
  });

  it('"accordion" finds Disclosure (synonym)', () => {
    const response = search.search({ query: 'accordion' });
    expect(response.results[0]).toMatchObject({ title: 'Disclosure' });
  });

  it('"timeline" gives no results and three suggestions', () => {
    const response = search.search({ query: 'timeline' });
    expect(response.results).toEqual([]);
    expect(response.suggestions).toHaveLength(3);
    for (const suggestion of response.suggestions ?? []) {
      expect(
        production.pages.some((page) => page.route === suggestion.route),
      ).toBe(true);
    }
  });

  it('tolerates a typo and a partial word', () => {
    expect(search.search({ query: 'calout' }).results[0]?.title).toBe(
      'Callout',
    );
    expect(search.search({ query: 'carousle' }).results[0]?.title).toBe(
      'Carousel',
    );
    expect(search.search({ query: 'instal' }).results[0]?.route).toMatch(
      /^\/docs\/installation/,
    );
  });

  it('groups Components → Docs → Notes → Changelog, at most four each', () => {
    for (const query of ['callout', 'next', 'theme', 'code']) {
      const response = search.search({ query });
      const order = ['components', 'docs', 'notes', 'changelog'];
      const collections = response.results.map(
        (result) => result.collectionId ?? '',
      );
      expect(
        [...collections].sort((a, b) => order.indexOf(a) - order.indexOf(b)),
      ).toEqual(collections);
      for (const id of order) {
        expect(
          collections.filter((collection) => collection === id).length,
        ).toBeLessThanOrEqual(4);
      }
      expect(groupSearchResults(response).map((group) => group.id)).toEqual(
        order.filter((id) => collections.includes(id)),
      );
    }
  });

  it('never returns drafts in production', () => {
    for (const query of [
      'eject',
      'email',
      'kits',
      'headless',
      'one article',
      'renderers',
    ]) {
      for (const result of search.search({ query }).results) {
        expect(draftRoutes.has(pageRoute(result.route))).toBe(false);
      }
    }
  });

  it('scopes to one collection', () => {
    const response = search.search({
      query: 'callout',
      collectionIds: ['docs'],
    });
    expect(response.results.length).toBeGreaterThan(0);
    expect(
      response.results.every((result) => result.collectionId === 'docs'),
    ).toBe(true);
  });

  it('snippets show the sentence with the match', () => {
    const response = search.search({ query: 'callout' });
    const changelog = response.results.find(
      (result) => result.collectionId === 'changelog',
    );
    expect(changelog?.description).toMatch(/callout/i);
    expect(response.results[0]?.description).toBe(
      'A highlighted note, tip, warning, or caution.',
    );
  });
});

describe('featured (empty query)', () => {
  it('returns the featured entries in order', () => {
    const response = search.search({ query: '' });
    expect(response.kind).toBe('featured');
    expect(response.results.map((result) => result.title)).toEqual([
      ...config.featured.jumpTo.map((entry) => entry.label),
      ...config.featured.popularComponents,
    ]);
    expect(response.results.map((result) => result.route)).toEqual([
      ...config.featured.jumpTo.map((entry) =>
        entry.href === 'latest-release' ? '/changelog/0-2-0' : entry.href,
      ),
      ...config.featured.popularComponents.map(
        (name) => production.pages.find((page) => page.title === name)?.route,
      ),
    ]);
    expect(groupSearchResults(response).map((group) => group.label)).toEqual([
      'Jump to',
      'Popular components',
    ]);
  });

  it('resolves latest-release to the newest released entry, never an upcoming one', () => {
    const latest = search.featured.find(
      (result) => result.title === 'Latest release',
    );
    expect(latest?.route).toBe('/changelog/0-2-0');
    expect(latest?.description).toBe('0.2.0, September 3, 2026.');
  });

  it('shows only docs entries when scoped to docs', () => {
    const response = search.search({ query: '  ', collectionIds: ['docs'] });
    expect(response.results.map((result) => result.title)).toEqual(
      config.featured.jumpTo
        .filter((entry) => entry.group === 'docs')
        .map((entry) => entry.label),
    );
  });

  it('fails when an entry is not a published page', () => {
    const broken = {
      jumpTo: [
        ...config.featured.jumpTo,
        { label: 'Eject', href: '/docs/eject', group: 'docs' },
        { label: 'Nowhere', href: '/docs/nowhere', group: 'docs' },
      ],
      popularComponents: [...config.featured.popularComponents, 'Timeline'],
    };
    expect(() => resolveFeatured(broken, production)).toThrow(
      SearchFeaturedError,
    );
    try {
      resolveFeatured(broken, production);
    } catch (error) {
      expect((error as SearchFeaturedError).problems).toEqual([
        '"Eject" → /docs/eject',
        '"Nowhere" → /docs/nowhere',
        'popular component "Timeline"',
      ]);
    }
  });

  it('every synonym target is a real component or docs page', () => {
    expect(findUnknownSynonymTargets(config.synonyms, production)).toEqual([]);
  });
});

describe('GET /api/search handler', () => {
  const handler = createSiteSearchHandler(search);
  const get = (query: string, init?: RequestInit) =>
    handler(new Request(`https://postkit.org/api/search${query}`, init));

  it('answers GET with grouped JSON and a short Cache-Control', async () => {
    const response = await get('?q=callout');
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toMatch(/max-age=60/);
    const body = (await response.json()) as SiteSearchResponse;
    expect(body.results[0]?.title).toBe('Callout');
    expect(JSON.stringify(body)).not.toMatch(/"text"|"headings"/);
  });

  it('rejects over-long queries and too many results', async () => {
    expect((await get(`?q=${'a'.repeat(129)}`)).status).toBe(400);
    expect((await get(`?q=${'a'.repeat(128)}`)).status).toBe(200);
    expect((await get('?q=callout&limit=21')).status).toBe(400);
  });

  it('rejects anything but GET', async () => {
    for (const method of ['POST', 'PUT', 'DELETE', 'PATCH']) {
      const response = await get('?q=callout', { method });
      expect(response.status).toBe(405);
      expect(response.headers.get('allow')).toBe('GET');
    }
  });

  it('answers a warm request well under 100 ms', async () => {
    await get('?q=callout');
    const started = performance.now();
    for (const query of ['callout', 'accordion', 'timeline', 'next', '']) {
      await get(`?q=${encodeURIComponent(query)}`);
    }
    expect((performance.now() - started) / 5).toBeLessThan(100);
  });
});

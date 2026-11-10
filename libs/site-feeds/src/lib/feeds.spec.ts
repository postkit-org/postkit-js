import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildSiteFeeds, resolveSiteUrl, writeSiteFeeds } from './build.js';
import { createSiteFeed, type SiteFeedItem } from './feeds.js';
import { validateAtom, validateJsonFeed, validateRss } from './validate.js';
import { childElements, parseXml, textContent } from './xml.js';

const contentDirectory = fileURLToPath(
  new URL('../../../content', import.meta.url),
);
const siteUrl = 'https://postkit.org';

function expectValid(feed: { rss: string; atom: string; json: string }) {
  expect(validateRss(feed.rss)).toEqual([]);
  expect(validateAtom(feed.atom)).toEqual([]);
  expect(validateJsonFeed(feed.json)).toEqual([]);
}

/** Every URL-looking string in a feed: link text, href/src attributes and JSON values. */
function urlsIn(source: string): string[] {
  return [
    ...source.matchAll(
      /(?:href|src)=(?:"|&quot;)([^"&]*)|<(?:link|guid|id)>([^<]*)<|"(?:url|home_page_url|feed_url|id)": "([^"]*)"/g,
    ),
  ].map((match) => match[1] ?? match[2] ?? match[3]);
}

const item: SiteFeedItem = {
  url: 'https://postkit.org/notes/a',
  title: 'A & <B>',
  summary: 'Summary.',
  date: '2026-10-01',
  author: 'Ryan Hefner',
  tags: ['guide'],
  contentHtml:
    '<p>Body with ]]&gt; and <a href="https://postkit.org/x">a link</a>.</p>]]>',
};
const options = {
  title: 'Postkit notes',
  description: 'Notes.',
  homePageUrl: 'https://postkit.org/notes',
  feedBaseUrl: 'https://postkit.org/feeds/notes',
};

describe('createSiteFeed', () => {
  it('adds full content to the @chakra-docs/feed output in all three formats', () => {
    const feed = createSiteFeed([item], options);
    expectValid(feed);

    const rss = parseXml(feed.rss);
    expect(rss.attributes['xmlns:content']).toBe(
      'http://purl.org/rss/1.0/modules/content/',
    );
    const [rssItem] = childElements(childElements(rss, 'channel')[0], 'item');
    expect(textContent(childElements(rssItem, 'content:encoded')[0])).toBe(
      item.contentHtml,
    );
    expect(textContent(childElements(rssItem, 'description')[0])).toBe(
      'Summary.',
    );

    const atom = parseXml(feed.atom);
    expect(textContent(childElements(atom, 'id')[0])).toBe(options.homePageUrl);
    const [entry] = childElements(atom, 'entry');
    const content = childElements(entry, 'content')[0];
    expect(content.attributes['type']).toBe('html');
    expect(textContent(content)).toBe(item.contentHtml);
    expect(
      childElements(atom, 'link').find(
        (link) => link.attributes['rel'] === 'self',
      )?.attributes['href'],
    ).toBe('https://postkit.org/feeds/notes.atom');

    const json = JSON.parse(feed.json);
    expect(json.feed_url).toBe('https://postkit.org/feeds/notes.json');
    expect(json.items[0]).toMatchObject({
      id: item.url,
      url: item.url,
      title: item.title,
      summary: 'Summary.',
      content_html: item.contentHtml,
      date_published: '2026-10-01T00:00:00.000Z',
      authors: [{ name: 'Ryan Hefner' }],
    });
  });

  it('writes valid, empty feeds', () => {
    const feed = createSiteFeed([], options);
    expectValid(feed);
    expect(JSON.parse(feed.json).items).toEqual([]);
  });

  it('rejects duplicate items', () => {
    expect(() => createSiteFeed([item, item], options)).toThrow(/Duplicate/);
  });
});

describe('validators', () => {
  const valid = createSiteFeed([item], options);

  it('report missing RSS 2.0 structure and relative URLs', () => {
    expect(validateRss('<rss><channel /></rss>')).toEqual(
      expect.arrayContaining([
        '<rss> needs version="2.0"',
        '<channel> needs <title>',
        '<channel> needs <link>',
        '<channel> needs <description>',
      ]),
    );
    expect(validateRss('<feed />')).toContain('Root is <feed>, not <rss>');
    expect(
      validateRss(valid.rss.replace('https://postkit.org/x', '/x')),
    ).toContain('item 1: relative URL "/x" in the content');
    expect(
      validateRss(
        valid.rss.replace(
          '<link>https://postkit.org/notes/a</link>',
          '<link>/notes/a</link>',
        ),
      ),
    ).toContain('item 1: <link> must be an absolute URL');
    expect(validateRss('<rss version="2.0"><channel>')).toEqual([
      expect.stringMatching(/^Not well-formed XML/),
    ]);
  });

  it('report missing Atom structure', () => {
    expect(validateAtom('<feed><entry /></feed>')).toEqual(
      expect.arrayContaining([
        '<feed> needs xmlns="http://www.w3.org/2005/Atom"',
        '<feed>: needs exactly one <id>',
        'entry 1: needs exactly one <updated>',
        'entry 1: needs a <link>',
        'entry 1: needs an <author> (the feed has none)',
      ]),
    );
    expect(
      validateAtom(
        valid.atom.replace(
          /<updated>[^<]*<\/updated>/,
          '<updated>yesterday</updated>',
        ),
      ),
    ).toContain('<feed>: <updated> "yesterday" isn\'t an RFC 3339 date');
  });

  it('report missing JSON Feed 1.1 fields', () => {
    expect(validateJsonFeed('{"items": [{}]}')).toEqual([
      'version must be "https://jsonfeed.org/version/1.1"',
      'title is required',
      'item 1: id must be a non-empty string',
      'item 1: needs content_html or content_text',
    ]);
    const json = JSON.parse(valid.json);
    json.items[0].url = '/notes/a';
    expect(validateJsonFeed(JSON.stringify(json))).toContain(
      'item 1: url must be an absolute URL',
    );
    expect(validateJsonFeed('nope')[0]).toMatch(/^Not valid JSON/);
  });
});

describe('the site feeds, from libs/content', () => {
  it('leave out drafts and upcoming releases in production', () => {
    const [notes, changelog] = buildSiteFeeds({
      contentDirectory,
      siteUrl,
      nodeEnv: 'production',
    });

    // The only note is a draft today.
    expect(notes.name).toBe('notes');
    expect(notes.items).toEqual([]);
    expectValid(notes.artifacts);

    expect(changelog.items.map((entry) => entry.url)).toEqual([
      'https://postkit.org/changelog/0-2-0',
      'https://postkit.org/changelog/0-1-0',
    ]);
    // Callout titles are prop text: they read as text, not only as annotations.
    expect(changelog.items[0].contentHtml).toContain(
      '<p data-postkit-part="title"><strong>Review before upgrading</strong></p>',
    );
    expect(changelog.items[1].contentHtml).toContain(
      '<strong>Release status</strong>',
    );
    expectValid(changelog.artifacts);
    for (const source of Object.values(changelog.artifacts)) {
      expect(source).toContain('0-2-0');
      expect(source).toContain('0-1-0');
      expect(source).not.toContain('0-3-0');
      expect(source).not.toContain('0.3.0');
    }
  });

  it('include drafts outside production', () => {
    const [notes] = buildSiteFeeds({
      contentDirectory,
      siteUrl,
      nodeEnv: 'development',
    });
    expect(notes.items.map((note) => note.url)).toEqual([
      'https://postkit.org/notes/one-article-four-renderers',
    ]);
    // The whole note, including the components whose content is only in props.
    const html = notes.items[0].contentHtml;
    for (const text of [
      'Components are defined once, outside any framework.',
      'npm install @postkit/react',
      'added 1 package in 2s',
      'post.mdx',
      'The file stays plain text. The renderer is a choice you can change later.',
      '— Postkit design principles',
      '<strong>Theme the parts.</strong>',
      'Style root, icon and title with CSS or a recipe.',
      'href="https://github.com/postkit-org/postkit-js"',
      'Portable web and email components, Markdown tooling and framework adapters.',
    ]) {
      expect(html).toContain(text);
    }
    expectValid(notes.artifacts);
  });

  it('use absolute URLs on the configured origin', () => {
    const origin = resolveSiteUrl('https://preview.example.com/');
    expect(origin).toBe('https://preview.example.com');
    for (const feed of buildSiteFeeds({
      contentDirectory,
      siteUrl: origin,
      nodeEnv: 'development',
    })) {
      for (const source of Object.values(feed.artifacts)) {
        const urls = urlsIn(source);
        expect(urls.length).toBeGreaterThan(0);
        for (const url of urls) {
          // Content may link off-site (GitHub); nothing is relative.
          expect(url).toMatch(/^https:\/\//);
        }
        expect(source).not.toContain('https://postkit.org');
      }
    }
  });
});

describe('writeSiteFeeds', () => {
  let root: string;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'site-feeds-'));
    mkdirSync(join(root, 'content', 'notes'), { recursive: true });
    mkdirSync(join(root, 'content', 'changelog'), { recursive: true });
    const note = (slug: string, status: string, date: string) =>
      writeFileSync(
        join(root, 'content', 'notes', `${slug}.md`),
        `---\ntitle: ${slug}\nsummary: About ${slug}.\nkind: guide\ndate: ${date}\nauthor:\n  name: Ryan Hefner\nstatus: ${status}\n---\n\nBody of ${slug}, see [the docs](/docs/mdx).\n`,
      );
    note('published-note', 'published', '2026-10-01');
    note('draft-note', 'draft', '2026-10-02');
    const release = (version: string, status: string) =>
      writeFileSync(
        join(root, 'content', 'changelog', `${version}.md`),
        `---\ntitle: Postkit ${version}\nsubtitle: Things.\nversion: ${version}\nstatus: ${status}\ndate: 2026-09-01\nsummary: Release ${version}.\n---\n\nNotes for ${version}.\n`,
      );
    release('1.0.0', 'released');
    release('1.1.0', 'upcoming');
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it('writes six valid files without drafts or upcoming entries', () => {
    const outDirectory = join(root, 'public', 'feeds');
    writeSiteFeeds({
      contentDirectory: join(root, 'content'),
      outDirectory,
      siteUrl,
      nodeEnv: 'production',
    });
    const read = (file: string) =>
      readFileSync(join(outDirectory, file), 'utf8');
    for (const name of ['notes', 'changelog']) {
      expectValid({
        rss: read(`${name}.xml`),
        atom: read(`${name}.atom`),
        json: read(`${name}.json`),
      });
    }
    const notes = read('notes.json');
    expect(notes).toContain('https://postkit.org/notes/published-note');
    expect(notes).toContain('https://postkit.org/docs/mdx');
    expect(notes).not.toContain('draft-note');
    const changelog = read('changelog.atom');
    expect(changelog).toContain('https://postkit.org/changelog/1-0-0');
    expect(changelog).not.toContain('1-1-0');
  });
});

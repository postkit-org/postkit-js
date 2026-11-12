import {
  childElements,
  parseXml,
  textContent,
  type XmlElement,
} from './xml.js';

/**
 * Structural checks for RSS 2.0, Atom (RFC 4287) and JSON Feed 1.1: the required elements
 * and fields, valid dates, and absolute `http(s)` URLs everywhere a feed or its item HTML
 * links somewhere. They return problems rather than throw, so a test can assert on them and
 * the build can list every problem at once.
 */

const ATOM_NAMESPACE = 'http://www.w3.org/2005/Atom';
const JSON_FEED_VERSION = 'https://jsonfeed.org/version/1.1';
/** RFC 3339 date-time, as Atom and JSON Feed require. */
const RFC3339 =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;
/** RFC 822 (with four-digit years, as RSS 2.0 recommends): `Thu, 03 Sep 2026 00:00:00 GMT`. */
const RFC822 =
  /^(?:(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun), )?\d{1,2} (?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{4} \d{2}:\d{2}(?::\d{2})? (?:GMT|UT|Z|[+-]\d{4}|[A-Z]{3})$/;

export function isAbsoluteHttpUrl(value: string | undefined): boolean {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

/** `href`/`src` values in item HTML that aren't absolute (fragments are fine). */
export function relativeUrlsInHtml(html: string): string[] {
  return [...html.matchAll(/\s(?:href|src|poster|cite)="([^"]*)"/g)]
    .map((match) => match[1].replaceAll('&amp;', '&'))
    .filter((url) => !url.startsWith('#') && !/^(?:mailto|tel):/.test(url))
    .filter((url) => !isAbsoluteHttpUrl(url));
}

function text(element: XmlElement, name: string): string | undefined {
  const child = childElements(element, name)[0];
  return child ? textContent(child).trim() : undefined;
}

function checkHtml(
  html: string | undefined,
  where: string,
  problems: string[],
) {
  if (html === undefined) return;
  for (const url of relativeUrlsInHtml(html)) {
    problems.push(`${where}: relative URL "${url}" in the content`);
  }
}

function parse(source: string, problems: string[]): XmlElement | undefined {
  try {
    return parseXml(source);
  } catch (error) {
    problems.push(`Not well-formed XML: ${(error as Error).message}`);
    return undefined;
  }
}

export function validateRss(source: string): string[] {
  const problems: string[] = [];
  const root = parse(source, problems);
  if (!root) return problems;
  if (root.name !== 'rss') problems.push(`Root is <${root.name}>, not <rss>`);
  if (root.attributes['version'] !== '2.0') {
    problems.push('<rss> needs version="2.0"');
  }
  const channels = childElements(root, 'channel');
  if (channels.length !== 1) {
    problems.push(`Expected one <channel>, found ${channels.length}`);
    return problems;
  }
  const [channel] = channels;
  for (const name of ['title', 'link', 'description']) {
    if (!text(channel, name)) problems.push(`<channel> needs <${name}>`);
  }
  if (!isAbsoluteHttpUrl(text(channel, 'link'))) {
    problems.push('<channel><link> must be an absolute URL');
  }
  childElements(channel, 'item').forEach((item, index) => {
    const where = `item ${index + 1}`;
    if (!text(item, 'title') && !text(item, 'description')) {
      problems.push(`${where}: needs <title> or <description>`);
    }
    if (!isAbsoluteHttpUrl(text(item, 'link'))) {
      problems.push(`${where}: <link> must be an absolute URL`);
    }
    const guid = childElements(item, 'guid')[0];
    if (
      guid &&
      guid.attributes['isPermaLink'] !== 'false' &&
      !isAbsoluteHttpUrl(textContent(guid).trim())
    ) {
      problems.push(`${where}: a permalink <guid> must be an absolute URL`);
    }
    const pubDate = text(item, 'pubDate');
    if (pubDate !== undefined && !RFC822.test(pubDate)) {
      problems.push(`${where}: <pubDate> "${pubDate}" isn't an RFC 822 date`);
    }
    const encoded = childElements(item, 'content:encoded')[0];
    if (encoded) {
      if (!root.attributes['xmlns:content']) {
        problems.push('<content:encoded> needs the xmlns:content namespace');
      }
      checkHtml(textContent(encoded), where, problems);
    }
  });
  return problems;
}

export function validateAtom(source: string): string[] {
  const problems: string[] = [];
  const root = parse(source, problems);
  if (!root) return problems;
  if (root.name !== 'feed') problems.push(`Root is <${root.name}>, not <feed>`);
  if (root.attributes['xmlns'] !== ATOM_NAMESPACE) {
    problems.push(`<feed> needs xmlns="${ATOM_NAMESPACE}"`);
  }
  const requireCommon = (element: XmlElement, where: string) => {
    for (const name of ['id', 'title', 'updated']) {
      if (childElements(element, name).length !== 1) {
        problems.push(`${where}: needs exactly one <${name}>`);
      }
    }
    if (!isAbsoluteHttpUrl(text(element, 'id'))) {
      problems.push(`${where}: <id> must be an absolute URL`);
    }
    const updated = text(element, 'updated');
    if (updated !== undefined && !RFC3339.test(updated)) {
      problems.push(`${where}: <updated> "${updated}" isn't an RFC 3339 date`);
    }
    for (const link of childElements(element, 'link')) {
      if (!isAbsoluteHttpUrl(link.attributes['href'])) {
        problems.push(`${where}: <link href> must be an absolute URL`);
      }
    }
  };
  const hasAuthor = (element: XmlElement) =>
    childElements(element, 'author').some((author) => !!text(author, 'name'));

  requireCommon(root, '<feed>');
  const feedHasAuthor = hasAuthor(root);
  childElements(root, 'entry').forEach((entry, index) => {
    const where = `entry ${index + 1}`;
    requireCommon(entry, where);
    if (childElements(entry, 'link').length === 0) {
      problems.push(`${where}: needs a <link>`);
    }
    if (!feedHasAuthor && !hasAuthor(entry)) {
      problems.push(`${where}: needs an <author> (the feed has none)`);
    }
    const content = childElements(entry, 'content')[0];
    if (content) {
      if (content.attributes['type'] !== 'html') {
        problems.push(`${where}: <content> should be type="html"`);
      }
      checkHtml(textContent(content), where, problems);
    }
  });
  return problems;
}

export function validateJsonFeed(source: string): string[] {
  const problems: string[] = [];
  let feed: Record<string, unknown>;
  try {
    feed = JSON.parse(source) as Record<string, unknown>;
  } catch (error) {
    return [`Not valid JSON: ${(error as Error).message}`];
  }
  if (feed['version'] !== JSON_FEED_VERSION) {
    problems.push(`version must be "${JSON_FEED_VERSION}"`);
  }
  if (typeof feed['title'] !== 'string' || feed['title'] === '') {
    problems.push('title is required');
  }
  for (const key of ['home_page_url', 'feed_url']) {
    if (feed[key] !== undefined && !isAbsoluteHttpUrl(feed[key] as string)) {
      problems.push(`${key} must be an absolute URL`);
    }
  }
  if (!Array.isArray(feed['items'])) {
    problems.push('items must be an array');
    return problems;
  }
  const ids = new Set<string>();
  (feed['items'] as Record<string, unknown>[]).forEach((item, index) => {
    const where = `item ${index + 1}`;
    if (typeof item['id'] !== 'string' || item['id'] === '') {
      problems.push(`${where}: id must be a non-empty string`);
    } else if (ids.has(item['id'])) {
      problems.push(`${where}: duplicate id "${item['id']}"`);
    } else {
      ids.add(item['id']);
    }
    if (
      typeof item['content_html'] !== 'string' &&
      typeof item['content_text'] !== 'string'
    ) {
      problems.push(`${where}: needs content_html or content_text`);
    }
    if (
      item['url'] !== undefined &&
      !isAbsoluteHttpUrl(item['url'] as string)
    ) {
      problems.push(`${where}: url must be an absolute URL`);
    }
    for (const key of ['date_published', 'date_modified']) {
      const value = item[key];
      if (value !== undefined && !RFC3339.test(String(value))) {
        problems.push(`${where}: ${key} "${String(value)}" isn't RFC 3339`);
      }
    }
    checkHtml(
      typeof item['content_html'] === 'string'
        ? item['content_html']
        : undefined,
      where,
      problems,
    );
  });
  return problems;
}

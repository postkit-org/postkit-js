import {
  postkitBuiltInDefinitions,
  type PostkitBuiltInComponentName,
} from '../components/built-ins.js';
import type { AnyPostkitComponentDefinition } from '../components/definition.js';
import type {
  PostkitComponentNode,
  PostkitJsonValue,
  PostkitTextNode,
} from './document.js';

/**
 * Options for the static views that the HTML and plain-text serializers use
 * for Postkit's built-in components.
 */
export interface PostkitStaticViewOptions {
  /**
   * Resolves relative URLs (`/docs/mdx`) against this URL, for outputs read
   * without a base URL (feeds, email). Fragment-only links stay as they are.
   */
  readonly baseUrl?: string;
  /**
   * The audiences this output is for. When set, an `AudienceBoundary` for any
   * other audience shows its fallback copy and leaves its content out. When
   * unset, every boundary shows its content, like the headless view's default.
   */
  readonly audiences?: readonly string[];
  /**
   * The page where readers can subscribe. `NewsletterSignup` becomes a link to
   * it; without one, the signup is left out (a form can't work statically).
   */
  readonly newsletterUrl?: string;
}

/** @internal An attribute a static view sets. `undefined` and `false` are omitted. */
export type PostkitViewAttributeValue = boolean | number | string | undefined;

/** @internal One element of a static view, carrying its anatomy part. */
export interface PostkitViewElement {
  readonly type: 'element';
  readonly name: string;
  readonly part?: string;
  readonly attributes?: Readonly<Record<string, PostkitViewAttributeValue>>;
  readonly children: readonly PostkitViewNode[];
}

/** @internal Where a view places the component's authored children. */
export interface PostkitViewSlot {
  readonly type: 'slot';
}

/** @internal */
export type PostkitViewNode =
  PostkitTextNode | PostkitViewElement | PostkitViewSlot;

/**
 * @internal The result of a static view: its markup, or `omitted` when the
 * component has nothing to show statically (the reason is documented in the
 * core README).
 */
export type PostkitStaticViewResult =
  | { readonly kind: 'view'; readonly root: PostkitViewElement }
  | { readonly kind: 'omitted' };

type Props = Readonly<Record<string, PostkitJsonValue | undefined>>;

interface ViewInput {
  /** The authored props, with the definition's defaults filled in. */
  readonly props: Props;
  /** Whether the component node has authored children. */
  readonly hasChildren: boolean;
  readonly options: PostkitStaticViewOptions;
}

type StaticView = (input: ViewInput) => PostkitViewElement | undefined;

type Child =
  | PostkitViewNode
  | string
  | number
  | false
  | null
  | undefined
  | readonly Child[];

function flatten(children: readonly Child[], into: PostkitViewNode[]): void {
  for (const child of children) {
    if (child === undefined || child === null || child === false) continue;
    if (typeof child === 'string' || typeof child === 'number') {
      const value = String(child);
      if (value) into.push({ type: 'text', value });
    } else if (Array.isArray(child)) {
      flatten(child as readonly Child[], into);
    } else {
      into.push(child as PostkitViewNode);
    }
  }
}

/** Builds a view element: `h('p', 'title', null, 'Text')`. */
function h(
  name: string,
  part: string | undefined,
  attributes: Readonly<Record<string, PostkitViewAttributeValue>> | null,
  ...children: Child[]
): PostkitViewElement {
  const nodes: PostkitViewNode[] = [];
  flatten(children, nodes);
  return {
    type: 'element',
    name,
    ...(part ? { part } : {}),
    ...(attributes ? { attributes } : {}),
    children: nodes,
  };
}

const slot: PostkitViewSlot = { type: 'slot' };

/** A titled paragraph: `<p part><strong>text</strong></p>`, readable without styles. */
function strongParagraph(part: string, text: string): PostkitViewElement {
  return h('p', part, null, h('strong', undefined, null, text));
}

/** A string prop, or a number shown as text. Blank strings count as missing. */
function str(value: unknown): string | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return typeof value === 'string' && value.trim() !== '' ? value : undefined;
}

function num(value: unknown): number | undefined {
  const parsed =
    typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
  return typeof parsed === 'number' && Number.isFinite(parsed)
    ? parsed
    : undefined;
}

function bool(value: unknown): boolean {
  return value === true || value === 'true';
}

/** A `json` prop: the value itself, or authored JSON text parsed. Invalid JSON is missing. */
function json(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return undefined;
  }
}

function list(value: unknown): readonly unknown[] {
  const parsed = json(value);
  return Array.isArray(parsed) ? parsed : [];
}

type Item = Readonly<Record<string, unknown>>;

function record(value: unknown): Item | undefined {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Item)
    : undefined;
}

/** The first of `keys` that holds text on `item`. */
function field(item: unknown, ...keys: string[]): string | undefined {
  const source = record(item);
  if (!source) return undefined;
  for (const key of keys) {
    const value = str(source[key]);
    if (value !== undefined) return value;
  }
  return undefined;
}

/** Items that are records; strings become `{ [key]: string }`. */
function items(value: unknown, stringKey = 'title'): Item[] {
  return list(value).flatMap((item): Item[] => {
    if (typeof item === 'string' || typeof item === 'number') {
      return [{ [stringKey]: String(item) }];
    }
    const entry = record(item);
    return entry ? [entry] : [];
  });
}

/** `https://www.example.com/a` → `example.com`. Relative or invalid URLs have none. */
function domainOf(href: string | undefined): string | undefined {
  if (!href) return undefined;
  try {
    const url = new URL(href);
    return url.protocol === 'http:' || url.protocol === 'https:'
      ? url.hostname.replace(/^www\./, '')
      : undefined;
  } catch {
    return undefined;
  }
}

function link(
  part: string | undefined,
  href: string | undefined,
  attributes: Readonly<Record<string, PostkitViewAttributeValue>> | null,
  ...children: Child[]
): PostkitViewElement {
  return href
    ? h('a', part, { href, ...attributes }, ...children)
    : h('span', part, null, ...children);
}

/** Code with an optional language: `<pre><code class="language-ts">`. */
function codeBlock(
  part: string | undefined,
  code: string,
  language: string | undefined,
): PostkitViewElement {
  const safeLanguage =
    language && /^[A-Za-z0-9_+#.-]+$/.test(language) ? language : undefined;
  return h(
    'pre',
    part,
    null,
    h(
      'code',
      undefined,
      safeLanguage ? { class: `language-${safeLanguage}` } : null,
      code,
    ),
  );
}

function image(
  part: string | undefined,
  src: string | undefined,
  alt: string | undefined,
  extra: Readonly<Record<string, PostkitViewAttributeValue>> = {},
): PostkitViewElement | undefined {
  return src
    ? h('img', part, { src, alt: alt ?? '', loading: 'lazy', ...extra })
    : undefined;
}

function calloutView({ props, hasChildren }: ViewInput): PostkitViewElement {
  const title = str(props['title']);
  return h(
    'aside',
    'root',
    null,
    h(
      'div',
      'content',
      null,
      title ? strongParagraph('title', title) : undefined,
      hasChildren ? h('div', 'body', null, slot) : undefined,
    ),
  );
}

function mediaFallback(
  src: string,
  title: string | undefined,
): PostkitViewElement {
  return h('a', 'fallback', { href: src }, `Open ${title ?? src}`);
}

function codeTitle(...parts: (string | undefined)[]): string | undefined {
  const text = parts.filter(Boolean).join(' · ');
  return text || undefined;
}

/**
 * Static views of the built-in components, keyed by name. Each emits the
 * anatomy parts of its definition with plain, readable markup, and never an
 * embed, iframe, form or script.
 */
const views: Readonly<Record<PostkitBuiltInComponentName, StaticView>> = {
  Aside: calloutView,
  Callout: calloutView,

  AppearsOn: ({ props }) => {
    const label = str(props['label']);
    const showDates = bool(props['showDates']);
    return h(
      'aside',
      'root',
      null,
      label ? h('p', 'label', null, label) : undefined,
      h(
        'ul',
        'list',
        null,
        items(props['items']).map((item) => {
          const date = showDates
            ? field(item, 'publishedAt', 'date')
            : undefined;
          const status = field(item, 'status');
          return h(
            'li',
            'item',
            null,
            link(
              'link',
              field(item, 'url', 'href'),
              { rel: 'syndication' },
              field(item, 'label', 'name', 'service', 'url', 'href'),
            ),
            date
              ? [' ', h('time', 'date', { datetime: date }, date)]
              : undefined,
            status && status !== 'published'
              ? [' ', h('span', 'status', null, `(${status})`)]
              : undefined,
          );
        }),
      ),
    );
  },

  AudienceBoundary: ({ props, hasChildren, options }) => {
    const audience = str(props['audience']);
    const authorized =
      options.audiences === undefined ||
      (audience !== undefined && options.audiences.includes(audience));
    const fallback = str(props['fallback']);
    return h(
      'div',
      'root',
      audience ? { 'data-postkit-audience': audience } : null,
      bool(props['showLabel']) && audience
        ? h('p', 'label', null, `Audience: ${audience}`)
        : undefined,
      authorized
        ? hasChildren
          ? h('div', 'content', null, slot)
          : undefined
        : fallback
          ? h('p', 'fallback', null, fallback)
          : undefined,
    );
  },

  Audio: ({ props }) => {
    const src = str(props['src']);
    const title = str(props['title']);
    const caption = str(props['caption']);
    return h(
      'figure',
      'root',
      null,
      title ? h('p', 'title', null, title) : undefined,
      src
        ? h(
            'audio',
            'player',
            {
              src,
              controls: true,
              preload: str(props['preload']),
              'aria-label': title,
            },
            mediaFallback(src, title),
          )
        : undefined,
      caption ? h('figcaption', 'caption', null, caption) : undefined,
    );
  },

  AuthorCard: ({ props, hasChildren }) => {
    const name = str(props['name']) ?? '';
    const role = str(props['role']);
    const bio = str(props['bio']);
    const links = items(props['links'], 'label');
    return h(
      'aside',
      'root',
      name ? { 'aria-label': `About ${name}` } : null,
      image('avatar', str(props['avatarSrc']), str(props['avatarAlt'])),
      h(
        'div',
        'content',
        null,
        h(
          'div',
          'header',
          null,
          h(
            'p',
            'name',
            null,
            h(
              'strong',
              undefined,
              null,
              link('nameLink', str(props['href']), { rel: 'author' }, name),
            ),
          ),
          role ? h('p', 'role', null, role) : undefined,
        ),
        hasChildren
          ? h('div', 'bio', null, slot)
          : bio
            ? h('p', 'bio', null, bio)
            : undefined,
        links.length
          ? h(
              'ul',
              'links',
              null,
              links.map((item) =>
                h(
                  'li',
                  undefined,
                  null,
                  link(
                    'link',
                    field(item, 'href', 'url'),
                    { rel: field(item, 'rel') },
                    field(item, 'label', 'title', 'href', 'url'),
                  ),
                ),
              ),
            )
          : undefined,
      ),
    );
  },

  CallToAction: ({ props, hasChildren }) => {
    const eyebrow = str(props['eyebrow']);
    const title = str(props['title']);
    const description = str(props['description']);
    const actions = (
      [
        ['primaryAction', props['primaryLabel'], props['primaryHref']],
        ['secondaryAction', props['secondaryLabel'], props['secondaryHref']],
      ] as const
    ).flatMap(([part, label, href]) =>
      str(label) && str(href)
        ? [h('a', part, { href: str(href) }, str(label))]
        : [],
    );
    return h(
      'aside',
      'root',
      null,
      h(
        'div',
        'content',
        null,
        eyebrow ? h('p', 'eyebrow', null, eyebrow) : undefined,
        title ? strongParagraph('title', title) : undefined,
        hasChildren
          ? h('div', 'body', null, slot)
          : description
            ? h('p', 'body', null, description)
            : undefined,
      ),
      actions.length
        ? h(
            'p',
            'actions',
            null,
            actions.flatMap((action, index) =>
              index > 0 ? [' · ', action] : [action],
            ),
          )
        : undefined,
    );
  },

  CardGrid: ({ props }) => {
    const title = str(props['title']);
    const description = str(props['description']);
    return h(
      'div',
      'root',
      null,
      title || description
        ? h(
            'div',
            'header',
            null,
            title ? strongParagraph('title', title) : undefined,
            description ? h('p', 'description', null, description) : undefined,
          )
        : undefined,
      h(
        'div',
        'grid',
        null,
        items(props['items']).map((item) => {
          const imageItem = record(item['image']);
          const href = field(item, 'href');
          const cardDescription = field(item, 'description');
          const meta = field(item, 'meta');
          return h(
            'article',
            'card',
            null,
            image('image', field(imageItem, 'src'), field(imageItem, 'alt')),
            h(
              'div',
              'cardBody',
              null,
              strongParagraph('cardTitle', field(item, 'title') ?? ''),
              cardDescription
                ? h('p', 'cardDescription', null, cardDescription)
                : undefined,
              meta ? h('p', 'meta', null, meta) : undefined,
              href
                ? h(
                    'p',
                    undefined,
                    null,
                    h(
                      'a',
                      'link',
                      { href },
                      field(item, 'linkLabel') ?? 'Learn more',
                    ),
                  )
                : undefined,
            ),
          );
        }),
      ),
    );
  },

  Carousel: ({ props, hasChildren }) => {
    const label = str(props['label']);
    return h(
      'section',
      'root',
      label ? { 'aria-label': label } : null,
      items(props['items']).map((item) => {
        const imageItem = record(item['image']);
        const title = field(item, 'title');
        const description = field(item, 'description');
        const href = field(item, 'href');
        return h(
          'figure',
          'slide',
          null,
          image('media', field(imageItem, 'src'), field(imageItem, 'alt')),
          title || description || href
            ? h(
                'figcaption',
                'content',
                null,
                title
                  ? h(
                      'p',
                      'title',
                      null,
                      h(
                        'strong',
                        undefined,
                        null,
                        link('link', href, null, title),
                      ),
                    )
                  : href
                    ? h('p', undefined, null, h('a', 'link', { href }, href))
                    : undefined,
                description
                  ? h('p', 'description', null, description)
                  : undefined,
              )
            : undefined,
        );
      }),
      hasChildren ? h('div', 'slide', null, slot) : undefined,
    );
  },

  Chart: ({ props }) => {
    const title = str(props['title']);
    const description = str(props['description']);
    const data = items(props['data'], 'label');
    const declared = items(props['series'], 'key').flatMap((series) => {
      const key = field(series, 'key');
      return key ? [{ key, label: field(series, 'label') ?? key }] : [];
    });
    const series = declared.length
      ? declared
      : [
          ...new Set(
            data.flatMap((datum) =>
              Object.keys(datum).filter(
                (key) => key !== 'label' && num(datum[key]) !== undefined,
              ),
            ),
          ),
        ].map((key) => ({ key, label: key }));
    return h(
      'figure',
      'root',
      null,
      title || description
        ? h(
            'figcaption',
            undefined,
            null,
            title ? strongParagraph('title', title) : undefined,
            description ? h('p', 'description', null, description) : undefined,
          )
        : undefined,
      data.length && series.length
        ? h(
            'table',
            'table',
            null,
            h(
              'thead',
              undefined,
              null,
              h(
                'tr',
                undefined,
                null,
                h('th', 'headerCell', { scope: 'col' }, 'Label'),
                series.map((item) =>
                  h('th', 'headerCell', { scope: 'col' }, item.label),
                ),
              ),
            ),
            h(
              'tbody',
              undefined,
              null,
              data.map((datum) =>
                h(
                  'tr',
                  undefined,
                  null,
                  h('th', 'rowHeader', { scope: 'row' }, field(datum, 'label')),
                  series.map((item) =>
                    h('td', 'dataCell', null, str(datum[item.key]) ?? '—'),
                  ),
                ),
              ),
            ),
          )
        : h('p', 'emptyState', null, 'No data.'),
    );
  },

  CodeBlock: ({ props }) => {
    const filename = str(props['filename']);
    const language = str(props['language']);
    return h(
      'figure',
      'root',
      null,
      filename
        ? h('figcaption', 'header', null, h('span', 'filename', null, filename))
        : undefined,
      codeBlock(
        'content',
        typeof props['code'] === 'string' ? props['code'] : '',
        language,
      ),
    );
  },

  CodeGroup: ({ props }) => {
    const label = str(props['label']);
    return h(
      'div',
      'root',
      label ? { role: 'group', 'aria-label': label } : null,
      items(props['items'], 'code').map((item) => {
        const caption = codeTitle(
          field(item, 'label', 'title'),
          field(item, 'filename'),
        );
        return h(
          'figure',
          'panel',
          null,
          caption ? h('figcaption', 'tab', null, caption) : undefined,
          codeBlock(
            undefined,
            typeof item['code'] === 'string' ? item['code'] : '',
            field(item, 'language'),
          ),
        );
      }),
    );
  },

  Comparison: ({ props }) => {
    const title = str(props['title']);
    const description = str(props['description']);
    const columns = list(props['columns']).map((column) => str(column) ?? '');
    const value = (cell: unknown) =>
      cell === true ? 'Yes' : cell === false ? 'No' : (str(cell) ?? '—');
    return h(
      'div',
      'root',
      null,
      title ? strongParagraph('title', title) : undefined,
      description ? h('p', 'description', null, description) : undefined,
      h(
        'table',
        'table',
        null,
        h(
          'thead',
          'head',
          null,
          h(
            'tr',
            undefined,
            null,
            h('th', 'header', { scope: 'col' }, 'Feature'),
            columns.map((column) =>
              h('th', 'header', { scope: 'col' }, column),
            ),
          ),
        ),
        h(
          'tbody',
          undefined,
          null,
          items(props['items'], 'label').map((item) => {
            const values = list(item['values']);
            return h(
              'tr',
              'row',
              null,
              h('th', 'label', { scope: 'row' }, field(item, 'label')),
              columns.map((_, index) =>
                h('td', 'value', null, value(values[index])),
              ),
            );
          }),
        ),
      ),
    );
  },

  Diff: ({ props }) => {
    const title = str(props['title']);
    const diff = typeof props['diff'] === 'string' ? props['diff'] : '';
    const lines = diff.replace(/\n$/, '').split('\n');
    return h(
      'div',
      'root',
      null,
      title
        ? h('div', 'header', null, h('p', 'title', null, title))
        : undefined,
      h(
        'pre',
        'code',
        null,
        h(
          'code',
          undefined,
          { class: 'language-diff' },
          lines.map((line, index) =>
            h(
              'span',
              'line',
              {
                'data-diff': line.startsWith('+')
                  ? 'addition'
                  : line.startsWith('-')
                    ? 'deletion'
                    : 'context',
              },
              index < lines.length - 1 ? `${line}\n` : line,
            ),
          ),
        ),
      ),
    );
  },

  Disclosure: ({ props, hasChildren }) =>
    h(
      'details',
      'root',
      { open: bool(props['open']) },
      h('summary', 'summary', null, str(props['summary'])),
      hasChildren ? h('div', 'content', null, slot) : undefined,
    ),

  Figure: ({ props }) => {
    const src = str(props['src']);
    const alt = typeof props['alt'] === 'string' ? props['alt'] : '';
    const caption = str(props['caption']);
    const credit = str(props['credit']);
    const href = str(props['href']);
    const width = num(props['width']);
    const height = num(props['height']);
    const img = image('image', src, alt, {
      width: width && width > 0 ? Math.trunc(width) : undefined,
      height: height && height > 0 ? Math.trunc(height) : undefined,
      loading: str(props['loading']),
      sizes: str(props['sizes']),
      srcset: str(props['srcSet']),
    });
    return h(
      'figure',
      'root',
      null,
      href && img ? h('a', 'mediaLink', { href }, img) : img,
      caption || credit
        ? h(
            'figcaption',
            'figcaption',
            null,
            caption ? h('span', 'caption', null, caption) : undefined,
            caption && credit ? ' ' : undefined,
            credit
              ? h(
                  'span',
                  'credit',
                  null,
                  link('creditLink', str(props['creditHref']), null, credit),
                )
              : undefined,
          )
        : undefined,
    );
  },

  FileCard: ({ props }) => {
    const name = str(props['name']) ?? '';
    const description = str(props['description']);
    const meta = [str(props['fileType']), str(props['fileSize'])]
      .filter(Boolean)
      .join(' · ');
    const download = bool(props['download']);
    return h(
      'div',
      'root',
      null,
      h(
        'div',
        'content',
        null,
        strongParagraph('name', name),
        description ? h('p', 'description', null, description) : undefined,
        meta ? h('p', 'meta', null, meta) : undefined,
      ),
      h(
        'p',
        undefined,
        null,
        link(
          'action',
          str(props['href']),
          { download },
          str(props['actionLabel']) ?? (download ? 'Download' : 'Open'),
        ),
      ),
    );
  },

  FileTree: ({ props }) => {
    const title = str(props['title']);
    return h(
      'div',
      'root',
      null,
      title ? strongParagraph('title', title) : undefined,
      h(
        'ul',
        'list',
        null,
        items(props['items'], 'path').map((item) => {
          const path = field(item, 'path', 'title') ?? '';
          const folder = field(item, 'type') === 'folder';
          const meta = field(item, 'meta');
          return h(
            'li',
            'item',
            folder ? { 'data-type': 'folder' } : null,
            h(
              'code',
              'path',
              null,
              folder && !path.endsWith('/') ? `${path}/` : path,
            ),
            meta ? [' ', h('span', 'meta', null, meta)] : undefined,
          );
        }),
      ),
    );
  },

  Gallery: ({ props }) => {
    const title = str(props['title']);
    const description = str(props['description']);
    return h(
      'div',
      'root',
      null,
      title || description
        ? h(
            'div',
            'header',
            null,
            title ? strongParagraph('title', title) : undefined,
            description ? h('p', 'description', null, description) : undefined,
          )
        : undefined,
      h(
        'div',
        'grid',
        null,
        items(props['items'], 'src').map((item) => {
          const img = image('image', field(item, 'src'), field(item, 'alt'));
          const href = field(item, 'href');
          const caption = field(item, 'caption', 'title');
          return h(
            'figure',
            'item',
            null,
            href && img ? h('a', 'imageLink', { href }, img) : img,
            caption ? h('figcaption', 'caption', null, caption) : undefined,
          );
        }),
      ),
    );
  },

  KeyTakeaway: ({ props, hasChildren }) => {
    const eyebrow = str(props['eyebrow']);
    const title = str(props['title']);
    const points = list(props['items']).flatMap((item) => {
      const text = str(item) ?? field(item, 'title', 'text', 'label');
      return text ? [text] : [];
    });
    return h(
      'aside',
      'root',
      null,
      eyebrow ? h('p', 'eyebrow', null, eyebrow) : undefined,
      title ? strongParagraph('title', title) : undefined,
      hasChildren ? h('div', 'body', null, slot) : undefined,
      points.length
        ? h(
            'ul',
            'list',
            null,
            points.map((point) => h('li', 'item', null, point)),
          )
        : undefined,
    );
  },

  LinkPreview: ({ props }) => {
    const metadata = record(json(props['metadata']));
    const href = str(props['href']) ?? field(metadata, 'url');
    const domain = domainOf(field(metadata, 'url') ?? href);
    const title = str(props['title']) ?? field(metadata, 'title');
    const label = title ?? domain ?? href ?? '';
    if (props['presentation'] === 'inline') {
      return h('span', 'root', null, link('anchor', href, null, label));
    }
    const description =
      str(props['description']) ?? field(metadata, 'description');
    const siteName = str(props['siteName']) ?? field(metadata, 'siteName');
    const firstImage = record(list(metadata?.['images'])[0]);
    const imageSrc = str(props['image']) ?? field(firstImage, 'url', 'src');
    const imageAlt = str(props['imageAlt']) ?? field(firstImage, 'alt');
    return h(
      'div',
      'root',
      null,
      props['images'] === 'none'
        ? undefined
        : image('image', imageSrc, imageAlt),
      h(
        'div',
        'content',
        null,
        h(
          'p',
          'title',
          null,
          h('strong', undefined, null, link('anchor', href, null, label)),
        ),
        description ? h('p', 'description', null, description) : undefined,
        siteName || domain
          ? h(
              'p',
              'siteRow',
              null,
              siteName ? h('span', 'siteName', null, siteName) : undefined,
              siteName && domain && siteName !== domain ? ' · ' : undefined,
              domain && siteName !== domain
                ? h('span', 'domain', null, domain)
                : undefined,
            )
          : undefined,
      ),
    );
  },

  NewsletterSignup: ({ props, hasChildren, options }) => {
    if (!options.newsletterUrl) return undefined;
    const title = str(props['title']);
    const description = str(props['description']);
    const privacy = str(props['privacy']);
    return h(
      'aside',
      'root',
      null,
      h(
        'div',
        'content',
        null,
        title ? strongParagraph('title', title) : undefined,
        description ? h('p', 'description', null, description) : undefined,
        hasChildren ? h('div', 'description', null, slot) : undefined,
      ),
      h(
        'p',
        'form',
        null,
        h(
          'a',
          'submit',
          { href: options.newsletterUrl },
          str(props['buttonLabel']) ?? 'Subscribe',
        ),
      ),
      privacy ? h('p', 'privacy', null, privacy) : undefined,
    );
  },

  Poll: ({ props }) => {
    const question = str(props['question']);
    const description = str(props['description']);
    const total = num(props['totalVotes']);
    return h(
      'div',
      'root',
      null,
      question ? strongParagraph('question', question) : undefined,
      description ? h('p', 'description', null, description) : undefined,
      h(
        'ul',
        'options',
        null,
        items(props['options'], 'label').map((option) => {
          const votes = num(option['votes']);
          const share =
            votes !== undefined && total
              ? Math.round((votes / total) * 100)
              : undefined;
          return h(
            'li',
            'option',
            null,
            h('span', 'optionLabel', null, field(option, 'label', 'id')),
            votes !== undefined
              ? [
                  ' ',
                  h(
                    'span',
                    'result',
                    null,
                    share !== undefined
                      ? `(${share}%, ${votes} ${votes === 1 ? 'vote' : 'votes'})`
                      : `(${votes} ${votes === 1 ? 'vote' : 'votes'})`,
                  ),
                ]
              : undefined,
          );
        }),
      ),
      total !== undefined
        ? h('p', 'status', null, `${total} ${total === 1 ? 'vote' : 'votes'}`)
        : undefined,
    );
  },

  ProductCard: ({ props }) => {
    const badge = str(props['badge']);
    const title = str(props['title']) ?? '';
    const description = str(props['description']);
    const rating = num(props['rating']);
    const price = str(props['price']);
    const stars =
      rating !== undefined
        ? Math.min(5, Math.max(0, Math.round(rating)))
        : undefined;
    return h(
      'article',
      'root',
      null,
      image('image', str(props['imageSrc']), str(props['imageAlt'])),
      h(
        'div',
        'content',
        null,
        badge ? h('p', 'badge', null, badge) : undefined,
        strongParagraph('title', title),
        description ? h('p', 'description', null, description) : undefined,
        stars !== undefined
          ? h(
              'p',
              'rating',
              null,
              `${'★'.repeat(stars)}${'☆'.repeat(5 - stars)} (${rating} out of 5)`,
            )
          : undefined,
        h(
          'p',
          'footer',
          null,
          price ? [h('span', 'price', null, price), ' '] : undefined,
          link(
            'action',
            str(props['href']),
            { rel: str(props['rel']) },
            str(props['actionLabel']) ?? title,
          ),
        ),
      ),
    );
  },

  PullQuote: ({ props }) => {
    const attribution = str(props['attribution']);
    const cite = str(props['cite']);
    return h(
      'figure',
      'root',
      null,
      h(
        'blockquote',
        'quote',
        null,
        h('p', undefined, null, str(props['quote'])),
      ),
      attribution || cite
        ? h(
            'figcaption',
            'attribution',
            null,
            '— ',
            attribution,
            attribution && cite ? ', ' : undefined,
            cite ? h('cite', 'cite', null, cite) : undefined,
          )
        : undefined,
    );
  },

  RelatedContent: ({ props }) => {
    const title = str(props['title']);
    return h(
      'aside',
      'root',
      null,
      title ? strongParagraph('title', title) : undefined,
      h(
        'ul',
        'list',
        null,
        items(props['items']).map((item) => {
          const description = field(item, 'description');
          const meta = field(item, 'meta');
          return h(
            'li',
            'item',
            null,
            link(
              'link',
              field(item, 'href'),
              null,
              h('span', 'itemTitle', null, field(item, 'title', 'href')),
            ),
            description
              ? [' — ', h('span', 'description', null, description)]
              : undefined,
            meta ? [' ', h('span', 'meta', null, `(${meta})`)] : undefined,
          );
        }),
      ),
    );
  },

  SeriesNavigation: ({ props }) => {
    const title = str(props['title']) ?? '';
    const current = str(props['current']);
    const total = str(props['total']);
    const links = (
      [
        ['Previous', 'prev', props['previous']],
        ['Next', 'next', props['next']],
      ] as const
    ).flatMap(([direction, rel, value]) => {
      const target = record(json(value));
      const href = field(target, 'href', 'url');
      return target
        ? [
            h(
              'li',
              undefined,
              null,
              link(
                'link',
                href,
                { rel },
                h('span', 'direction', null, `${direction}: `),
                h('span', 'linkTitle', null, field(target, 'title') ?? href),
              ),
            ),
          ]
        : [];
    });
    return h(
      'nav',
      'root',
      title ? { 'aria-label': `${title} series navigation` } : null,
      h(
        'div',
        'header',
        null,
        strongParagraph('title', title),
        current && total
          ? h('p', 'position', null, `${current} of ${total}`)
          : undefined,
      ),
      links.length ? h('ul', 'links', null, links) : undefined,
    );
  },

  ShareActions: ({ props }) => {
    const url = str(props['url']);
    const label = str(props['label']);
    return url
      ? h(
          'p',
          'root',
          null,
          label ? [h('span', 'label', null, label), ': '] : undefined,
          h('a', 'action', { href: url }, str(props['title']) ?? url),
        )
      : undefined;
  },

  SocialPost: ({ props }) => {
    const source = record(json(props['metadata']));
    // A snapshot envelope holds the resolver result under `metadata`.
    const preview = record(source?.['metadata']) ?? source;
    const social = record(preview?.['social']) ?? preview;
    const author = record(social?.['author']);
    const href =
      str(props['href']) ?? field(social, 'url') ?? field(preview, 'url');
    const name =
      str(props['authorName']) ??
      field(author, 'name') ??
      field(preview, 'author');
    const handle = str(props['authorHandle']) ?? field(author, 'handle');
    const text = str(props['text']) ?? field(social, 'text');
    const publishedAt =
      str(props['publishedAt']) ?? field(social, 'publishedAt');
    const service =
      str(props['service']) ?? field(social, 'service') ?? domainOf(href);
    return h(
      'figure',
      'root',
      null,
      text
        ? h(
            'blockquote',
            'content',
            null,
            text
              .split(/\n{2,}/)
              .map((paragraph) => h('p', undefined, null, paragraph)),
          )
        : undefined,
      h(
        'figcaption',
        'footer',
        null,
        name || handle
          ? [
              '— ',
              name ? h('span', 'authorName', null, name) : undefined,
              name && handle ? ' ' : undefined,
              handle
                ? h(
                    'span',
                    'handle',
                    null,
                    handle.startsWith('@') ? handle : `@${handle}`,
                  )
                : undefined,
            ]
          : undefined,
        publishedAt
          ? [
              name || handle ? ', ' : undefined,
              h('time', 'timestamp', { datetime: publishedAt }, publishedAt),
            ]
          : undefined,
        href
          ? [
              name || handle || publishedAt ? ' · ' : undefined,
              h(
                'a',
                'originalLink',
                { href },
                service ? `View on ${service}` : 'View the original post',
              ),
            ]
          : undefined,
      ),
    );
  },

  SponsorBlock: ({ props }) => {
    const disclosure = str(props['disclosure']);
    const name = str(props['name']) ?? '';
    const message = str(props['message']);
    const href = str(props['href']);
    return h(
      'aside',
      'root',
      disclosure && name ? { 'aria-label': `${disclosure} by ${name}` } : null,
      disclosure ? h('p', 'disclosure', null, disclosure) : undefined,
      image('logo', str(props['logoSrc']), str(props['logoAlt']) ?? name),
      h(
        'div',
        'content',
        null,
        strongParagraph('name', name),
        message ? h('p', 'message', null, message) : undefined,
        href
          ? h(
              'p',
              undefined,
              null,
              h(
                'a',
                'action',
                { href, rel: 'sponsored' },
                str(props['actionLabel']) ?? name,
              ),
            )
          : undefined,
      ),
    );
  },

  Stat: ({ props }) => {
    const trend = str(props['trend']);
    const description = str(props['description']);
    return h(
      'dl',
      'root',
      null,
      h('dt', 'label', null, str(props['label'])),
      h('dd', 'value', null, h('strong', undefined, null, str(props['value']))),
      trend ? h('dd', 'trend', null, trend) : undefined,
      description ? h('dd', 'description', null, description) : undefined,
    );
  },

  Steps: ({ props }) =>
    h(
      'ol',
      'root',
      null,
      items(props['items']).map((item) => {
        const description = field(item, 'description');
        return h(
          'li',
          'item',
          null,
          h(
            'div',
            'content',
            null,
            strongParagraph('title', field(item, 'title') ?? ''),
            description ? h('p', 'description', null, description) : undefined,
          ),
        );
      }),
    ),

  Tabs: ({ props }) => {
    const label = str(props['label']);
    return h(
      'div',
      'root',
      label ? { role: 'group', 'aria-label': label } : null,
      h(
        'div',
        'panels',
        null,
        items(props['items'], 'label').map((item) => {
          const content = field(item, 'content', 'description');
          return h(
            'section',
            'panel',
            null,
            strongParagraph('tab', field(item, 'label', 'title') ?? ''),
            content
              ? content
                  .split(/\n{2,}/)
                  .map((paragraph) => h('p', undefined, null, paragraph))
              : undefined,
          );
        }),
      ),
    );
  },

  Terminal: ({ props }) => {
    const title = str(props['title']);
    const prompt = str(props['prompt']);
    const output =
      typeof props['output'] === 'string' && props['output'] !== ''
        ? props['output']
        : undefined;
    return h(
      'figure',
      'root',
      null,
      title
        ? h('figcaption', 'header', null, h('span', 'title', null, title))
        : undefined,
      h(
        'pre',
        'body',
        null,
        h(
          'code',
          undefined,
          { class: 'language-shell' },
          prompt ? [h('span', 'prompt', null, prompt), ' '] : undefined,
          h(
            'span',
            'command',
            null,
            typeof props['command'] === 'string' ? props['command'] : '',
          ),
          output ? ['\n', h('samp', 'output', null, output)] : undefined,
        ),
      ),
    );
  },

  Video: ({ props }) => {
    const src = str(props['src']);
    const title = str(props['title']);
    const caption = str(props['caption']);
    return h(
      'figure',
      'root',
      null,
      src
        ? h(
            'video',
            'player',
            {
              src,
              poster: str(props['poster']),
              title,
              preload: str(props['preload']),
              controls: true,
            },
            mediaFallback(src, title),
          )
        : undefined,
      caption ? h('figcaption', 'caption', null, caption) : undefined,
    );
  },
};

/** `layoutMode` → `data-layout-mode`, as the headless views name state attributes. */
function stateAttributeName(propName: string): string {
  return `data-${propName.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`;
}

function withDefaults(
  definition: AnyPostkitComponentDefinition,
  props: PostkitComponentNode['props'],
): Props {
  const resolved: Record<string, PostkitJsonValue | undefined> = {
    ...props,
  };
  for (const [name, prop] of Object.entries(definition.props)) {
    if (resolved[name] === undefined && prop.default !== undefined) {
      resolved[name] = prop.default as PostkitJsonValue;
    }
  }
  return resolved;
}

function containsSlot(node: PostkitViewNode): boolean {
  return (
    node.type === 'slot' ||
    (node.type === 'element' && node.children.some(containsSlot))
  );
}

/** @internal Whether a built-in component has a static view. */
export function hasPostkitStaticView(name: string): boolean {
  return Object.hasOwn(views, name);
}

/**
 * @internal Renders a built-in component's static view from its definition
 * and props. Returns `undefined` for components without one (custom
 * components), which serializers carry as before.
 */
export function renderPostkitStaticView(
  node: PostkitComponentNode,
  options: PostkitStaticViewOptions = {},
): PostkitStaticViewResult | undefined {
  if (!hasPostkitStaticView(node.name)) return undefined;
  const name = node.name as PostkitBuiltInComponentName;
  const definition: AnyPostkitComponentDefinition =
    postkitBuiltInDefinitions[name];
  const props = withDefaults(definition, node.props);
  const hasChildren = node.children.length > 0;
  let root = views[name]({ props, hasChildren, options });
  if (!root) return { kind: 'omitted' };
  // Authored children a view has no place for (a component whose definition
  // takes none) still follow its markup, so nothing authored is lost. Only an
  // AudienceBoundary withholds its children, on purpose.
  if (hasChildren && name !== 'AudienceBoundary' && !containsSlot(root)) {
    root = {
      ...root,
      children: [
        ...root.children,
        h(
          ['p', 'span'].includes(root.name) ? 'span' : 'div',
          undefined,
          null,
          slot,
        ),
      ],
    };
  }
  // Theme-variant state goes on the root, as in every renderer.
  const state: Record<string, PostkitViewAttributeValue> = {};
  for (const variant of definition.themeVariants) {
    const value = props[variant];
    if (typeof value === 'string' || typeof value === 'boolean') {
      state[stateAttributeName(variant)] = String(value);
    }
  }
  return {
    kind: 'view',
    root: { ...root, attributes: { ...state, ...root.attributes } },
  };
}

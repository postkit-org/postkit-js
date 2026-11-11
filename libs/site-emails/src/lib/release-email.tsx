import {
  Button,
  Code,
  Column,
  Heading,
  Pre,
  Row,
  Section,
  Text,
} from '@chakra-email/core';
import {
  createPostkitDocument,
  type PostkitDocument,
  type PostkitElementNode,
  type PostkitNode,
} from '@postkit/core';
import {
  parseEmailSource,
  renderEmail,
  type PostkitEmailView,
  type RenderEmailWarning,
} from '@postkit/email';
import { Fragment, type ReactNode } from 'react';

import {
  EMAIL_FROM,
  FOOTER_SIGNATURE,
  normalizeSiteUrl,
  newsletterUrls,
} from './constants';
import type { RenderedEmail } from './emails';
import { EmailLayout, type FooterLink } from './layout';

/** The changelog fields the release email reads (`@postkit/content`'s `changelogEntrySchema`). */
export interface ReleaseEmailEntry {
  readonly version: string;
  /** The grey half of the title: "Portable documents, host-native Chakra and email." */
  readonly subtitle: string;
  /** The preheader and the lede. */
  readonly summary: string;
  /** `YYYY-MM-DD`. */
  readonly date: string;
  /** The entry's Markdown body. */
  readonly content: string;
}

export interface ReleaseEmailOptions {
  /** The origin for links; `NEXT_PUBLIC_SITE_URL`, else `https://postkit.org`. */
  readonly siteUrl?: string;
  /** The footer's Unsubscribe link. Defaults to {@link releaseUnsubscribeUrl}. */
  readonly unsubscribeUrl?: string;
}

/** A rendered release email, plus anything `renderEmail` had to change. */
export interface RenderedReleaseEmail extends RenderedEmail {
  /** `/changelog/{slug}`: "Read the full release notes" and "Read on the web". */
  readonly webUrl: string;
  /** `renderEmail`'s warnings. A release email should have none. */
  readonly warnings: readonly RenderEmailWarning[];
}

/** "Added" shows this many items (04 §3); the rest are on the web. */
export const RELEASE_ADDED_LIMIT = 4;

export const RELEASE_FOOTER_REASON =
  'You’re getting this because you subscribed to Postkit release emails at postkit.org. One email per release.';

/**
 * The 04 §4 fallback for the footer's Unsubscribe link: Resend's hosted page, if Broadcasts
 * don't render the custom `unsubscribe_token` contact property (PK-050 confirms which).
 */
export const RESEND_UNSUBSCRIBE_URL = '{{{RESEND_UNSUBSCRIBE_URL}}}';

/**
 * The release email's Unsubscribe link (04 §4): the site's own unsubscribe page, with the
 * contact's sealed token, which Resend fills in per recipient from the `unsubscribe_token`
 * property `confirm` stores. If Broadcasts turn out not to render custom properties, pass
 * {@link RESEND_UNSUBSCRIBE_URL} as `unsubscribeUrl` instead; either way the contact ends up
 * `unsubscribed: true`.
 */
export function releaseUnsubscribeUrl(siteUrl?: string): string {
  return `${normalizeSiteUrl(siteUrl)}/newsletter/unsubscribe?token={{{contact.unsubscribe_token}}}`;
}

/** The URL slug for a release: `0.2.0` → `0-2-0`, as `changelogVersionSlug` makes it. */
function versionSlug(version: string): string {
  return version.replace(/\./g, '-').toLowerCase();
}

/** `2026-09-03` → `September 3, 2026`. */
export function formatReleaseDate(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString('en-US', {
    timeZone: 'UTC',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/** "Postkit 0.2.0: Portable documents, host-native Chakra and email" (04 §3). */
export function releaseSubject(entry: ReleaseEmailEntry): string {
  return `Postkit ${entry.version}: ${entry.subtitle.replace(/\.$/, '')}`;
}

// --- Picking the parts of the entry (04 §3) ----------------------------------------------

function textOf(nodes: readonly PostkitNode[]): string {
  return nodes
    .map((node) =>
      node.type === 'text'
        ? node.value
        : 'children' in node
          ? textOf(node.children)
          : '',
    )
    .join('');
}

function isElement(
  node: PostkitNode | undefined,
  ...names: readonly string[]
): node is PostkitElementNode {
  return node?.type === 'element' && names.includes(node.name);
}

function heading(text: string): PostkitElementNode {
  return {
    type: 'element',
    name: 'h2',
    children: [{ type: 'text', value: text }],
  };
}

/** The nodes under the first `##` heading matching `title`, up to the next heading. */
function section(
  nodes: readonly PostkitNode[],
  title: RegExp,
): readonly PostkitNode[] {
  const start = nodes.findIndex(
    (node) =>
      isElement(node, 'h2', 'h3') && title.test(textOf(node.children).trim()),
  );
  if (start < 0) return [];
  const rest = nodes.slice(start + 1);
  const end = rest.findIndex((node) => isElement(node, 'h1', 'h2'));
  return end < 0 ? rest : rest.slice(0, end);
}

function findFirst(
  nodes: readonly PostkitNode[],
  test: (node: PostkitNode) => boolean,
): PostkitNode | undefined {
  for (const node of nodes) {
    if (test(node)) return node;
    if ('children' in node) {
      const found = findFirst(node.children, test);
      if (found) return found;
    }
  }
  return undefined;
}

/**
 * The release email's body (04 §3, EmailRelease): the first warning callout, if any; "Added"
 * (its first four items); "Upgrading" with the first code block and the sentence that
 * introduces it. Everything else is one click away on the web.
 */
export function releaseEmailBody(document: PostkitDocument): PostkitDocument {
  const nodes = document.children;
  const body: PostkitNode[] = [];

  const warning = findFirst(
    nodes,
    (node) =>
      node.type === 'component' &&
      (node.name === 'Callout' || node.name === 'Aside') &&
      node.props?.['tone'] === 'warning',
  );
  if (warning) body.push(warning);

  const addedList = section(nodes, /^added$/i).find((node) =>
    isElement(node, 'ul', 'ol'),
  );
  if (isElement(addedList, 'ul', 'ol')) {
    body.push(heading('Added'), {
      ...addedList,
      children: addedList.children
        .filter((node) => isElement(node, 'li'))
        .slice(0, RELEASE_ADDED_LIMIT),
    });
  }

  const upgrading = section(nodes, /^(upgrad|migrat)/i);
  const scope = upgrading.some((node) => isElement(node, 'pre'))
    ? upgrading
    : nodes;
  const codeIndex = scope.findIndex((node) => isElement(node, 'pre'));
  if (codeIndex >= 0) {
    const lead = isElement(scope[codeIndex - 1], 'p')
      ? scope[codeIndex - 1]
      : undefined;
    body.push(heading('Upgrading'), ...(lead ? [lead] : []), scope[codeIndex]);
  }

  return createPostkitDocument(body);
}

/**
 * The packages a release names, in order: every `@postkit/…` in its code spans, without
 * subpaths (`@postkit/react/document` → `@postkit/react`) or wildcards (`@postkit/*`).
 */
export function releasePackages(document: PostkitDocument): string[] {
  const names = new Set<string>();
  const visit = (nodes: readonly PostkitNode[]) => {
    for (const node of nodes) {
      if (!('children' in node)) continue;
      if (isElement(node, 'code')) {
        const match = /^@postkit\/([a-z0-9][a-z0-9-]*)/.exec(
          textOf(node.children).trim(),
        );
        if (match) names.add(`@postkit/${match[1]}`);
        continue;
      }
      visit(node.children);
    }
  };
  visit(document.children);
  return [...names];
}

// --- Rendering ---------------------------------------------------------------------------

/** The board's prose: medium headings, grey body, bullet rows, a quiet code panel. */
const releaseProse: Readonly<Record<string, PostkitEmailView>> = {
  h2: ({ children }: { readonly children?: ReactNode }) => (
    <Heading
      as="h2"
      m="0"
      mt="36px"
      fontSize="21px"
      fontWeight="medium"
      lineHeight="1.25"
      letterSpacing="-0.01em"
      color="fg"
    >
      {children}
    </Heading>
  ),
  p: ({ children }: { readonly children?: ReactNode }) => (
    <Text m="0" mt="16px" fontSize="16px" lineHeight="1.6" color="fg.secondary">
      {children}
    </Text>
  ),
  ul: ({ children }: { readonly children?: ReactNode }) => (
    <table
      role="presentation"
      width="100%"
      cellPadding={0}
      cellSpacing={0}
      border={0}
      style={{ width: '100%', marginTop: 4, borderCollapse: 'collapse' }}
    >
      <tbody>{children}</tbody>
    </table>
  ),
  li: ({ children }: { readonly children?: ReactNode }) => (
    <Row>
      <Column width="18px" pt="10px" color="border.strong">
        •
      </Column>
      <Column pt="8px" fontSize="15.5px" lineHeight="1.55" color="fg.secondary">
        {children}
      </Column>
    </Row>
  ),
  code: ({ children }: { readonly children?: ReactNode }) => (
    <Code bg="transparent" color="inherit" px={0} fontSize="0.93em">
      {children}
    </Code>
  ),
  pre: ({ children }: { readonly children?: ReactNode }) => (
    <Pre
      m="0"
      mt="16px"
      px="18px"
      py="16px"
      rounded="12px"
      bg="bg.subtle"
      color="fg"
      fontSize="13.5px"
      lineHeight="1.65"
    >
      {children}
    </Pre>
  ),
};

function PackageList({ names }: { readonly names: readonly string[] }) {
  if (names.length === 0) return null;
  return (
    <Text m="0" mt="24px" fontSize="14px" lineHeight="1.6" color="fg.muted">
      Packages:{' '}
      {names.map((name, index) => (
        <Fragment key={name}>
          {index > 0 ? ' · ' : null}
          <Code bg="transparent" color="inherit" px={0} fontSize="13px">
            {name}
          </Code>
        </Fragment>
      ))}
    </Text>
  );
}

/** The plain-text footer, matching the HTML one. */
function textFooter(links: readonly FooterLink[]): string {
  return [
    '--',
    RELEASE_FOOTER_REASON,
    ...links.map((link) => `${link.label}: ${link.href}`),
    FOOTER_SIGNATURE,
  ].join('\n');
}

/**
 * The release email (EmailRelease board, 04 §3), built from a changelog entry so it's never
 * written twice. The body goes through `@postkit/email`'s `renderEmail` (03 §6.1) with the
 * site's layout as its wrapper; its plain-text part is `renderEmail`'s `text` with the same
 * header and footer.
 */
export async function renderReleaseEmail(
  entry: ReleaseEmailEntry,
  options: ReleaseEmailOptions = {},
): Promise<RenderedReleaseEmail> {
  const origin = normalizeSiteUrl(options.siteUrl);
  const urls = newsletterUrls(origin);
  const webUrl = `${origin}/changelog/${versionSlug(entry.version)}`;
  const subject = releaseSubject(entry);
  const date = formatReleaseDate(entry.date);
  const footerLinks: FooterLink[] = [
    {
      label: 'Unsubscribe',
      href: options.unsubscribeUrl ?? releaseUnsubscribeUrl(origin),
    },
    { label: 'Read on the web', href: webUrl },
    { label: 'Privacy', href: urls.privacy },
  ];

  const parsed = parseEmailSource(entry.content, { format: 'markdown' });
  const packages = releasePackages(parsed.document);

  function ReleaseLayout({ children }: { readonly children?: ReactNode }) {
    return (
      <EmailLayout
        title={subject}
        preheader={entry.summary}
        homeUrl={urls.home}
        footerLinks={footerLinks}
        footerReason={RELEASE_FOOTER_REASON}
      >
        <Text m="0" fontFamily="mono" fontSize="13px" color="fg.muted">
          Release · {date}
        </Text>
        <Heading
          as="h1"
          m="0"
          mt="10px"
          fontSize="34px"
          fontWeight="medium"
          lineHeight="1.1"
          letterSpacing="heading"
          color="fg"
        >
          Postkit {entry.version}.{' '}
          <Text
            as="span"
            m="0"
            fontSize="34px"
            lineHeight="1.1"
            color="fg.quiet"
          >
            {entry.subtitle}
          </Text>
        </Heading>
        <Text
          m="0"
          mt="16px"
          fontSize="16px"
          lineHeight="1.6"
          color="fg.secondary"
        >
          {entry.summary}
        </Text>
        {children}
        {/* Chakra Email's Button is an `align="left"` table, which floats: the section's cell
            contains it, so the package list starts on its own line. */}
        <Section mt="32px">
          <Button
            href={webUrl}
            px="24px"
            py="14px"
            bg="bg.inverted"
            color="fg.inverted"
            rounded="full"
            fontSize="15px"
            fontWeight="medium"
            lineHeight="1.2"
          >
            Read the full release notes
          </Button>
        </Section>
        <PackageList names={packages} />
      </EmailLayout>
    );
  }

  const rendered = await renderEmail(releaseEmailBody(parsed.document), {
    format: 'document',
    baseUrl: origin,
    url: webUrl,
    components: releaseProse,
    wrapper: ReleaseLayout,
  });

  const text = [
    `Release · ${date}`,
    `Postkit ${entry.version}. ${entry.subtitle}`,
    '',
    entry.summary,
    '',
    rendered.text.trim(),
    '',
    `Read the full release notes: ${webUrl}`,
    ...(packages.length ? ['', `Packages: ${packages.join(' · ')}`] : []),
    '',
    textFooter(footerLinks),
    '',
  ].join('\n');

  return {
    from: EMAIL_FROM,
    subject,
    preheader: entry.summary,
    html: rendered.html,
    text,
    headers: {},
    webUrl,
    warnings: [...parsed.warnings, ...rendered.warnings],
  };
}

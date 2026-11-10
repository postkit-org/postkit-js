import { chakra } from '@chakra-ui/react';
import type { GetStaticProps, InferGetStaticPropsType } from 'next';

import {
  BreadcrumbJsonLd,
  PageContainer,
  PageMeta,
} from '../components/layout';
import { readSiteJson } from '../components/legal/build-time.server';
import { TextLink } from '../components/legal/text-link';
import { OssMark } from '../components/oss-mark';
import { externalLinks } from '../lib/site-sections';

interface OssItem {
  readonly name: string;
  readonly tag: string | null;
  readonly description: string;
  readonly url: string;
}

interface OssSection {
  readonly title: string;
  readonly description: string;
  readonly items: readonly OssItem[];
}

interface MadeWithOssProps {
  readonly sections: readonly OssSection[];
}

/** The list lives in `src/content/oss.json` (01 §6.8), read at build time. */
export const getStaticProps: GetStaticProps<MadeWithOssProps> = async () => ({
  props: { sections: readSiteJson<OssSection[]>('src/content/oss.json') },
});

/** `https://www.typescriptlang.org/` → `typescriptlang.org`. */
const displayUrl = (url: string) =>
  url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');

/** Package names in a description (the adapters list) are set in mono. */
const isPackageName = (text: string) => /^@postkit\/[\w-]+$/.test(text);

/**
 * Three columns (name, description, link); below 1100px the link moves under the
 * description, and on phones everything stacks (02 §4; SiteWithOSS's local media queries).
 */
const rowCss = {
  display: 'grid',
  gridTemplateColumns: '13rem minmax(0, 1fr) 22rem',
  gap: '4px 24px',
  alignItems: 'baseline',
  paddingBlock: '16px',
  borderBottomWidth: '1px',
  borderColor: 'border',
  fontSize: '16px',
  lineHeight: '1.5',
  '@media (max-width: 1100px)': {
    gridTemplateColumns: '12rem minmax(0, 1fr)',
    '& > :nth-child(3)': { gridColumn: '2' },
  },
  '@media (max-width: 760px)': {
    gridTemplateColumns: 'minmax(0, 1fr)',
    paddingBlock: '18px',
    '& > :nth-child(3)': { gridColumn: 'auto' },
  },
} as const;

function OssRow({ item }: { item: OssItem }) {
  return (
    <chakra.li css={rowCss}>
      <chakra.span fontWeight="medium">
        {item.name}
        {item.tag ? (
          <chakra.span
            marginInlineStart="8px"
            paddingBlock="2px"
            paddingInline="8px"
            borderRadius="full"
            bg="bg.subtle"
            fontSize="xs"
            fontWeight="regular"
            color="fg.muted"
            verticalAlign="2px"
            whiteSpace="nowrap"
          >
            {item.tag}
          </chakra.span>
        ) : null}
      </chakra.span>
      <chakra.span
        color="fg.secondary"
        fontFamily={isPackageName(item.description) ? 'mono' : undefined}
        fontSize={isPackageName(item.description) ? 'sm' : undefined}
      >
        {item.description}
      </chakra.span>
      <chakra.a
        href={item.url}
        justifySelf="start"
        fontFamily="mono"
        fontSize="sm"
        color="accent"
        textDecoration="none"
        overflowWrap="anywhere"
        textUnderlineOffset="3px"
        css={{ '@media (hover: hover)': { _hover: { textDecoration: 'underline' } } }}
      >
        {displayUrl(item.url)}
      </chakra.a>
    </chakra.li>
  );
}

export default function MadeWithOssPage({
  sections,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  return (
    <>
      <PageMeta
        title="Made with OSS"
        description="Postkit is open source, and so is almost everything it stands on. Thank you to the maintainers and contributors behind the library and this site."
      />
      <BreadcrumbJsonLd items={[{ name: 'Made with OSS', path: '/withoss' }]} />

      <PageContainer
        paddingTop={{ base: '64px', md: '112px' }}
        paddingBottom="section"
      >
        <chakra.div
          display="flex"
          flexDirection={{ base: 'column', md: 'row' }}
          alignItems={{ base: 'flex-start', md: 'flex-end' }}
          justifyContent="space-between"
          flexWrap="wrap"
          gap="32px 80px"
        >
          <chakra.h1
            aria-label="Made with open-source software"
            margin="0"
            display="flex"
            alignItems="center"
            gap="0.12em"
            fontWeight="medium"
            fontSize={{ base: '72px', md: '128px' }}
            lineHeight="1"
            letterSpacing="-0.04em"
            color="fg"
          >
            <span aria-hidden="true">w/</span>
            <chakra.span
              aria-hidden="true"
              display="inline-block"
              height="0.74em"
              flex="none"
              css={{ aspectRatio: '579 / 285' }}
            >
              <OssMark />
            </chakra.span>
          </chakra.h1>
          <chakra.p
            margin="0"
            flex={{ base: 'none', md: '1 1 26rem' }}
            maxW="30rem"
            fontSize={{ base: '21px', md: 'xl' }}
            lineHeight="1.4"
            letterSpacing="tight"
            color="fg"
          >
            Postkit is open source, and so is almost everything it stands
            on.{' '}
            <chakra.span color="fg.quiet">
              Thank you to the maintainers and contributors behind the library
              and this site.
            </chakra.span>
          </chakra.p>
        </chakra.div>

        <chakra.div
          marginTop={{ base: '72px', md: '112px' }}
          display="flex"
          flexDirection="column"
          gap={{ base: '64px', md: '88px' }}
        >
          {sections.map((section, index) => (
            <chakra.section
              key={section.title}
              aria-labelledby={`oss-${index}`}
            >
              <chakra.h2
                id={`oss-${index}`}
                margin="0"
                paddingBottom="14px"
                borderBottomWidth="2px"
                borderColor="border.strong"
                fontWeight="medium"
                fontSize="26px"
                letterSpacing="heading"
              >
                {section.title}
              </chakra.h2>
              <chakra.p margin="0" marginTop="14px" fontSize="md" color="fg.muted">
                {section.description}
              </chakra.p>
              <chakra.ul margin="0" marginTop="8px" padding="0" listStyleType="none">
                {section.items.map((item) => (
                  <OssRow key={item.name} item={item} />
                ))}
              </chakra.ul>
            </chakra.section>
          ))}
        </chakra.div>

        <chakra.p margin="0" marginTop="72px" fontSize="body" color="fg.secondary">
          Missing a project?{' '}
          <TextLink href={`${externalLinks.github}/issues/new`}>
            Open an issue on GitHub
          </TextLink>{' '}
          and we’ll add it.
        </chakra.p>
      </PageContainer>
    </>
  );
}

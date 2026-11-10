import { chakra } from '@chakra-ui/react';
import type { GetStaticProps, InferGetStaticPropsType } from 'next';

import { BreadcrumbJsonLd, PageMeta } from '../components/layout';
import {
  CheckList,
  LegalPage,
  LegalSection,
  LegalText,
} from '../components/legal/legal-page';
import {
  formatLegalDate,
  lastUpdated,
  readLicense,
} from '../components/legal/build-time.server';
import { TextLink } from '../components/legal/text-link';

interface LicensingPageProps {
  readonly license: string;
  readonly updated: { readonly iso: string; readonly label: string };
}

export const getStaticProps: GetStaticProps<LicensingPageProps> = async () => {
  // The licence text is the repo's LICENSE, so the page can't drift from it (09 "Facts").
  const license = readLicense();
  if (!license.includes('Copyright (c) 2026 Postkit')) {
    throw new Error(
      'LICENSE no longer says "Copyright (c) 2026 Postkit"; update the Licensing page copy.',
    );
  }
  const iso = lastUpdated(['apps/site/src/pages/licensing.tsx', 'LICENSE']);
  return {
    props: { license, updated: { iso, label: formatLegalDate(iso) } },
  };
};

/** The board's "Built on" table: the direct dependencies a Postkit user ships. */
const builtOn = [
  { project: 'Chakra UI', licence: 'MIT', usedFor: 'The Chakra views' },
  { project: 'Zag', licence: 'MIT', usedFor: 'Behaviour for interactive components' },
  { project: 'unified · remark', licence: 'MIT', usedFor: 'Markdown and MDX parsing' },
  { project: 'Shiki', licence: 'MIT', usedFor: 'Code highlighting' },
] as const;

const cell = {
  textAlign: 'left',
  paddingBlock: '12px',
  paddingInlineEnd: '16px',
  verticalAlign: 'top',
  fontSize: 'md',
} as const;

export default function LicensingPage({
  license,
  updated,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  return (
    <>
      <PageMeta
        title="Licensing"
        description="Every Postkit package is open source under the MIT licence. Use it on client sites, in commercial products and in your own tools, with no fee and no account."
      />
      <BreadcrumbJsonLd items={[{ name: 'Licensing', path: '/licensing' }]} />

      <LegalPage
        path="/licensing"
        title="Licensing."
        quiet="MIT. Use it anywhere, ship it in anything."
        lede="Every Postkit package is open source under the MIT licence. Use it on client sites, in commercial products and in your own tools, with no fee and no account."
        updated={updated}
      >
        <LegalSection title="What you can do">
          <CheckList
            items={[
              'Use Postkit on any site, commercial or not.',
              'Modify it, eject it and ship your changes.',
              'Bundle it into products you sell.',
              'Fork it under your own name.',
            ]}
          />
        </LegalSection>

        <LegalSection title="What we ask">
          <LegalText>
            Keep the copyright notice and licence with the source, which your
            package manager already does. That’s all.
          </LegalText>
        </LegalSection>

        <LegalSection title="Built on">
          <chakra.div marginTop="20px" overflowX="auto">
            <chakra.table
              width="100%"
              minWidth="480px"
              borderCollapse="collapse"
              borderBottomWidth="1px"
              borderColor="border"
            >
              <thead>
                <tr>
                  {['Project', 'Licence', 'Used for'].map((heading) => (
                    <chakra.th
                      key={heading}
                      scope="col"
                      textAlign="left"
                      paddingInlineEnd="16px"
                      paddingBottom="10px"
                      fontWeight="regular"
                      fontSize="sm"
                      color="fg.muted"
                    >
                      {heading}
                    </chakra.th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {builtOn.map((row) => (
                  <chakra.tr
                    key={row.project}
                    borderTopWidth="1px"
                    borderColor="border"
                  >
                    <chakra.th scope="row" {...cell} fontWeight="regular" color="fg">
                      {row.project}
                    </chakra.th>
                    <chakra.td {...cell} color="fg.secondary">
                      {row.licence}
                    </chakra.td>
                    <chakra.td {...cell} color="fg.secondary">
                      {row.usedFor}
                    </chakra.td>
                  </chakra.tr>
                ))}
              </tbody>
            </chakra.table>
          </chakra.div>
          <chakra.p margin="0" marginTop="16px" fontSize="md" color="fg.muted">
            The full list, with thanks, is on{' '}
            <TextLink href="/withoss">Made with OSS</TextLink>.
          </chakra.p>
        </LegalSection>

        <LegalSection title="The licence">
          <chakra.pre
            margin="0"
            marginTop="16px"
            padding="20px"
            borderRadius="xl"
            bg="bg.subtle"
            color="fg"
            fontFamily="mono"
            fontSize="12.5px"
            lineHeight="1.7"
            whiteSpace="pre-wrap"
            overflowWrap="anywhere"
          >
            {license}
          </chakra.pre>
        </LegalSection>
      </LegalPage>
    </>
  );
}

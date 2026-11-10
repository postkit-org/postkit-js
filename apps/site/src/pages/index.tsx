import type { PostkitDocument } from '@postkit/chakra/document';
import type { GetStaticProps, InferGetStaticPropsType } from 'next';

import {
  CustomizeSection,
  Hero,
  HeroArticle,
  InstallCta,
  installCommand,
  KitSections,
  RendererPanel,
  SourceCodeJsonLd,
  StatsSection,
  WritersSection,
} from '../components/home';
import {
  getHomeStats,
  parseAuthoringExample,
  renderEmailArticle,
  type HomeStats,
} from '../components/home/home-data.server';
import { PageMeta, WebSiteJsonLd } from '../components/layout';

interface HomePageProps {
  readonly stats: HomeStats;
  readonly emailHtml: string;
  readonly authoringDocument: PostkitDocument;
}

export const getStaticProps: GetStaticProps<HomePageProps> = async () => ({
  props: {
    stats: getHomeStats(),
    emailHtml: await renderEmailArticle(),
    authoringDocument: parseAuthoringExample(),
  },
});

export default function IndexPage({
  stats,
  emailHtml,
  authoringDocument,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  return (
    <>
      {/* No title: the home page's is just "Postkit" (01 §12). */}
      <PageMeta description="Give your writing callouts, code, figures and more without building any of them. Each post looks right on your site, in your newsletter and in your editor, from one plain-text file." />
      <WebSiteJsonLd />
      <SourceCodeJsonLd licence={stats.licence} />

      <Hero release={stats.release} componentCount={stats.components} />
      <HeroArticle />
      <WritersSection document={authoringDocument} />
      <KitSections />
      <RendererPanel emailHtml={emailHtml} />
      <CustomizeSection />
      <StatsSection
        components={stats.components}
        kits={stats.kits}
        renderers={stats.renderers}
        licence={stats.licence}
      />
      <InstallCta
        command={installCommand}
        onCopy={() => {
          // PK-004: trackGoal('copy-install')
        }}
      />
    </>
  );
}

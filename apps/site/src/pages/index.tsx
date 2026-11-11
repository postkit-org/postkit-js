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
import {
  renderEditorArticle,
  renderHeadlessArticle,
} from '../components/home/renderer-frames.server';
import type { RendererDocuments } from '../components/home/renderer-panel';
import { PageMeta, WebSiteJsonLd } from '../components/layout';
import { trackGoal } from '../lib/analytics';
import { assertSearchReady } from '../lib/search-records';
import { homeShareImage, shareImageMeta } from '../lib/share-images';

interface HomePageProps {
  readonly stats: HomeStats;
  /** The renderer panel's framed documents (Headless, Email, Editor), built here. */
  readonly rendererDocuments: RendererDocuments;
  readonly authoringDocument: PostkitDocument;
}

export const getStaticProps: GetStaticProps<HomePageProps> = async () => {
  // Search's build-time check (PK-040): fails `next build` if search-featured.json names
  // a page that isn't published.
  assertSearchReady();

  return {
    props: {
      stats: getHomeStats(),
      rendererDocuments: {
        headless: renderHeadlessArticle(),
        email: await renderEmailArticle(),
        editor: renderEditorArticle(),
      },
      authoringDocument: parseAuthoringExample(),
    },
  };
};

export default function IndexPage({
  stats,
  rendererDocuments,
  authoringDocument,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  return (
    <>
      {/* No title: the home page's is just "Postkit" (01 §12). */}
      <PageMeta
        description="Give your writing callouts, code, figures and more without building any of them. Each post looks right on your site, in your newsletter and in your editor, from one plain-text file."
        image={shareImageMeta(homeShareImage())}
      />
      <WebSiteJsonLd />
      <SourceCodeJsonLd licence={stats.licence} />

      <Hero release={stats.release} componentCount={stats.components} />
      <HeroArticle />
      <WritersSection document={authoringDocument} />
      <KitSections />
      <RendererPanel documents={rendererDocuments} />
      <CustomizeSection />
      <StatsSection
        components={stats.components}
        kits={stats.kits}
        renderers={stats.renderers}
        licence={stats.licence}
      />
      <InstallCta
        command={installCommand}
        onCopy={() => trackGoal('copy-install')}
      />
    </>
  );
}

// Shared page building blocks (Phase 3). Pages compose these; they own no routes or data.
export {
  MdxContent,
  siteMdxComponents,
  type MdxContentProps,
} from './mdx-content';
export {
  PageContainer,
  type PageContainerProps,
  type PageContainerWidth,
} from './page-container';
export {
  PageMeta,
  siteMetaDefaults,
  type PageMetaImage,
  type PageMetaProps,
} from './page-meta';
export { ResultPage, type ResultPageProps } from './result-page';
export {
  BreadcrumbJsonLd,
  WebSiteJsonLd,
  type BreadcrumbJsonLdProps,
} from './structured-data';
export { Toc, type TocProps } from './toc';
export {
  TwoToneHeading,
  type TwoToneHeadingProps,
  type TwoToneHeadingTextStyle,
} from './two-tone-heading';

// The helpers these take their data from, re-exported for convenience.
export {
  extractHeadings,
  slugifyHeading,
  type ExtractHeadingsOptions,
  type TocHeading,
} from '../../lib/headings';
export {
  breadcrumbList,
  webSiteData,
  type Breadcrumb,
} from '../../lib/structured-data';
export { absoluteUrl, SITE_NAME, SITE_URL } from '../../lib/site-url';

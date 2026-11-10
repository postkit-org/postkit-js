// Home (PK-030). Sections in SiteHome's order; build-time data lives in
// `home-data.server.tsx`, which only `getStaticProps` imports.
export { CustomizeSection, StatsSection } from './closing-sections';
export { Hero, HeroArticle } from './hero';
export {
  authoringSources,
  installCommand,
  rendererArticle,
  rendererTabs,
} from './home-content';
export { CopyCommand, InstallCta, COPY_REVERT_MS } from './install-cta';
export { KitSections } from './kit-sections';
export { RendererPanel } from './renderer-panel';
export { SourceCodeJsonLd } from './source-code-json-ld';
export { WritersSection } from './writers-section';

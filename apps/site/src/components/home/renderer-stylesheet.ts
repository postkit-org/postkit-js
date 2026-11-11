/**
 * Where the site serves its copy of `@postkit/react/styles.css`, for the renderer panel's
 * Editor frame. `nx run site:renderer-styles` (`scripts/build-renderer-styles.mts`) copies
 * the package's file here before every build and dev server; the copy is generated and
 * git-ignored.
 */
export const rendererStylesheetHref = '/renderers/postkit-react.css';

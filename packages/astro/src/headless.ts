// The headless bridges are generated from the component definitions
// (`npm run components:generate`), so this entry re-exports all of them.
// `postkitAstro({ renderer: 'headless' })` renders the Astro components
// with these views.
export * from './lib/headless-bridges.js';

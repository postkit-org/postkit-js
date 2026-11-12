import type * as postkitReact from '@postkit/react';
import type * as postkitKits from '@postkit/react/kits';

/*
 * Code samples the site shows, written from names the compiler checks against the packages'
 * real exports, so a renamed export fails the site's build rather than a reader's.
 */

/** The export names in `@postkit/react/kits` that are kits. */
type KitExport = {
  [
    Name in keyof typeof postkitKits
  ]: (typeof postkitKits)[Name] extends postkitKits.PostkitKit ? Name : never;
}[keyof typeof postkitKits];

/** The kits the sample enables (SiteHome's "Docs developers trust."). */
const sampleKits = [
  'article',
  'technical',
] as const satisfies readonly KitExport[];

/** `@postkit/react`'s `createPostkit` (03 §3.3). */
const createPostkitName: keyof Pick<typeof postkitReact, 'createPostkit'> =
  'createPostkit';

/**
 * `lib/postkit.ts`: a site on the headless views with two kits. Home's CodeGroup and the
 * CodeBlock preview show it.
 */
export const createPostkitSample = `import { ${createPostkitName} } from '@postkit/react'
import { ${sampleKits.join(', ')} } from '@postkit/react/kits'

export const postkit = ${createPostkitName}({
  kits: [${sampleKits.join(', ')}],
})`;

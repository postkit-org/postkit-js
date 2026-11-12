import { Schema } from 'react-structured';

import { externalLinks } from '../../lib/site-sections';
import { SITE_NAME, SITE_URL } from '../../lib/site-url';

/** Home's `SoftwareSourceCode` JSON-LD for the repository (01 §7). */
export function SourceCodeJsonLd({ licence }: { readonly licence: string }) {
  return (
    <Schema
      id="source-code-jsonld"
      type="SoftwareSourceCode"
      data={{
        name: SITE_NAME,
        url: `${SITE_URL}/`,
        codeRepository: externalLinks.github,
        programmingLanguage: 'TypeScript',
        license: licence,
      }}
    />
  );
}

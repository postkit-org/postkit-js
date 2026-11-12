import {
  createPostkitShikiAdapter,
  postkitShikiLanguages,
} from '@postkit/shiki';

/**
 * Postkit's default grammars, plus the ones the site's own content uses: `css` (Part styles),
 * `html` (Headless) and `yaml` (Footnotes frontmatter). A fence in a language that isn't
 * loaded renders as plain text (with a warning in development), so add its grammar here.
 */
export const siteCodeBlockAdapter = createPostkitShikiAdapter({
  languages: [...postkitShikiLanguages, 'css', 'html', 'yaml'],
});

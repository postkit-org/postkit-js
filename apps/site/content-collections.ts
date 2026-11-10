import { defineConfig } from '@content-collections/core';
import {
  createChangelogCollection,
  createComponentPagesCollection,
  createDocsCollection,
  createNotesCollection,
} from '@postkit/content';

const changelogEntries = createChangelogCollection(
  '../../libs/content/changelog',
);
const docsEntries = createDocsCollection('../../libs/content/docs');
const notesEntries = createNotesCollection('../../libs/content/notes');
const componentPages = createComponentPagesCollection(
  '../../libs/content/components',
);

export default defineConfig({
  content: [docsEntries, changelogEntries, notesEntries, componentPages],
});

import { defineConfig } from '@content-collections/core';
import {
  createChangelogCollection,
  createDocsCollection,
} from '@postkit/content';

const changelogEntries = createChangelogCollection(
  '../../libs/content/changelog',
);
const docsEntries = createDocsCollection('../../libs/content/docs');

export default defineConfig({
  content: [docsEntries, changelogEntries],
});

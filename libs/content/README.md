# PostKit content

`@postkit/content` owns reusable first-party content and its validation rules.
It is a private workspace library, not a published PostKit package.

## Collections

Documentation lives in `docs`, release notes live in `changelog`, and both are
validated with Content Collections. A consuming site defines its generated
collections with the shared factories:

```ts
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
```

The directory is relative to the consuming site's `content-collections.ts`
file. This keeps framework integration local to each site while allowing the
same documents and schema to be reused by the documentation site, examples, or
future applications.

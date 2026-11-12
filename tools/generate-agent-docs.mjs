import {
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import matter from 'gray-matter';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';

const workspaceRoot = fileURLToPath(new URL('../', import.meta.url));
const docsDirectory = join(workspaceRoot, 'libs', 'content', 'docs');
const publicDirectory = join(workspaceRoot, 'apps', 'site', 'public');
// Raw Markdown for each published guide, linked from llms.txt (01 §10).
const markdownDirectoryName = 'docs-md';
const markdownDirectory = join(publicDirectory, markdownDirectoryName);
const componentManifestPath = join(
  workspaceRoot,
  'packages',
  'chakra',
  'component-manifest.json',
);
const repositoryUrl = 'https://github.com/postkit-org/postkit-js';
const packageDirectories = [
  'unfurl',
  'chakra',
  'shiki',
  'next',
  'react-router',
  'tanstack-router',
  'astro',
];
const matterOptions = {
  engines: {
    yaml: {
      parse: (source) => parseYaml(source.trim()),
      stringify: stringifyYaml,
    },
  },
};

function requiredString(data, key, filename) {
  const value = data[key];
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TypeError(
      `Documentation entry "${filename}" requires a non-empty "${key}" field.`,
    );
  }
  return value.trim();
}

// Nav group order (libs/content/src/lib/docs.ts `docsCategories`).
const docsCategories = [
  'Get started',
  'Writing',
  'Customizing',
  'Renderers',
  'Frameworks',
  'Reference',
];

function requiredCategory(data, filename) {
  const category = requiredString(data, 'category', filename);
  if (!docsCategories.includes(category)) {
    throw new TypeError(
      `Documentation entry "${filename}" has an unknown category "${category}".`,
    );
  }
  return category;
}

// MDX comments (`{/* TODO … */}`) are notes for maintainers, not reader content.
// Fenced code blocks are left alone: JSX comments there are part of the example.
function stripMdxComments(markdown) {
  return markdown
    .split(/(^```[\s\S]*?^```[ \t]*$)/m)
    .map((part, index) =>
      index % 2 === 1
        ? part
        : part
            .replace(/^[ \t]*\{\/\*[\s\S]*?\*\/\}[ \t]*\n?/gm, '')
            .replace(/\{\/\*[\s\S]*?\*\/\}/g, ''),
    )
    .join('');
}

const documents = readdirSync(docsDirectory)
  .filter((filename) => filename.endsWith('.md'))
  .map((filename) => {
    const source = readFileSync(join(docsDirectory, filename), 'utf8');
    const { data, content } = matter(source, matterOptions);
    // Drafts are left out of production output, including the agent docs.
    if (data.status === 'draft') {
      return null;
    }
    if (
      typeof data.order !== 'number' ||
      !Number.isInteger(data.order) ||
      data.order < 0
    ) {
      throw new TypeError(
        `Documentation entry "${filename}" requires a non-negative integer "order" field.`,
      );
    }
    const slug = filename.replace(/\.md$/, '');
    return {
      slug,
      url: `/docs/${slug}`,
      markdownUrl: `/${markdownDirectoryName}/${slug}.md`,
      title: requiredString(data, 'title', filename),
      summary: requiredString(data, 'summary', filename),
      category: requiredCategory(data, filename),
      order: data.order,
      content: stripMdxComments(content).trim(),
    };
  })
  .filter((document) => document !== null)
  .sort(
    (left, right) =>
      docsCategories.indexOf(left.category) -
        docsCategories.indexOf(right.category) ||
      left.order - right.order ||
      left.title.localeCompare(right.title),
  );

const packageDocuments = packageDirectories.map((directory) => {
  const manifest = JSON.parse(
    readFileSync(
      join(workspaceRoot, 'packages', directory, 'package.json'),
      'utf8',
    ),
  );
  return {
    name: manifest.name,
    description: manifest.description,
    url: `${repositoryUrl}/tree/main/packages/${directory}`,
    content: readFileSync(
      join(workspaceRoot, 'packages', directory, 'README.md'),
      'utf8',
    ).trim(),
  };
});

// Components come from the generated manifest; each has a page at /components/[slug]
// (the slug rule matches componentNameToSlug in apps/site/src/lib/components.ts).
const componentManifest = JSON.parse(
  readFileSync(componentManifestPath, 'utf8'),
);
const components = Object.values(componentManifest.components).map(
  (component) => ({
    name: component.name,
    url: `/components/${component.name
      .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
      .toLowerCase()}`,
    category: component.category,
    summary: component.description,
  }),
);
const groupedComponents = new Map();
for (const component of components) {
  const entries = groupedComponents.get(component.category) ?? [];
  entries.push(component);
  groupedComponents.set(component.category, entries);
}

const groupedDocuments = new Map();
for (const document of documents) {
  const entries = groupedDocuments.get(document.category) ?? [];
  entries.push(document);
  groupedDocuments.set(document.category, entries);
}

const indexLines = [
  '# Postkit',
  '',
  '> Portable article components, Markdown tooling, link metadata resolvers, and framework adapters.',
  '',
  'Postkit separates a structured publishing contract from its React, Next.js, React Router, TanStack Router, and Astro renderers.',
  '',
];

for (const [category, entries] of groupedDocuments) {
  indexLines.push(`## ${category}`, '');
  for (const entry of entries) {
    indexLines.push(
      `- [${entry.title}](${entry.url}) ([Markdown](${entry.markdownUrl})): ${entry.summary}`,
    );
  }
  indexLines.push('');
}

indexLines.push('## Components', '');
for (const [category, entries] of groupedComponents) {
  indexLines.push(`### ${category}`, '');
  for (const component of entries) {
    indexLines.push(
      `- [${component.name}](${component.url}): ${component.summary}`,
    );
  }
  indexLines.push('');
}

indexLines.push('## Packages', '');
for (const packageDocument of packageDocuments) {
  indexLines.push(
    `- [${packageDocument.name}](${packageDocument.url}): ${packageDocument.description}`,
  );
}
indexLines.push(
  '',
  '## Machine-readable reference',
  '',
  '- [Component manifest](https://unpkg.com/@postkit/chakra/component-manifest.json): Versioned component names, props, examples, runtime requirements, and renderer support.',
  '- [TypeScript API model](/api/postkit-api.json): TypeDoc JSON generated from every public package export.',
  '- [Full documentation context](/llms-full.txt): Guides and package documentation in one text document.',
  '- [Documentation index](/postkit-docs.json): Structured guide metadata and content.',
  '',
  '## Feeds',
  '',
  '- [Changelog](/feeds/changelog.xml): Released versions as RSS 2.0; also [Atom](/feeds/changelog.atom) and [JSON Feed](/feeds/changelog.json).',
  '- [Notes](/feeds/notes.xml): Release notes, guides and case studies as RSS 2.0; also [Atom](/feeds/notes.atom) and [JSON Feed](/feeds/notes.json).',
  '',
  '## Source',
  '',
  `- [Repository](${repositoryUrl})`,
  `- [Examples](${repositoryUrl}/tree/main/examples)`,
  '',
);

const fullLines = [
  '# Postkit full documentation',
  '',
  'Generated from the canonical Postkit guides and public package READMEs.',
  '',
];
for (const document of documents) {
  fullLines.push(
    `## ${document.title}`,
    '',
    `Source: ${document.url}`,
    '',
    document.content,
    '',
  );
}
for (const packageDocument of packageDocuments) {
  fullLines.push(
    `## Package: ${packageDocument.name}`,
    '',
    `Source: ${packageDocument.url}`,
    '',
    packageDocument.content,
    '',
  );
}

const outputs = new Map([
  [join(publicDirectory, 'llms.txt'), `${indexLines.join('\n')}\n`],
  [join(publicDirectory, 'llms-full.txt'), `${fullLines.join('\n')}\n`],
  [
    join(publicDirectory, 'postkit-docs.json'),
    `${JSON.stringify(
      {
        id: 'postkit.documentation',
        version: 1,
        repository: repositoryUrl,
        documents,
        components,
        packages: packageDocuments.map(({ name, description, url }) => ({
          name,
          description,
          url,
        })),
        references: {
          api: '/api/postkit-api.json',
          componentManifest:
            'https://unpkg.com/@postkit/chakra/component-manifest.json',
          fullText: '/llms-full.txt',
        },
      },
      null,
      2,
    )}\n`,
  ],
]);

for (const document of documents) {
  outputs.set(
    join(markdownDirectory, `${document.slug}.md`),
    `# ${document.title}\n\n${document.summary}\n\n${document.content}\n`,
  );
}

const check = process.argv.includes('--check');

// Raw Markdown for a guide that was removed or became a draft must not linger.
const expectedMarkdown = new Set(
  documents.map((document) => `${document.slug}.md`),
);
let existingMarkdown = [];
try {
  existingMarkdown = readdirSync(markdownDirectory);
} catch {
  existingMarkdown = [];
}
const staleMarkdown = existingMarkdown.filter(
  (filename) => !expectedMarkdown.has(filename),
);
if (check && staleMarkdown.length > 0) {
  throw new Error(
    `Stale raw Markdown in ${markdownDirectory}: ${staleMarkdown.join(', ')}. Run npm run docs:agents:generate.`,
  );
}
if (!check) {
  for (const filename of staleMarkdown) {
    rmSync(join(markdownDirectory, filename), { recursive: true, force: true });
  }
  mkdirSync(markdownDirectory, { recursive: true });
}
for (const [path, output] of outputs) {
  if (check) {
    let existing;
    try {
      existing = readFileSync(path, 'utf8');
    } catch {
      throw new Error(
        `Generated agent documentation is missing at ${path}. Run npm run docs:agents:generate.`,
      );
    }
    if (existing !== output) {
      throw new Error(
        `Generated agent documentation is stale at ${path}. Run npm run docs:agents:generate.`,
      );
    }
  } else {
    writeFileSync(path, output);
    process.stdout.write(`Generated ${path}\n`);
  }
}

if (check) {
  process.stdout.write('Agent documentation is current.\n');
}

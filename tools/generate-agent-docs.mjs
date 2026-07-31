import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import matter from 'gray-matter';

const workspaceRoot = fileURLToPath(new URL('../', import.meta.url));
const docsDirectory = join(workspaceRoot, 'libs', 'content', 'docs');
const publicDirectory = join(workspaceRoot, 'apps', 'site', 'public');
const repositoryUrl = 'https://github.com/postkit-org/postkit-js';
const packageDirectories = [
  'unfurl',
  'react',
  'shiki',
  'next',
  'react-router',
  'tanstack-router',
  'astro',
];

function requiredString(data, key, filename) {
  const value = data[key];
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TypeError(
      `Documentation entry "${filename}" requires a non-empty "${key}" field.`,
    );
  }
  return value.trim();
}

const documents = readdirSync(docsDirectory)
  .filter((filename) => filename.endsWith('.md'))
  .map((filename) => {
    const source = readFileSync(join(docsDirectory, filename), 'utf8');
    const { data, content } = matter(source);
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
      title: requiredString(data, 'title', filename),
      summary: requiredString(data, 'summary', filename),
      category: requiredString(data, 'category', filename),
      order: data.order,
      content: content.trim(),
    };
  })
  .sort(
    (left, right) =>
      left.order - right.order || left.title.localeCompare(right.title),
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

const groupedDocuments = new Map();
for (const document of documents) {
  const entries = groupedDocuments.get(document.category) ?? [];
  entries.push(document);
  groupedDocuments.set(document.category, entries);
}

const indexLines = [
  '# PostKit',
  '',
  '> Portable article components, Markdown tooling, link metadata resolvers, and framework adapters.',
  '',
  'PostKit separates a structured publishing contract from its React, Next.js, React Router, TanStack Router, and Astro renderers.',
  '',
];

for (const [category, entries] of groupedDocuments) {
  indexLines.push(`## ${category}`, '');
  for (const entry of entries) {
    indexLines.push(`- [${entry.title}](${entry.url}): ${entry.summary}`);
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
  '- [Component manifest](https://unpkg.com/@postkit/react/component-manifest.json): Versioned component names, props, examples, runtime requirements, and renderer support.',
  '- [TypeScript API model](/api/postkit-api.json): TypeDoc JSON generated from every public package export.',
  '- [Full documentation context](/llms-full.txt): Guides and package documentation in one text document.',
  '- [Documentation index](/postkit-docs.json): Structured guide metadata and content.',
  '',
  '## Source',
  '',
  `- [Repository](${repositoryUrl})`,
  `- [Examples](${repositoryUrl}/tree/main/examples)`,
  '',
);

const fullLines = [
  '# PostKit full documentation',
  '',
  'Generated from the canonical PostKit guides and public package READMEs.',
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
        packages: packageDocuments.map(({ name, description, url }) => ({
          name,
          description,
          url,
        })),
        references: {
          api: '/api/postkit-api.json',
          componentManifest:
            'https://unpkg.com/@postkit/react/component-manifest.json',
          fullText: '/llms-full.txt',
        },
      },
      null,
      2,
    )}\n`,
  ],
]);

const check = process.argv.includes('--check');
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

import type {
  PostkitComponentCatalogEntry,
  PostkitComponentName,
} from '@postkit/chakra';

import {
  componentPreviewSamples,
  type PreviewPropValue,
  type PreviewProps,
} from '../component-preview';

export type UsageSyntax = 'mdx' | 'markdown';

function isJsonValue(value: PreviewPropValue): boolean {
  return typeof value === 'object' && value !== null;
}

/** One MDX attribute: `title="…"`, `lineNumbers`, `width={2400}`, `items='[…]'`. */
function mdxAttribute(name: string, value: PreviewPropValue): string {
  if (value === true) return name;
  if (value === false || typeof value === 'number') return `${name}={${value}}`;
  if (isJsonValue(value)) {
    // JSON props are JSON strings in both syntaxes (the manifest's `json` kind).
    return `${name}='${JSON.stringify(value)}'`;
  }
  const text = String(value);
  if (text.includes('\n'))
    return `${name}={\`${text.replace(/[`\\$]/g, '\\$&')}\`}`;
  if (text.includes('"')) return `${name}={${JSON.stringify(text)}}`;
  return `${name}="${text}"`;
}

/** One directive attribute: `title="…"`, `copy`, `items='[…]'`. */
function directiveAttribute(name: string, value: PreviewPropValue): string {
  if (value === true) return name;
  if (isJsonValue(value)) return `${name}='${JSON.stringify(value)}'`;
  // A directive's attributes sit on one line: line breaks become character references.
  const text = String(value).replace(/\n/g, '&#10;');
  return text.includes('"') ? `${name}='${text}'` : `${name}="${text}"`;
}

/** Props in the order an author would write them: the controls' values last. */
function orderedEntries(
  props: PreviewProps,
  values: Readonly<Record<string, string | undefined>>,
): [string, PreviewPropValue][] {
  const controlled = Object.entries(values).filter(
    (entry): entry is [string, string] => entry[1] !== undefined,
  );
  const names = new Set(controlled.map(([name]) => name));
  return [
    ...Object.entries(props).filter(([name]) => !names.has(name)),
    ...controlled,
  ];
}

function mdxSource(
  name: PostkitComponentName,
  props: PreviewProps,
  values: Readonly<Record<string, string | undefined>>,
  children: string | undefined,
): string {
  const attributes = orderedEntries(props, values).map(([prop, value]) =>
    mdxAttribute(prop, value),
  );
  const inline = `<${name}${attributes.map((attribute) => ` ${attribute}`).join('')}`;
  const multiline =
    inline.length > 60 ||
    attributes.some((attribute) => attribute.includes('\n'));
  const opening = multiline
    ? `<${name}\n${attributes.map((attribute) => `  ${attribute}`).join('\n')}\n`
    : `${inline}${attributes.length ? ' ' : ''}`;

  if (!children) return `${opening}/>`;
  const body = children
    .split('\n')
    .map((line) => (line ? `  ${line}` : line))
    .join('\n');
  return `${opening.trimEnd()}>\n${body}\n</${name}>`;
}

function markdownSource(
  component: PostkitComponentCatalogEntry,
  props: PreviewProps,
  values: Readonly<Record<string, string | undefined>>,
  children: string | undefined,
): string {
  const attributes = orderedEntries(props, values).map(([prop, value]) =>
    directiveAttribute(prop, value),
  );
  const attributeList = attributes.length ? `{${attributes.join(' ')}}` : '';

  if (component.childMode === 'mdx' && children) {
    return `:::${component.directive}${attributeList}\n${children}\n:::`;
  }
  return `::${component.directive}${attributeList}`;
}

/**
 * The Usage source for a component in one syntax, written from the same sample the
 * preview renders, with the preview controls' current values. Changing a control
 * changes both.
 */
export function usageSource(
  component: PostkitComponentCatalogEntry,
  syntax: UsageSyntax,
  values: Readonly<Record<string, string | undefined>> = {},
): string {
  const sample = componentPreviewSamples[component.name];

  if (syntax === 'mdx') {
    return mdxSource(component.name, sample.props, values, sample.children);
  }

  const markdown = sample.markdown ?? sample;
  return markdownSource(component, markdown.props, values, markdown.children);
}

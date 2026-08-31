import { fromHtml } from 'hast-util-from-html';
import type {
  Element as HastElement,
  Nodes as HastNode,
  Properties as HastProperties,
} from 'hast';

import {
  createPostkitDocument,
  type PostkitAttributeValue,
  type PostkitDocument,
  type PostkitJsonValue,
  type PostkitNode,
} from './document.js';

export type PostkitUnknownElementBehavior = 'drop' | 'unwrap';

export interface ParsePostkitHtmlOptions {
  /** Unknown elements are unwrapped by default so their readable content survives. */
  readonly unknownElements?: PostkitUnknownElementBehavior;
  /** Additional semantic HTML elements that may survive normalization. */
  readonly allowedElements?: readonly string[];
  /** Determines which annotated Postkit component names may enter the document. */
  readonly allowComponent?: (name: string) => boolean;
}

const defaultAllowedElements = new Set([
  'a',
  'abbr',
  'article',
  'aside',
  'audio',
  'b',
  'blockquote',
  'br',
  'caption',
  'code',
  'dd',
  'del',
  'details',
  'div',
  'dl',
  'dt',
  'em',
  'figcaption',
  'figure',
  'footer',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'header',
  'hr',
  'i',
  'img',
  'input',
  'kbd',
  'li',
  'main',
  'mark',
  'ol',
  'p',
  'picture',
  'pre',
  's',
  'section',
  'small',
  'source',
  'span',
  'strong',
  'sub',
  'summary',
  'sup',
  'table',
  'tbody',
  'td',
  'tfoot',
  'th',
  'thead',
  'time',
  'tr',
  'u',
  'ul',
  'video',
]);

const droppedElements = new Set([
  'base',
  'embed',
  'form',
  'iframe',
  'link',
  'meta',
  'object',
  'script',
  'style',
  'template',
]);

const allowedProperties = new Set([
  'alt',
  'checked',
  'cite',
  'colSpan',
  'controls',
  'dateTime',
  'disabled',
  'height',
  'href',
  'id',
  'kind',
  'label',
  'loading',
  'loop',
  'muted',
  'open',
  'poster',
  'preload',
  'rel',
  'reversed',
  'rowSpan',
  'scope',
  'sizes',
  'span',
  'src',
  'srcSet',
  'start',
  'title',
  'type',
  'width',
]);

const componentNamePattern = /^[A-Z][A-Za-z0-9.]*$/;

function propertyString(
  properties: HastProperties,
  ...names: string[]
): string | undefined {
  for (const name of names) {
    const value = properties[name];
    if (typeof value === 'string' && value.length > 0) return value;
  }
  return undefined;
}

function parseAnnotatedValue(value: string): PostkitJsonValue {
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (value === 'null') return null;
  if (/^-?(?:0|[1-9]\d*)(?:\.\d+)?$/.test(value)) {
    const number = Number(value);
    if (Number.isFinite(number)) return number;
  }
  return value;
}

function annotatedProps(
  properties: HastProperties,
): Readonly<Record<string, PostkitJsonValue>> | undefined {
  const props: Record<string, PostkitJsonValue> = Object.create(null) as Record<
    string,
    PostkitJsonValue
  >;
  const serialized = propertyString(
    properties,
    'dataPostkitProps',
    'data-postkit-props',
  );
  if (serialized) {
    try {
      const value = JSON.parse(serialized) as unknown;
      if (
        typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value)
      ) {
        for (const [key, item] of Object.entries(value)) {
          if (
            key !== '__proto__' &&
            key !== 'constructor' &&
            key !== 'prototype'
          ) {
            props[key] = item as PostkitJsonValue;
          }
        }
      }
    } catch {
      // Malformed annotations are ignored; readable semantic HTML still parses.
    }
  }
  for (const [key, value] of Object.entries(properties)) {
    const match = key.match(/^dataPostkitProp([A-Z].*)$/);
    if (!match || typeof value !== 'string') continue;
    const suffix = match[1];
    if (!suffix) continue;
    const name = `${suffix[0]?.toLowerCase() ?? ''}${suffix.slice(1)}`;
    if (
      name === '__proto__' ||
      name === 'constructor' ||
      name === 'prototype'
    ) {
      continue;
    }
    props[name] = parseAnnotatedValue(value);
  }
  return Object.keys(props).length > 0 ? props : undefined;
}

function safeUrl(value: string, property: 'href' | 'src'): boolean {
  const normalized = value.trim().toLowerCase();
  if (
    normalized.startsWith('#') ||
    normalized.startsWith('/') ||
    normalized.startsWith('./') ||
    normalized.startsWith('../')
  ) {
    return true;
  }
  try {
    const url = new URL(value);
    if (url.protocol === 'http:' || url.protocol === 'https:') return true;
    return property === 'href' && ['mailto:', 'tel:'].includes(url.protocol);
  } catch {
    return false;
  }
}

function normalizeAttributes(
  properties: HastProperties,
): Readonly<Record<string, PostkitAttributeValue>> | undefined {
  const attributes: Record<string, PostkitAttributeValue> = {};
  for (const [key, value] of Object.entries(properties)) {
    if (key.startsWith('dataPostkit')) continue;
    if (key.startsWith('on') || !allowedProperties.has(key)) continue;
    if (value === null || value === undefined) continue;
    if (
      (key === 'href' || key === 'src') &&
      typeof value === 'string' &&
      !safeUrl(value, key)
    ) {
      continue;
    }
    if (
      typeof value === 'boolean' ||
      typeof value === 'number' ||
      typeof value === 'string'
    ) {
      attributes[key] = value;
      continue;
    }
    if (
      Array.isArray(value) &&
      value.every(
        (item): item is number | string =>
          typeof item === 'number' || typeof item === 'string',
      )
    ) {
      attributes[key] = value;
    }
  }
  return Object.keys(attributes).length > 0 ? attributes : undefined;
}

function convertChildren(
  children: readonly HastNode[],
  options: ParsePostkitHtmlOptions,
  allowed: ReadonlySet<string>,
): PostkitNode[] {
  return children.flatMap((child) => convertNode(child, options, allowed));
}

function convertElement(
  node: HastElement,
  options: ParsePostkitHtmlOptions,
  allowed: ReadonlySet<string>,
): PostkitNode[] {
  const children = convertChildren(node.children, options, allowed);
  const componentName = propertyString(
    node.properties,
    'dataPostkitComponent',
    'dataPostkitNode',
    'data-postkit-component',
    'data-postkit-node',
  );
  if (
    componentName &&
    componentNamePattern.test(componentName) &&
    (options.allowComponent?.(componentName) ?? true)
  ) {
    const props = annotatedProps(node.properties);
    return [
      {
        type: 'component',
        name: componentName,
        ...(props ? { props } : {}),
        children,
      },
    ];
  }
  const name = node.tagName.toLowerCase();
  if (droppedElements.has(name)) return [];
  if (!allowed.has(name)) {
    return options.unknownElements === 'drop' ? [] : children;
  }
  const attributes = normalizeAttributes(node.properties);
  return [
    {
      type: 'element',
      name,
      ...(attributes ? { attributes } : {}),
      children,
    },
  ];
}

function convertNode(
  node: HastNode,
  options: ParsePostkitHtmlOptions,
  allowed: ReadonlySet<string>,
): PostkitNode[] {
  if (node.type === 'text') return [{ type: 'text', value: node.value }];
  if (node.type === 'element') return convertElement(node, options, allowed);
  if ('children' in node && Array.isArray(node.children)) {
    return convertChildren(node.children as HastNode[], options, allowed);
  }
  return [];
}

export function parsePostkitHtml(
  source: string,
  options: ParsePostkitHtmlOptions = {},
): PostkitDocument {
  const allowed = new Set([
    ...defaultAllowedElements,
    ...(options.allowedElements ?? []).map((name) => name.toLowerCase()),
  ]);
  const root = fromHtml(source, { fragment: true });
  return createPostkitDocument(
    convertChildren(root.children, options, allowed),
  );
}

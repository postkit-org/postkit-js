'use client';

import {
  POSTKIT_DOCUMENT_VERSION,
  normalizePostkitFootnoteIdentifier,
  resolvePostkitFootnotes,
  type PostkitFootnoteResolution,
  type PostkitComponentNode,
  type PostkitDocument,
  type PostkitElementNode,
  type PostkitJsonValue,
  type PostkitNode,
} from '@postkit/core';
import { chakra } from '@chakra-ui/react';
import {
  createElement,
  Fragment,
  type ElementType,
  type ReactElement,
  type ReactNode,
} from 'react';

import { postkitChakraLazyViews } from './chakra-lazy-views.js';
import { Prose, postkitProseComponents } from './components/prose.js';

export type PostkitRenderComponent = ElementType;
export type PostkitDocumentComponentMap = Readonly<
  Record<string, PostkitRenderComponent>
>;
export type PostkitUnknownNodeBehavior = 'drop' | 'unwrap';

const structuralElementNames = [
  'abbr',
  'article',
  'aside',
  'audio',
  'b',
  'caption',
  'div',
  'footer',
  'header',
  'i',
  'main',
  'picture',
  'section',
  'source',
  'span',
  'tfoot',
  'time',
  'u',
  'video',
] as const;

const structuralComponents = Object.fromEntries(
  structuralElementNames.map((name) => [name, chakra(name)]),
) as PostkitDocumentComponentMap;

/**
 * The default map: structural elements, prose, and Postkit's component views
 * as lazy views (`postkitChakraLazyViews`), so a page downloads only the views
 * its document uses. A server render that waits for Suspense (a streaming or
 * `allReady` render, as Next.js does) has them in its HTML; for a synchronous
 * render (`renderToStaticMarkup`), pass `components={postkitChakraViews}`.
 */
export const postkitDocumentComponents: PostkitDocumentComponentMap =
  Object.freeze({
    ...structuralComponents,
    ...postkitProseComponents,
    ...postkitChakraLazyViews,
    Prose,
  });

export interface CreatePostkitDocumentComponentsOptions {
  readonly components?: Readonly<Record<string, PostkitRenderComponent>>;
}

export function createPostkitDocumentComponents(
  options: CreatePostkitDocumentComponentsOptions = {},
): PostkitDocumentComponentMap {
  return {
    ...postkitDocumentComponents,
    ...options.components,
  };
}

export interface DocumentRendererProps {
  readonly document: PostkitDocument;
  /** Override semantic elements (such as `img`) and Postkit components by name. */
  readonly components?: Readonly<Record<string, PostkitRenderComponent>>;
  /** Wrap the document in Postkit's spacing-rhythm component. Set to false for fragments. */
  readonly wrapper?: PostkitRenderComponent | false;
  readonly wrapperProps?: Readonly<Record<string, unknown>>;
  readonly unknownElements?: PostkitUnknownNodeBehavior;
  readonly unknownComponents?: PostkitUnknownNodeBehavior;
  /** Emit versioned `data-postkit-*` reconstruction hints. */
  readonly annotate?: boolean;
}

const blockedComponentProps = new Set([
  'as',
  'aschild',
  '__proto__',
  'constructor',
  'prototype',
  'children',
  'classname',
  'css',
  'dangerouslysetinnerhtml',
  'ref',
  'rootprops',
  'slotstyles',
  'srcdoc',
  'style',
]);

// Portable attributes are content, not Chakra's polymorphic or styling API.
const elementAttributes = new Set([
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
  'language',
  'loading',
  'loop',
  'meta',
  'muted',
  'open',
  'poster',
  'preload',
  'rel',
  'reversed',
  'role',
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

function isElementAttribute(name: string): boolean {
  return elementAttributes.has(name) || /^aria-[a-z-]+$/.test(name);
}

function isBlockedProp(name: string): boolean {
  const normalized = name.toLowerCase();
  return blockedComponentProps.has(normalized) || normalized.startsWith('on');
}

const voidElementNames = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
]);

function safePortableUrl(value: string): boolean {
  const normalized = [...value.trim()]
    .filter((character) => character.charCodeAt(0) > 0x20)
    .join('')
    .toLowerCase();
  const scheme = normalized.match(/^([a-z][a-z0-9+.-]*):/)?.[1];
  return !scheme || ['http', 'https', 'mailto', 'tel'].includes(scheme);
}

const omittedJsonValue = Symbol('omittedPostkitJsonValue');

function safeSourceSet(value: PostkitJsonValue): boolean {
  return (
    typeof value === 'string' &&
    value.split(',').every((candidate) => {
      const [url, ...descriptors] = candidate.trim().split(/\s+/);
      return (
        !!url &&
        safePortableUrl(url) &&
        descriptors.length <= 1 &&
        descriptors.every((descriptor) =>
          /^(?:\d+(?:\.\d+)?x|\d+w)$/.test(descriptor),
        )
      );
    })
  );
}

function safeJsonProp(
  value: PostkitJsonValue,
  name?: string,
): PostkitJsonValue | typeof omittedJsonValue {
  if (name?.toLowerCase() === 'srcset' && !safeSourceSet(value))
    return omittedJsonValue;
  if (
    name &&
    /(?:href|poster|src|url)$/i.test(name) &&
    (typeof value !== 'string' || !safePortableUrl(value))
  ) {
    return omittedJsonValue;
  }
  if (Array.isArray(value)) {
    return value.flatMap((item) => {
      const safe = safeJsonProp(item);
      return safe === omittedJsonValue ? [] : [safe];
    });
  }
  if (value === null || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value).flatMap(([childName, childValue]) => {
      if (isBlockedProp(childName)) {
        return [];
      }
      const safe = safeJsonProp(childValue, childName);
      return safe === omittedJsonValue ? [] : [[childName, safe]];
    }),
  );
}

function safeComponentProps(
  props: Readonly<Record<string, PostkitJsonValue>> | undefined,
  semantic = false,
): Record<string, PostkitJsonValue> {
  return Object.fromEntries(
    Object.entries(props ?? {}).flatMap(([name, value]) => {
      if (isBlockedProp(name) || (semantic && !isElementAttribute(name))) {
        return [];
      }
      const safe = safeJsonProp(value, name);
      return safe === omittedJsonValue ? [] : [[name, safe]];
    }),
  );
}

function annotationProps(
  node: PostkitComponentNode,
): Readonly<Record<string, unknown>> {
  const props = safeComponentProps(node.props, isSemanticComponent(node.name));
  return {
    'data-postkit-component': node.name,
    'data-postkit-version': POSTKIT_DOCUMENT_VERSION,
    ...(Object.keys(props).length > 0
      ? { 'data-postkit-props': JSON.stringify(props) }
      : {}),
  };
}

function renderChildren(
  children: readonly PostkitNode[],
  context: RenderContext,
  path: string,
): ReactNode[] {
  return children.flatMap((child, index) =>
    renderNode(child, context, `${path}.${index}`),
  );
}

function elementProps(node: PostkitElementNode, annotate: boolean) {
  const attributes = Object.fromEntries(
    Object.entries(node.attributes ?? {}).filter(([name, value]) => {
      if (!isElementAttribute(name)) {
        return false;
      }
      if (name === 'srcSet') return safeSourceSet(value);
      if (
        ['action', 'cite', 'formAction', 'href', 'poster', 'src'].includes(name)
      ) {
        return typeof value === 'string' && safePortableUrl(value);
      }
      return true;
    }),
  ) as Record<string, unknown>;
  if (node.name === 'code') {
    const language = attributes['language'];
    if (typeof language === 'string' && language.length > 0) {
      attributes['className'] = `language-${language}`;
      delete attributes['language'];
    }
    const meta = attributes['meta'];
    if (typeof meta === 'string' && meta.length > 0) {
      attributes['data-meta'] = meta;
      delete attributes['meta'];
    }
  }
  if (annotate) {
    attributes['data-postkit-node'] = node.name;
    attributes['data-postkit-version'] = POSTKIT_DOCUMENT_VERSION;
  }
  return attributes;
}

interface RenderContext {
  readonly components: PostkitDocumentComponentMap;
  readonly unknownElements: PostkitUnknownNodeBehavior;
  readonly unknownComponents: PostkitUnknownNodeBehavior;
  readonly annotate: boolean;
  /** The document's numbered notes (03 §7.1). */
  readonly footnotes: FootnoteContext;
}

interface FootnoteContext {
  readonly resolution: PostkitFootnoteResolution;
  readonly occurrences: Map<string, number>;
  rendered: boolean;
}

/**
 * A note's content as phrasing, for the copy beside its first reference: a
 * reference sits in a paragraph, which can't hold blocks.
 */
function inlineNote(nodes: readonly PostkitNode[]): PostkitNode[] {
  const result: PostkitNode[] = [];
  for (const node of nodes) {
    if (node.type !== 'element') continue;
    const inline =
      node.name === 'p'
        ? [...node.children]
        : ['ul', 'ol', 'blockquote'].includes(node.name)
          ? inlineNote(node.children)
          : node.name === 'li'
            ? inlineNote(node.children).length > 0
              ? inlineNote(node.children)
              : [...node.children]
            : [];
    const content = inline.filter(
      (child) =>
        child.type !== 'footnoteReference' &&
        child.type !== 'footnoteDefinition',
    );
    if (content.length === 0) continue;
    if (result.length > 0) {
      result.push({ type: 'element', name: 'br', children: [] });
    }
    result.push(...content);
  }
  return result;
}

function renderFootnoteList(
  node: PostkitComponentNode | undefined,
  context: RenderContext,
  path: string,
): ReactNode[] {
  const { footnotes } = context;
  if (footnotes.rendered) return [];
  footnotes.rendered = true;
  const List = registeredComponent(context, 'Footnotes');
  const Note = registeredComponent(context, 'Footnote');
  const notes = footnotes.resolution.notes.filter((note) => note.definition);
  if (!List || !Note || notes.length === 0) return [];
  const props = node
    ? safeComponentProps(node.props, isSemanticComponent(node.name))
    : {};
  return [
    createElement(
      List,
      { ...props, key: path },
      notes.map((note) =>
        createElement(
          Note,
          {
            key: note.identifier,
            identifier: note.label ?? note.identifier,
            index: note.index,
            references: note.references,
            ...(typeof props['scope'] === 'string'
              ? { scope: props['scope'] }
              : {}),
          },
          renderChildren(
            note.definition?.children ?? [],
            context,
            `${path}.${note.index}`,
          ),
        ),
      ),
    ),
  ];
}

function isSemanticComponent(name: string): boolean {
  return name === 'Prose' || /^[a-z]/.test(name);
}

function registeredComponent(context: RenderContext, name: string) {
  return Object.hasOwn(context.components, name)
    ? context.components[name]
    : undefined;
}

function renderElement(
  node: PostkitElementNode,
  context: RenderContext,
  path: string,
): ReactElement | ReactNode[] | null {
  const Component = registeredComponent(context, node.name);
  const children = renderChildren(node.children, context, path);
  if (!Component) {
    return context.unknownElements === 'drop' ? null : children;
  }
  const props = elementProps(node, context.annotate);
  if (node.name === 'li' && typeof props['checked'] === 'boolean') {
    const checked = props['checked'];
    delete props['checked'];
    children.unshift(
      createElement('input', {
        key: `${path}.task`,
        type: 'checkbox',
        checked,
        disabled: true,
        'aria-label': checked ? 'Completed' : 'Not completed',
      }),
    );
  }
  return voidElementNames.has(node.name)
    ? createElement(Component, { ...props, key: path })
    : createElement(Component, { ...props, key: path }, children);
}

function renderComponent(
  node: PostkitComponentNode,
  context: RenderContext,
  path: string,
): ReactElement | ReactNode[] | null {
  const Component = registeredComponent(context, node.name);
  const children = renderChildren(node.children, context, path);
  if (!Component) {
    return context.unknownComponents === 'drop' ? null : children;
  }
  const props = safeComponentProps(node.props, isSemanticComponent(node.name));
  const annotations = context.annotate ? annotationProps(node) : {};
  return createElement(
    Component,
    {
      ...props,
      key: path,
      rootProps: annotations,
    },
    children,
  );
}

function renderNode(
  node: PostkitNode,
  context: RenderContext,
  path: string,
): ReactNode[] {
  if (node.type === 'text') return [node.value];
  if (node.type === 'footnoteDefinition') return [];
  if (node.type === 'footnoteReference') {
    const note = context.footnotes.resolution.byIdentifier.get(
      normalizePostkitFootnoteIdentifier(node.identifier),
    );
    const Note = registeredComponent(context, 'Footnote');
    if (!note || !Note) return [`[${node.label ?? node.identifier}]`];
    const occurrence =
      (context.footnotes.occurrences.get(note.identifier) ?? 0) + 1;
    context.footnotes.occurrences.set(note.identifier, occurrence);
    const listScope = context.footnotes.resolution.list?.props?.['scope'];
    return [
      createElement(
        Note,
        {
          key: path,
          identifier: note.label ?? note.identifier,
          index: note.index,
          ...(occurrence > 1 ? { occurrence } : {}),
          ...(typeof listScope === 'string' ? { scope: listScope } : {}),
        },
        occurrence === 1 && note.definition
          ? renderChildren(inlineNote(note.definition.children), context, path)
          : undefined,
      ),
    ];
  }
  if (node.type === 'component' && node.name === 'Footnotes') {
    return renderFootnoteList(node, context, path);
  }
  const rendered =
    node.type === 'element'
      ? renderElement(node, context, path)
      : renderComponent(node, context, path);
  if (rendered === null) return [];
  return Array.isArray(rendered) ? rendered : [rendered];
}

export function DocumentRenderer({
  document,
  components,
  wrapper = Prose,
  wrapperProps,
  unknownElements = 'unwrap',
  unknownComponents = 'unwrap',
  annotate = true,
}: DocumentRendererProps) {
  const context: RenderContext = {
    components: createPostkitDocumentComponents({ components }),
    unknownElements,
    unknownComponents,
    annotate,
    footnotes: {
      resolution: resolvePostkitFootnotes(document),
      occurrences: new Map(),
      rendered: false,
    },
  };
  const children = renderChildren(document.children, context, 'document');
  children.push(...renderFootnoteList(undefined, context, 'document.notes'));
  if (wrapper === false) return createElement(Fragment, null, children);
  return createElement(
    wrapper,
    {
      ...(annotate
        ? {
            'data-postkit-document': '',
            'data-postkit-version': document.version,
          }
        : {}),
      ...wrapperProps,
    },
    children,
  );
}

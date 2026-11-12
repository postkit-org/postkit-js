export const POSTKIT_DOCUMENT_VERSION = 1 as const;

export type PostkitJsonValue =
  | null
  | boolean
  | number
  | string
  | readonly PostkitJsonValue[]
  | { readonly [key: string]: PostkitJsonValue };

export type PostkitAttributeValue =
  boolean | number | string | readonly (number | string)[];

export interface PostkitTextNode {
  readonly type: 'text';
  readonly value: string;
}

export interface PostkitElementNode {
  readonly type: 'element';
  readonly name: string;
  readonly attributes?: Readonly<Record<string, PostkitAttributeValue>>;
  readonly children: readonly PostkitNode[];
}

export interface PostkitComponentNode {
  readonly type: 'component';
  readonly name: string;
  readonly props?: Readonly<Record<string, PostkitJsonValue>>;
  readonly children: readonly PostkitNode[];
}

/**
 * A footnote mark in the text (inline). `identifier` is the normalized id
 * that links it to its {@link PostkitFootnoteDefinitionNode}; `label` is the
 * id as the author wrote it (`[^Plain]`), kept for round trips. Labels are
 * ids, never numbers: notes are numbered by first reference (03 §7.1).
 */
export interface PostkitFootnoteReferenceNode {
  readonly type: 'footnoteReference';
  readonly identifier: string;
  readonly label?: string;
}

/**
 * A footnote's content (block). Where it sits in the document doesn't
 * matter: renderers list the notes at the `Footnotes` component, or at the
 * end of the document.
 */
export interface PostkitFootnoteDefinitionNode {
  readonly type: 'footnoteDefinition';
  readonly identifier: string;
  readonly label?: string;
  readonly children: readonly PostkitNode[];
}

export type PostkitNode =
  | PostkitComponentNode
  | PostkitElementNode
  | PostkitFootnoteDefinitionNode
  | PostkitFootnoteReferenceNode
  | PostkitTextNode;

export interface PostkitDocument {
  readonly type: 'document';
  readonly version: typeof POSTKIT_DOCUMENT_VERSION;
  readonly children: readonly PostkitNode[];
}

export function createPostkitDocument(
  children: readonly PostkitNode[] = [],
): PostkitDocument {
  return {
    type: 'document',
    version: POSTKIT_DOCUMENT_VERSION,
    children,
  };
}

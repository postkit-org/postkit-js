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

export type PostkitNode =
  PostkitComponentNode | PostkitElementNode | PostkitTextNode;

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

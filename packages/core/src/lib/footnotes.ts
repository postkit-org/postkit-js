import type {
  PostkitComponentNode,
  PostkitDocument,
  PostkitFootnoteDefinitionNode,
  PostkitNode,
} from './document.js';

/** What {@link validatePostkitFootnotes} reports. */
export interface PostkitFootnoteProblem {
  /** Errors fail a build; warnings are reported and rendering continues. */
  readonly severity: 'error' | 'warning';
  readonly code:
    'duplicate-definition' | 'missing-definition' | 'unreferenced-definition';
  readonly identifier: string;
  readonly message: string;
}

/** One note, numbered by its first reference (03 §7.1). */
export interface PostkitResolvedFootnote {
  readonly identifier: string;
  /** The id as first written, such as `Plain` for `[^Plain]`. */
  readonly label?: string;
  /** The note's number, from 1, in order of first reference. */
  readonly index: number;
  /** How many references the note has. A shared note has more than one. */
  readonly references: number;
  /** The note's content. Missing when the source never defines it. */
  readonly definition?: PostkitFootnoteDefinitionNode;
}

/** A document's notes, numbered, with any problems found. */
export interface PostkitFootnoteResolution {
  /** The referenced notes, in number order. */
  readonly notes: readonly PostkitResolvedFootnote[];
  /** Notes by normalized identifier. */
  readonly byIdentifier: ReadonlyMap<string, PostkitResolvedFootnote>;
  /** Missing and duplicate definitions, and notes nobody references. */
  readonly problems: readonly PostkitFootnoteProblem[];
  /** The first `Footnotes` component: where the list goes. */
  readonly list?: PostkitComponentNode;
}

/**
 * Normalizes a footnote id as Markdown does: whitespace collapses and case
 * folds, so `[^Plain]` and `[^plain]` are the same note.
 */
export function normalizePostkitFootnoteIdentifier(value: string): string {
  return value
    .replace(/[\t\n\r ]+/g, ' ')
    .trim()
    .toLowerCase()
    .toUpperCase()
    .toLowerCase();
}

interface MutableNote {
  identifier: string;
  label?: string;
  index: number;
  references: number;
  definition?: PostkitFootnoteDefinitionNode;
}

/**
 * Numbers a document's footnotes: in order of first reference, counting
 * references inside notes after the text that leads to them. Repeated
 * references share one note. Also reports problems: a reference with no
 * definition is an error, a definition nobody references a warning.
 */
export function resolvePostkitFootnotes(
  document: PostkitDocument | readonly PostkitNode[],
): PostkitFootnoteResolution {
  const nodes = Array.isArray(document)
    ? (document as readonly PostkitNode[])
    : (document as PostkitDocument).children;
  const definitions = new Map<string, PostkitFootnoteDefinitionNode>();
  const problems: PostkitFootnoteProblem[] = [];
  const notes = new Map<string, MutableNote>();
  const order: MutableNote[] = [];
  let list: PostkitComponentNode | undefined;

  const collectDefinitions = (children: readonly PostkitNode[]) => {
    for (const node of children) {
      if (node.type === 'footnoteDefinition') {
        const identifier = normalizePostkitFootnoteIdentifier(node.identifier);
        if (definitions.has(identifier)) {
          problems.push({
            severity: 'warning',
            code: 'duplicate-definition',
            identifier,
            message: `Footnote [^${node.label ?? node.identifier}] is defined more than once; the first definition is used.`,
          });
        } else {
          definitions.set(identifier, node);
        }
        collectDefinitions(node.children);
        continue;
      }
      if (node.type === 'component' && node.name === 'Footnotes') list ??= node;
      if ('children' in node) collectDefinitions(node.children);
    }
  };
  collectDefinitions(nodes);

  const visit = (children: readonly PostkitNode[]) => {
    for (const node of children) {
      if (node.type === 'footnoteDefinition') continue;
      if (node.type === 'footnoteReference') {
        const identifier = normalizePostkitFootnoteIdentifier(node.identifier);
        let note = notes.get(identifier);
        if (!note) {
          note = {
            identifier,
            ...(node.label ? { label: node.label } : {}),
            index: order.length + 1,
            references: 0,
            definition: definitions.get(identifier),
          };
          if (!note.label && note.definition?.label) {
            note.label = note.definition.label;
          }
          notes.set(identifier, note);
          order.push(note);
          if (!note.definition) {
            problems.push({
              severity: 'error',
              code: 'missing-definition',
              identifier,
              message: `Footnote [^${node.label ?? node.identifier}] has no definition.`,
            });
          }
        }
        note.references += 1;
        continue;
      }
      if ('children' in node) visit(node.children);
    }
  };
  visit(nodes);
  // References inside notes number after the text that leads to them.
  for (let position = 0; position < order.length; position += 1) {
    const definition = order[position]?.definition;
    if (definition) visit(definition.children);
  }

  for (const [identifier, definition] of definitions) {
    if (notes.has(identifier)) continue;
    problems.push({
      severity: 'warning',
      code: 'unreferenced-definition',
      identifier,
      message: `Footnote [^${definition.label ?? definition.identifier}] is defined but never referenced; it is left out.`,
    });
  }

  return {
    notes: order,
    byIdentifier: notes,
    problems,
    ...(list ? { list } : {}),
  };
}

/**
 * Checks a document's footnotes (03 §7.1). A reference with no definition is
 * an `error`; a definition nobody references, or a second definition of the
 * same id, is a `warning`. Markdown parsing reports missing definitions with
 * their line and column; this covers documents from any source.
 */
export function validatePostkitFootnotes(
  document: PostkitDocument,
): readonly PostkitFootnoteProblem[] {
  return resolvePostkitFootnotes(document).problems;
}

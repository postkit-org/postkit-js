export {
  POSTKIT_DOCUMENT_VERSION,
  createPostkitDocument,
  type PostkitAttributeValue,
  type PostkitComponentNode,
  type PostkitDocument,
  type PostkitElementNode,
  type PostkitFootnoteDefinitionNode,
  type PostkitFootnoteReferenceNode,
  type PostkitJsonValue,
  type PostkitNode,
  type PostkitTextNode,
} from './lib/document.js';
export {
  PostkitParseError,
  parsePostkit,
  type ParsePostkitOptions,
  type PostkitInputFormat,
} from './lib/parse.js';
export {
  parsePostkitHtml,
  type ParsePostkitHtmlOptions,
  type PostkitUnknownElementBehavior,
} from './lib/parse-html.js';
export {
  parsePostkitMarkdown,
  type ParsePostkitMarkdownOptions,
} from './lib/parse-markdown.js';
export { parsePostkitJson } from './lib/parse-json.js';
export {
  serializePostkit,
  serializePostkitHtml,
  serializePostkitJson,
  serializePostkitMarkdown,
  serializePostkitMdx,
  type PostkitOutputFormat,
  type SerializePostkitHtmlOptions,
  type SerializePostkitJsonOptions,
  type SerializePostkitMarkdownOptions,
  type SerializePostkitOptions,
} from './lib/serialize.js';
export {
  serializePostkitText,
  type SerializePostkitTextOptions,
} from './lib/serialize-text.js';
export type {
  PostkitStaticFootnoteOptions,
  PostkitStaticViewOptions,
} from './lib/serialize-views.js';
export {
  normalizePostkitFootnoteIdentifier,
  resolvePostkitFootnotes,
  validatePostkitFootnotes,
  type PostkitFootnoteProblem,
  type PostkitFootnoteResolution,
  type PostkitResolvedFootnote,
} from './lib/footnotes.js';

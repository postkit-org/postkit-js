/**
 * Conservative edits to a `createPostkit` config file. The scanner
 * understands just enough TypeScript to find one `createPostkit({ … })` call,
 * its top-level properties and the file's imports. Anything it can't read
 * with certainty (template expressions, regular expressions, JSX, more than
 * one call, a spread where it would insert) throws
 * {@link PostkitUnsafeSourceError}, and the command prints the lines to add
 * instead of rewriting the file.
 */

/** Thrown when a file can't be edited safely; the CLI prints lines instead. */
export class PostkitUnsafeSourceError extends Error {
  override readonly name = 'PostkitUnsafeSourceError';
}

type TokenKind = 'ident' | 'number' | 'punct' | 'string';

interface Token {
  readonly kind: TokenKind;
  readonly value: string;
  readonly start: number;
  readonly end: number;
}

interface Parsed {
  readonly source: string;
  readonly tokens: readonly Token[];
  /** For an opening bracket, the index of its closing one (and back). */
  readonly match: ReadonlyMap<number, number>;
}

const regexPrecedingKeywords = new Set([
  'return',
  'typeof',
  'case',
  'do',
  'else',
  'in',
  'of',
  'new',
  'delete',
  'void',
  'throw',
  'yield',
  'await',
]);

function unsafe(message: string): never {
  throw new PostkitUnsafeSourceError(message);
}

function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let index = 0;
  const length = source.length;
  while (index < length) {
    const char = source[index];
    if (/\s/.test(char)) {
      index += 1;
      continue;
    }
    if (char === '/' && source[index + 1] === '/') {
      const end = source.indexOf('\n', index);
      index = end === -1 ? length : end;
      continue;
    }
    if (char === '/' && source[index + 1] === '*') {
      const end = source.indexOf('*/', index + 2);
      if (end === -1) unsafe('an unterminated comment');
      index = end + 2;
      continue;
    }
    if (char === "'" || char === '"' || char === '`') {
      let cursor = index + 1;
      while (cursor < length && source[cursor] !== char) {
        if (source[cursor] === '\\') cursor += 1;
        else if (
          char === '`' &&
          source[cursor] === '$' &&
          source[cursor + 1] === '{'
        ) {
          unsafe('a template literal with an expression');
        } else if (char !== '`' && source[cursor] === '\n') {
          unsafe('an unterminated string');
        }
        cursor += 1;
      }
      if (cursor >= length) unsafe('an unterminated string');
      tokens.push({
        kind: 'string',
        value: source.slice(index + 1, cursor),
        start: index,
        end: cursor + 1,
      });
      index = cursor + 1;
      continue;
    }
    if (/[A-Za-z_$]/.test(char)) {
      let cursor = index + 1;
      while (cursor < length && /[\w$]/.test(source[cursor])) cursor += 1;
      tokens.push({
        kind: 'ident',
        value: source.slice(index, cursor),
        start: index,
        end: cursor,
      });
      index = cursor;
      continue;
    }
    if (/[0-9]/.test(char)) {
      let cursor = index + 1;
      while (cursor < length && /[\w.]/.test(source[cursor])) cursor += 1;
      tokens.push({
        kind: 'number',
        value: source.slice(index, cursor),
        start: index,
        end: cursor,
      });
      index = cursor;
      continue;
    }
    if (char === '/') {
      const previous = tokens[tokens.length - 1];
      const division =
        previous &&
        ((previous.kind === 'ident' &&
          !regexPrecedingKeywords.has(previous.value)) ||
          previous.kind === 'number' ||
          previous.kind === 'string' ||
          (previous.kind === 'punct' && /^[)\]]$/.test(previous.value)));
      if (!division) unsafe('a regular expression');
    }
    if (char === '.' && source.startsWith('...', index)) {
      tokens.push({
        kind: 'punct',
        value: '...',
        start: index,
        end: index + 3,
      });
      index += 3;
      continue;
    }
    tokens.push({ kind: 'punct', value: char, start: index, end: index + 1 });
    index += 1;
  }
  return tokens;
}

function parse(source: string, fileName = ''): Parsed {
  if (/\.[cm]?[jt]sx$/.test(fileName)) {
    unsafe('JSX files are not edited');
  }
  const tokens = tokenize(source);
  const match = new Map<number, number>();
  const stack: number[] = [];
  const pairs: Record<string, string> = { ')': '(', ']': '[', '}': '{' };
  tokens.forEach((token, index) => {
    if (token.kind !== 'punct') return;
    if (token.value === '(' || token.value === '[' || token.value === '{') {
      stack.push(index);
    } else if (token.value in pairs) {
      const open = stack.pop();
      if (open === undefined || tokens[open].value !== pairs[token.value]) {
        unsafe('unbalanced brackets');
      }
      match.set(open, index);
      match.set(index, open);
    }
  });
  if (stack.length > 0) unsafe('unbalanced brackets');
  return { source, tokens, match };
}

interface ListItem {
  /** First and last token index of the item. */
  readonly first: number;
  readonly last: number;
}

/** The comma-separated items between an opening bracket and its match. */
function listItems(parsed: Parsed, open: number): ListItem[] {
  const close = parsed.match.get(open);
  if (close === undefined) unsafe('unbalanced brackets');
  const items: ListItem[] = [];
  let first = open + 1;
  let index = open + 1;
  while (index < close) {
    const token = parsed.tokens[index];
    if (token.kind === 'punct' && token.value === ',') {
      if (index > first) items.push({ first, last: index - 1 });
      first = index + 1;
      index += 1;
      continue;
    }
    const jump = parsed.match.get(index);
    index = jump !== undefined && jump > index ? jump + 1 : index + 1;
  }
  if (close > first) items.push({ first, last: close - 1 });
  return items;
}

interface Property {
  readonly key: string | null;
  readonly kind: 'method' | 'property' | 'shorthand' | 'spread';
  readonly item: ListItem;
  /** The first token of the value, for `key: value`. */
  readonly value?: number;
}

function objectProperties(parsed: Parsed, open: number): Property[] {
  return listItems(parsed, open).map((item) => {
    const first = parsed.tokens[item.first];
    const next = parsed.tokens[item.first + 1];
    if (first.kind === 'punct' && first.value === '...') {
      return { key: null, kind: 'spread', item };
    }
    if (
      (first.kind === 'ident' || first.kind === 'string') &&
      next?.kind === 'punct' &&
      next.value === ':'
    ) {
      return {
        key: first.value,
        kind: 'property',
        item,
        value: item.first + 2,
      };
    }
    if (first.kind === 'ident' && item.first === item.last) {
      return { key: first.value, kind: 'shorthand', item };
    }
    return {
      key: first.kind === 'ident' ? first.value : null,
      kind: 'method',
      item,
    };
  });
}

function lineIndent(source: string, position: number): string {
  const lineStart = source.lastIndexOf('\n', position - 1) + 1;
  return /^[ \t]*/.exec(source.slice(lineStart))?.[0] ?? '';
}

/** Inserts `text` as the last item of the list opened at `open`. */
function insertListItem(parsed: Parsed, open: number, text: string): string {
  const { source, tokens } = parsed;
  const close = parsed.match.get(open) as number;
  const items = listItems(parsed, open);
  const openToken = tokens[open];
  const closeToken = tokens[close];
  const multiline = source
    .slice(openToken.end, closeToken.start)
    .includes('\n');
  const brace = openToken.value === '{';
  if (items.length === 0) {
    if (multiline) {
      const indent = `${lineIndent(source, closeToken.start)}  `;
      return `${source.slice(0, openToken.end)}\n${indent}${text},${source.slice(
        source.lastIndexOf('\n', closeToken.start),
      )}`;
    }
    const inner = brace ? ` ${text} ` : text;
    return `${source.slice(0, openToken.end)}${inner}${source.slice(closeToken.start)}`;
  }
  const last = items[items.length - 1];
  const lastEnd = tokens[last.last].end;
  const trailingComma =
    tokens[close - 1].kind === 'punct' && tokens[close - 1].value === ',';
  if (multiline) {
    const indent = lineIndent(source, tokens[last.first].start);
    if (trailingComma) {
      const commaEnd = tokens[close - 1].end;
      return `${source.slice(0, commaEnd)}\n${indent}${text},${source.slice(commaEnd)}`;
    }
    return `${source.slice(0, lastEnd)},\n${indent}${text}${source.slice(lastEnd)}`;
  }
  return `${source.slice(0, lastEnd)}, ${text}${source.slice(lastEnd)}`;
}

/** Removes one item from the list opened at `open`, with its comma. */
function removeListItem(parsed: Parsed, open: number, item: ListItem): string {
  const { source, tokens } = parsed;
  const close = parsed.match.get(open) as number;
  const items = listItems(parsed, open);
  const position = items.findIndex((entry) => entry.first === item.first);
  let start = tokens[item.first].start;
  let end = tokens[item.last].end;
  const after = tokens[item.last + 1];
  if (after && after.kind === 'punct' && after.value === ',') {
    end = after.end;
    // Remove the whitespace up to the next item on the same line.
    const next = tokens[item.last + 2];
    if (
      next &&
      item.last + 2 !== close &&
      !source.slice(end, next.start).includes('\n')
    ) {
      end = next.start;
    }
  } else if (position > 0) {
    start = tokens[items[position - 1].last].end;
  }
  const lineStart = source.lastIndexOf('\n', start - 1) + 1;
  if (/^[ \t]*$/.test(source.slice(lineStart, start)) && source[end] === '\n') {
    start = lineStart;
    end += 1;
  }
  return `${source.slice(0, start)}${source.slice(end)}`;
}

/** The token index of the `{` that opens the single `createPostkit({…})`. */
function createPostkitObject(parsed: Parsed): number {
  const calls: number[] = [];
  parsed.tokens.forEach((token, index) => {
    if (token.kind !== 'ident' || token.value !== 'createPostkit') return;
    const previous = parsed.tokens[index - 1];
    if (previous?.kind === 'punct' && previous.value === '.') return;
    const next = parsed.tokens[index + 1];
    if (next?.kind === 'punct' && next.value === '<') {
      unsafe('createPostkit is called with type arguments');
    }
    if (next?.kind === 'punct' && next.value === '(') calls.push(index);
  });
  if (calls.length === 0) unsafe('no createPostkit({ … }) call');
  if (calls.length > 1) unsafe('more than one createPostkit call');
  const open = calls[0] + 2;
  const argument = parsed.tokens[open];
  if (argument?.kind !== 'punct' || argument.value !== '{') {
    unsafe('createPostkit is not called with an object literal');
  }
  return open;
}

function property(
  parsed: Parsed,
  open: number,
  key: string,
): Property | undefined {
  const properties = objectProperties(parsed, open);
  const found = properties.find((entry) => entry.key === key);
  if (found && found.kind !== 'property') {
    unsafe(`${key} isn't written as \`${key}: …\``);
  }
  if (!found && properties.some((entry) => entry.kind === 'spread')) {
    unsafe(`the options spread another object that may set ${key}`);
  }
  return found;
}

function literalOpen(
  parsed: Parsed,
  prop: Property,
  bracket: '[' | '{',
): number {
  const value = prop.value as number;
  const token = parsed.tokens[value];
  const close = parsed.match.get(value);
  if (
    token.kind !== 'punct' ||
    token.value !== bracket ||
    close === undefined ||
    close !== prop.item.last
  ) {
    unsafe(
      `${prop.key} isn't a${bracket === '[' ? 'n array' : 'n object'} literal`,
    );
  }
  return value;
}

/** Appends `element` to the options' array `key`, creating it if absent. */
export function appendToConfigArray(
  source: string,
  key: string,
  element: string,
  fileName?: string,
): string {
  const parsed = parse(source, fileName);
  const open = createPostkitObject(parsed);
  const found = property(parsed, open, key);
  const next = found
    ? insertListItem(parsed, literalOpen(parsed, found, '['), element)
    : insertListItem(parsed, open, `${key}: [${element}]`);
  parse(next, fileName);
  return next;
}

/** Removes the string `value` from the options' array `key`, if present. */
export function removeFromConfigArray(
  source: string,
  key: string,
  value: string,
  fileName?: string,
): string | undefined {
  const parsed = parse(source, fileName);
  const open = createPostkitObject(parsed);
  const found = property(parsed, open, key);
  if (!found) return undefined;
  const arrayOpen = literalOpen(parsed, found, '[');
  const item = listItems(parsed, arrayOpen).find(
    (entry) =>
      entry.first === entry.last &&
      parsed.tokens[entry.first].kind === 'string' &&
      parsed.tokens[entry.first].value === value,
  );
  if (!item) return undefined;
  const next = removeListItem(parsed, arrayOpen, item);
  parse(next, fileName);
  return next;
}

/** The string items of the options' array `key`, or `undefined`. */
export function readConfigStrings(
  source: string,
  key: string,
  fileName?: string,
): string[] | undefined {
  const parsed = parse(source, fileName);
  const open = createPostkitObject(parsed);
  const found = property(parsed, open, key);
  if (!found) return undefined;
  return listItems(parsed, literalOpen(parsed, found, '[')).map((item) => {
    const token = parsed.tokens[item.first];
    if (item.first !== item.last || token.kind !== 'string') {
      unsafe(`${key} has an item that isn't a string`);
    }
    return token.value;
  });
}

/** The identifiers in the options' array `key` (throws on anything else). */
export function readConfigIdentifiers(
  source: string,
  key: string,
  fileName?: string,
): string[] | undefined {
  const parsed = parse(source, fileName);
  const open = createPostkitObject(parsed);
  const found = property(parsed, open, key);
  if (!found) return undefined;
  return listItems(parsed, literalOpen(parsed, found, '[')).map((item) => {
    const token = parsed.tokens[item.first];
    if (item.first !== item.last || token.kind !== 'ident') {
      unsafe(`${key} has an item that isn't a plain identifier`);
    }
    return token.value;
  });
}

/**
 * The identifiers given as `definition` in the options' `components` array:
 * one per `{ definition: x, … }` (or `{ definition, … }`) item. Other items,
 * such as a component built elsewhere and passed by name, are skipped.
 */
export function readConfigComponentDefinitions(
  source: string,
  fileName?: string,
): string[] {
  const parsed = parse(source, fileName);
  const open = createPostkitObject(parsed);
  const found = property(parsed, open, 'components');
  if (!found) return [];
  const definitions: string[] = [];
  for (const item of listItems(parsed, literalOpen(parsed, found, '['))) {
    const token = parsed.tokens[item.first];
    if (
      token.kind !== 'punct' ||
      token.value !== '{' ||
      parsed.match.get(item.first) !== item.last
    ) {
      continue;
    }
    const definition = objectProperties(parsed, item.first).find(
      (entry) => entry.key === 'definition',
    );
    if (definition?.kind === 'shorthand') {
      definitions.push('definition');
    } else if (
      definition?.kind === 'property' &&
      definition.value === definition.item.last &&
      parsed.tokens[definition.value].kind === 'ident'
    ) {
      definitions.push(parsed.tokens[definition.value].value);
    }
  }
  return definitions;
}

/** The identifier the options' `key` is set to, `null` if unset. */
export function readConfigIdentifier(
  source: string,
  key: string,
  fileName?: string,
): string | null {
  const parsed = parse(source, fileName);
  const open = createPostkitObject(parsed);
  const found = objectProperties(parsed, open).find(
    (entry) => entry.key === key,
  );
  if (!found) {
    if (
      objectProperties(parsed, open).some((entry) => entry.kind === 'spread')
    ) {
      unsafe(`the options spread another object that may set ${key}`);
    }
    return null;
  }
  if (found.kind === 'shorthand') return key;
  if (found.kind !== 'property' || found.value !== found.item.last) {
    unsafe(`${key} isn't a plain identifier`);
  }
  const token = parsed.tokens[found.value];
  if (token.kind !== 'ident') unsafe(`${key} isn't a plain identifier`);
  return token.value;
}

/**
 * Sets `overrides.<name>.view` to `view`, creating `overrides` if absent.
 * An existing override for the component is left to the user.
 */
export function addViewOverride(
  source: string,
  name: string,
  view: string,
  fileName?: string,
): string {
  const parsed = parse(source, fileName);
  const open = createPostkitObject(parsed);
  const found = property(parsed, open, 'overrides');
  const entry = `${name}: { view: ${view} }`;
  let next: string;
  if (!found) {
    next = insertListItem(parsed, open, `overrides: { ${entry} }`);
  } else {
    const overridesOpen = literalOpen(parsed, found, '{');
    const existing = objectProperties(parsed, overridesOpen);
    if (existing.some((entry_) => entry_.key === name)) {
      unsafe(`overrides.${name} already exists`);
    }
    if (existing.some((entry_) => entry_.kind === 'spread')) {
      unsafe('overrides spreads another object');
    }
    next = insertListItem(parsed, overridesOpen, entry);
  }
  parse(next, fileName);
  return next;
}

interface ImportDeclaration {
  readonly module: string;
  readonly typeOnly: boolean;
  /** Imported name → local name, for `{ … }` specifiers. */
  readonly named: ReadonlyMap<string, string>;
  /** The token index of `{`, when the import has named specifiers. */
  readonly braceOpen?: number;
  readonly locals: readonly string[];
  readonly end: number;
  readonly quote: string;
  readonly semicolon: boolean;
}

function imports(parsed: Parsed): ImportDeclaration[] {
  const declarations: ImportDeclaration[] = [];
  const { tokens } = parsed;
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (token.kind !== 'ident' || token.value !== 'import') continue;
    const previous = tokens[index - 1];
    if (
      previous &&
      !(
        previous.kind === 'punct' &&
        (previous.value === ';' || previous.value === '}')
      ) &&
      !(previous.kind === 'string')
    ) {
      continue;
    }
    const next = tokens[index + 1];
    if (next?.kind === 'punct' && (next.value === '(' || next.value === '.')) {
      continue;
    }
    let cursor = index + 1;
    let typeOnly = false;
    if (tokens[cursor]?.kind === 'ident' && tokens[cursor].value === 'type') {
      const after = tokens[cursor + 1];
      if (!(after?.kind === 'ident' && after.value === 'from')) {
        typeOnly = true;
        cursor += 1;
      }
    }
    const named = new Map<string, string>();
    const locals: string[] = [];
    let braceOpen: number | undefined;
    while (cursor < tokens.length && tokens[cursor].kind !== 'string') {
      const current = tokens[cursor];
      if (current.kind === 'punct' && current.value === '{') {
        braceOpen = cursor;
        const close = parsed.match.get(cursor) as number;
        for (const item of listItems(parsed, cursor)) {
          const parts = tokens
            .slice(item.first, item.last + 1)
            .map((part) => part.value);
          const words =
            parts[0] === 'type' && parts.length > 1 ? parts.slice(1) : parts;
          const imported = words[0];
          const local = words[1] === 'as' ? words[2] : words[0];
          named.set(imported, local);
          locals.push(local);
        }
        cursor = close + 1;
        continue;
      }
      if (
        current.kind === 'ident' &&
        current.value !== 'from' &&
        current.value !== 'as'
      ) {
        locals.push(current.value);
      }
      cursor += 1;
    }
    const moduleToken = tokens[cursor];
    if (!moduleToken) break;
    const semicolon =
      tokens[cursor + 1]?.kind === 'punct' && tokens[cursor + 1].value === ';';
    declarations.push({
      module: moduleToken.value,
      typeOnly,
      named,
      braceOpen,
      locals,
      end: semicolon ? tokens[cursor + 1].end : moduleToken.end,
      quote: parsed.source[moduleToken.start],
      semicolon,
    });
    index = cursor;
  }
  return declarations;
}

/** The local name a module's named export is imported as, if it is. */
export function importedLocalName(
  source: string,
  module: string,
  name: string,
  fileName?: string,
): string | undefined {
  const parsed = parse(source, fileName);
  for (const declaration of imports(parsed)) {
    if (declaration.module === module && !declaration.typeOnly) {
      const local = declaration.named.get(name);
      if (local) return local;
    }
  }
  return undefined;
}

/** Every module a local name is imported from, keyed by local name. */
export function importedNames(
  source: string,
  fileName?: string,
): Map<string, { module: string; imported: string }> {
  const parsed = parse(source, fileName);
  const names = new Map<string, { module: string; imported: string }>();
  for (const declaration of imports(parsed)) {
    for (const [imported, local] of declaration.named) {
      names.set(local, { module: declaration.module, imported });
    }
  }
  return names;
}

/**
 * Imports `name` from `module` (merging into an existing named import), and
 * returns the new source. Throws when `name` is already bound to something
 * else in the file.
 */
export function ensureNamedImport(
  source: string,
  module: string,
  name: string,
  fileName?: string,
): string {
  const parsed = parse(source, fileName);
  const declarations = imports(parsed);
  if (importedLocalName(source, module, name, fileName) === name) return source;
  if (
    parsed.tokens.some(
      (token) => token.kind === 'ident' && token.value === name,
    )
  ) {
    unsafe(`${name} is already used in the file`);
  }
  const existing = declarations.find(
    (declaration) =>
      declaration.module === module &&
      !declaration.typeOnly &&
      declaration.braceOpen !== undefined,
  );
  let next: string;
  if (existing && existing.braceOpen !== undefined) {
    next = insertListItem(parsed, existing.braceOpen, name);
  } else {
    const last = declarations[declarations.length - 1];
    const quote = last?.quote ?? "'";
    const semicolon = last ? last.semicolon : true;
    const line = `import { ${name} } from ${quote}${module}${quote}${semicolon ? ';' : ''}`;
    next = last
      ? `${source.slice(0, last.end)}\n${line}${source.slice(last.end)}`
      : `${line}\n${source}`;
  }
  parse(next, fileName);
  return next;
}

/** Whether `source` can be read by this scanner (used before editing). */
export function canEditPostkitConfig(
  source: string,
  fileName?: string,
): boolean {
  try {
    createPostkitObject(parse(source, fileName));
    return true;
  } catch (error) {
    if (error instanceof PostkitUnsafeSourceError) return false;
    throw error;
  }
}

/** Why a source can't be edited, or `undefined` if it can. */
export function postkitConfigProblem(
  source: string,
  fileName?: string,
): string | undefined {
  try {
    createPostkitObject(parse(source, fileName));
    return undefined;
  } catch (error) {
    if (error instanceof PostkitUnsafeSourceError) return error.message;
    throw error;
  }
}

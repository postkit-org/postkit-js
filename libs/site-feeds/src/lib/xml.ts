/**
 * A small, strict XML 1.0 reader for checking the feeds we write. It covers what feeds use
 * (the declaration, elements, attributes, text, CDATA, comments and the five predefined
 * entities plus character references) and fails on anything malformed. It is not a general
 * XML parser: DTDs and custom entities are rejected.
 */

export interface XmlElement {
  readonly name: string;
  readonly attributes: Readonly<Record<string, string>>;
  readonly children: readonly (XmlElement | string)[];
}

export class XmlSyntaxError extends Error {
  constructor(message: string, offset: number) {
    super(`${message} (at offset ${offset})`);
    this.name = 'XmlSyntaxError';
  }
}

const namePattern = /[A-Za-z_][\w.:-]*/y;
const predefined: Readonly<Record<string, string>> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
};

function decodeEntities(value: string, offset: number): string {
  return value.replace(/&([^;&\s]*);?/g, (match, body: string) => {
    if (!match.endsWith(';')) {
      throw new XmlSyntaxError('Unescaped "&"', offset);
    }
    if (body in predefined) return predefined[body];
    const code = /^#x([0-9a-f]+)$/i.test(body)
      ? Number.parseInt(body.slice(2), 16)
      : /^#\d+$/.test(body)
        ? Number.parseInt(body.slice(1), 10)
        : Number.NaN;
    if (Number.isNaN(code)) {
      throw new XmlSyntaxError(`Unknown entity "&${body};"`, offset);
    }
    return String.fromCodePoint(code);
  });
}

interface MutableElement {
  name: string;
  attributes: Record<string, string>;
  children: (MutableElement | string)[];
}

export function parseXml(source: string): XmlElement {
  let index = 0;
  let root: MutableElement | undefined;
  const stack: MutableElement[] = [];

  const fail = (message: string): never => {
    throw new XmlSyntaxError(message, index);
  };
  const readName = (): string => {
    namePattern.lastIndex = index;
    const match = namePattern.exec(source);
    if (!match) fail('Expected a name');
    index = namePattern.lastIndex;
    return (match as RegExpExecArray)[0];
  };
  const skipSpace = () => {
    while (/\s/.test(source[index] ?? '')) index += 1;
  };
  const until = (terminator: string): string => {
    const end = source.indexOf(terminator, index);
    if (end === -1) fail(`Missing "${terminator}"`);
    const value = source.slice(index, end);
    index = end + terminator.length;
    return value;
  };
  const appendText = (text: string) => {
    const parent = stack.at(-1);
    if (parent) parent.children.push(text);
    else if (text.trim() !== '') fail('Text outside the root element');
  };

  if (source.startsWith('<?xml')) {
    index = 5;
    until('?>');
  }

  while (index < source.length) {
    if (source.startsWith('<!--', index)) {
      index += 4;
      until('-->');
    } else if (source.startsWith('<![CDATA[', index)) {
      if (stack.length === 0) fail('CDATA outside the root element');
      index += 9;
      appendText(until(']]>'));
    } else if (source.startsWith('<!', index)) {
      fail('DTDs and declarations are not supported');
    } else if (source.startsWith('<?', index)) {
      index += 2;
      until('?>');
    } else if (source.startsWith('</', index)) {
      index += 2;
      const name = readName();
      skipSpace();
      if (source[index] !== '>') fail(`Malformed end tag </${name}>`);
      index += 1;
      const open = stack.pop();
      if (!open || open.name !== name) {
        fail(`Unexpected </${name}>${open ? ` (open: <${open.name}>)` : ''}`);
      }
    } else if (source[index] === '<') {
      index += 1;
      const element: MutableElement = {
        name: readName(),
        attributes: {},
        children: [],
      };
      for (;;) {
        const before = index;
        skipSpace();
        if (source.startsWith('/>', index) || source[index] === '>') break;
        if (index === before) fail('Expected whitespace before an attribute');
        const attribute = readName();
        skipSpace();
        if (source[index] !== '=')
          fail(`Attribute "${attribute}" has no value`);
        index += 1;
        skipSpace();
        const quote = source[index];
        if (quote !== '"' && quote !== "'") fail('Unquoted attribute value');
        index += 1;
        const raw = until(quote as string);
        if (raw.includes('<')) fail('"<" in an attribute value');
        if (attribute in element.attributes) {
          fail(`Duplicate attribute "${attribute}"`);
        }
        element.attributes[attribute] = decodeEntities(raw, index);
      }
      const selfClosing = source.startsWith('/>', index);
      index += selfClosing ? 2 : 1;
      const parent = stack.at(-1);
      if (parent) parent.children.push(element);
      else if (root) fail('More than one root element');
      else root = element;
      if (!selfClosing) stack.push(element);
    } else {
      const end = source.indexOf('<', index);
      const raw = source.slice(index, end === -1 ? source.length : end);
      const text = decodeEntities(raw, index);
      if (raw.includes(']]>')) fail('"]]>" in text');
      index += raw.length;
      appendText(text);
    }
  }

  if (stack.length > 0) fail(`Unclosed <${stack.at(-1)?.name}>`);
  if (!root) fail('No root element');
  return root as XmlElement;
}

/** Direct child elements, optionally by name. */
export function childElements(
  element: XmlElement,
  name?: string,
): XmlElement[] {
  return element.children.filter(
    (child): child is XmlElement =>
      typeof child !== 'string' && (name === undefined || child.name === name),
  );
}

/** The element's text, with CDATA, and descendants' text, joined. */
export function textContent(element: XmlElement): string {
  return element.children
    .map((child) => (typeof child === 'string' ? child : textContent(child)))
    .join('');
}

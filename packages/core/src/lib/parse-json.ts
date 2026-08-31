import {
  POSTKIT_DOCUMENT_VERSION,
  type PostkitAttributeValue,
  type PostkitDocument,
  type PostkitJsonValue,
  type PostkitNode,
} from './document.js';
import { PostkitParseError } from './parse-error.js';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseJsonValue(value: unknown, path: string): PostkitJsonValue {
  if (
    value === null ||
    typeof value === 'boolean' ||
    typeof value === 'string'
  ) {
    return value;
  }
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (Array.isArray(value)) {
    return value.map((item, index) =>
      parseJsonValue(item, `${path}[${index}]`),
    );
  }
  if (isRecord(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        parseJsonValue(item, `${path}.${key}`),
      ]),
    );
  }
  throw new PostkitParseError(
    'invalid-document',
    `${path} must contain JSON-compatible values.`,
  );
}

function parseAttributeValue(
  value: unknown,
  path: string,
): PostkitAttributeValue {
  const parsed = parseJsonValue(value, path);
  if (
    typeof parsed === 'boolean' ||
    typeof parsed === 'number' ||
    typeof parsed === 'string'
  ) {
    return parsed;
  }
  if (
    Array.isArray(parsed) &&
    parsed.every(
      (item): item is number | string =>
        typeof item === 'number' || typeof item === 'string',
    )
  ) {
    return parsed;
  }
  throw new PostkitParseError(
    'invalid-document',
    `${path} must be a scalar or an array of strings and numbers.`,
  );
}

function parseChildren(value: unknown, path: string): readonly PostkitNode[] {
  if (!Array.isArray(value)) {
    throw new PostkitParseError(
      'invalid-document',
      `${path} must be an array.`,
    );
  }
  return value.map((child, index) => parseNode(child, `${path}[${index}]`));
}

function parseNode(value: unknown, path: string): PostkitNode {
  if (!isRecord(value)) {
    throw new PostkitParseError(
      'invalid-document',
      `${path} must be a node object.`,
    );
  }
  if (value['type'] === 'text') {
    if (typeof value['value'] !== 'string') {
      throw new PostkitParseError(
        'invalid-document',
        `${path}.value must be a string.`,
      );
    }
    return { type: 'text', value: value['value'] };
  }
  if (value['type'] === 'element') {
    if (typeof value['name'] !== 'string' || value['name'].length === 0) {
      throw new PostkitParseError(
        'invalid-document',
        `${path}.name must be a non-empty string.`,
      );
    }
    const attributes = isRecord(value['attributes'])
      ? Object.fromEntries(
          Object.entries(value['attributes']).map(([key, item]) => [
            key,
            parseAttributeValue(item, `${path}.attributes.${key}`),
          ]),
        )
      : undefined;
    return {
      type: 'element',
      name: value['name'],
      ...(attributes && Object.keys(attributes).length > 0
        ? { attributes }
        : {}),
      children: parseChildren(value['children'], `${path}.children`),
    };
  }
  if (value['type'] === 'component') {
    if (typeof value['name'] !== 'string' || value['name'].length === 0) {
      throw new PostkitParseError(
        'invalid-document',
        `${path}.name must be a non-empty string.`,
      );
    }
    const props = isRecord(value['props'])
      ? (parseJsonValue(value['props'], `${path}.props`) as Record<
          string,
          PostkitJsonValue
        >)
      : undefined;
    return {
      type: 'component',
      name: value['name'],
      ...(props && Object.keys(props).length > 0 ? { props } : {}),
      children: parseChildren(value['children'], `${path}.children`),
    };
  }
  throw new PostkitParseError(
    'invalid-document',
    `${path}.type must be text, element, or component.`,
  );
}

export function parsePostkitJson(source: string | unknown): PostkitDocument {
  let value: unknown = source;
  if (typeof source === 'string') {
    try {
      value = JSON.parse(source) as unknown;
    } catch (error) {
      throw new PostkitParseError('invalid-json', 'Invalid Postkit JSON.', {
        cause: error,
      });
    }
  }
  if (
    !isRecord(value) ||
    value['type'] !== 'document' ||
    value['version'] !== POSTKIT_DOCUMENT_VERSION
  ) {
    throw new PostkitParseError(
      'invalid-document',
      `Postkit JSON must be a version ${POSTKIT_DOCUMENT_VERSION} document.`,
    );
  }
  return {
    type: 'document',
    version: POSTKIT_DOCUMENT_VERSION,
    children: parseChildren(value['children'], 'document.children'),
  };
}

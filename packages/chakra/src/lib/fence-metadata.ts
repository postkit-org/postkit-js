export interface PostkitFenceMetadata {
  readonly filename?: string;
  readonly highlightLines?: string;
  readonly lineNumbers?: boolean;
  readonly maxHeight?: number | string;
  readonly wrap?: boolean;
}

export interface PostkitFenceMetadataAttributes {
  readonly filename?: unknown;
  readonly highlightLines?: unknown;
  readonly lineNumbers?: unknown;
  readonly maxHeight?: unknown;
  readonly meta?: unknown;
  readonly title?: unknown;
  readonly wrap?: unknown;
}

const fenceMetaAttributePattern =
  /(?:^|\s)([A-Za-z][\w-]*)(?:=(?:"([^"]*)"|'([^']*)'|([^\s]+)))?/g;
const highlightedLinesPattern = /(?:^|\s)\{([\d,\s-]+)\}(?=\s|$)/;
const safeMaxHeightPattern = /^\d+(?:\.\d+)?(?:px|r?em|ch|%|d?vh|svh|lvh)$/i;

function metadataBoolean(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') return value;
  if (typeof value !== 'string') return undefined;

  const normalized = value.trim().toLowerCase();
  if (['false', '0', 'off', 'no'].includes(normalized)) return false;
  return true;
}

function metadataString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function metadataMaxHeight(value: unknown): number | string | undefined {
  if (typeof value === 'number') {
    return Number.isFinite(value) && value >= 0 ? value : undefined;
  }
  if (typeof value !== 'string') return undefined;

  const normalized = value.trim();
  if (/^\d+(?:\.\d+)?$/.test(normalized)) return Number(normalized);
  return safeMaxHeightPattern.test(normalized) ? normalized : undefined;
}

function normalizedMetaKey(value: string) {
  return value.replaceAll('-', '').toLowerCase();
}

export function parsePostkitFenceMeta(value: unknown): PostkitFenceMetadata {
  if (typeof value !== 'string' || !value.trim()) return {};

  let filename: string | undefined;
  let highlightLines = value.match(highlightedLinesPattern)?.[1]?.trim();
  let lineNumbers: boolean | undefined;
  let maxHeight: number | string | undefined;
  let wrap: boolean | undefined;

  for (const match of value.matchAll(fenceMetaAttributePattern)) {
    const key = normalizedMetaKey(match[1]);
    const attributeValue = match[2] ?? match[3] ?? match[4];

    switch (key) {
      case 'filename':
      case 'title':
        filename = metadataString(attributeValue) ?? filename;
        break;
      case 'highlight':
      case 'highlightlines':
        highlightLines = metadataString(attributeValue) ?? highlightLines;
        break;
      case 'linenumbers':
      case 'showlinenumbers':
        lineNumbers =
          attributeValue === undefined ? true : metadataBoolean(attributeValue);
        break;
      case 'nolinenumbers':
        lineNumbers = false;
        break;
      case 'maxheight':
        maxHeight = metadataMaxHeight(attributeValue) ?? maxHeight;
        break;
      case 'wrap':
      case 'wordwrap':
        wrap =
          attributeValue === undefined ? true : metadataBoolean(attributeValue);
        break;
      case 'nowrap':
        wrap = false;
        break;
    }
  }

  return { filename, highlightLines, lineNumbers, maxHeight, wrap };
}

export function resolvePostkitFenceMetadata(
  primary: PostkitFenceMetadataAttributes,
  secondary: PostkitFenceMetadataAttributes = {},
): PostkitFenceMetadata {
  const parsed = parsePostkitFenceMeta(primary.meta ?? secondary.meta);

  return {
    filename:
      metadataString(primary.filename) ??
      metadataString(primary.title) ??
      metadataString(secondary.filename) ??
      metadataString(secondary.title) ??
      parsed.filename,
    highlightLines:
      metadataString(primary.highlightLines) ??
      metadataString(secondary.highlightLines) ??
      parsed.highlightLines,
    lineNumbers:
      metadataBoolean(primary.lineNumbers) ??
      metadataBoolean(secondary.lineNumbers) ??
      parsed.lineNumbers,
    maxHeight:
      metadataMaxHeight(primary.maxHeight) ??
      metadataMaxHeight(secondary.maxHeight) ??
      parsed.maxHeight,
    wrap:
      metadataBoolean(primary.wrap) ??
      metadataBoolean(secondary.wrap) ??
      parsed.wrap,
  };
}

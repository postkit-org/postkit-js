/*
 * Prop readers for the email views. Authored props arrive as parsed values
 * (JSX, `renderEmail`) or as directive text (`items='[…]'`), so each reader
 * takes either and never throws.
 */

/** Text, or a finite number as text. Blank strings count as missing. */
export function emailText(value: unknown): string | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

/** A number, or numeric text. */
export function emailNumber(value: unknown): number | undefined {
  const parsed =
    typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
  return typeof parsed === 'number' && Number.isFinite(parsed)
    ? parsed
    : undefined;
}

/** A `json` prop: the value, or authored JSON text parsed. Invalid JSON is missing. */
export function emailJson(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return undefined;
  }
}

export type EmailRecord = Readonly<Record<string, unknown>>;

export function emailRecord(value: unknown): EmailRecord | undefined {
  const parsed = emailJson(value);
  return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
    ? (parsed as EmailRecord)
    : undefined;
}

/** A JSON array prop's items; anything else is empty. */
export function emailList(value: unknown): readonly unknown[] {
  const parsed = emailJson(value);
  return Array.isArray(parsed) ? parsed : [];
}

/** The first of `keys` on `item` that holds text. */
export function emailField(
  item: unknown,
  ...keys: readonly string[]
): string | undefined {
  const source = emailRecord(item);
  if (!source) return undefined;
  for (const key of keys) {
    const value = emailText(source[key]);
    if (value !== undefined) return value;
  }
  return undefined;
}

/** `https://www.example.com/a` → `example.com`; anything else has none. */
export function emailDomain(href: string | undefined): string | undefined {
  if (!href) return undefined;
  try {
    const url = new URL(href);
    return url.protocol === 'http:' || url.protocol === 'https:'
      ? url.hostname.replace(/^www\./, '')
      : undefined;
  } catch {
    return undefined;
  }
}

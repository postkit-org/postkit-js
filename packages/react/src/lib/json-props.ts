/**
 * A JSON-array prop: an array as given, or authored JSON text parsed into one.
 * Throws a `TypeError` naming the prop for invalid JSON or a non-array.
 *
 * @internal
 */
export function parsePostkitJsonArray<T>(
  value: string | readonly T[],
  propName: string,
): readonly T[] {
  if (typeof value !== 'string') return value;

  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new TypeError(`Postkit ${propName} must contain valid JSON.`);
  }

  if (!Array.isArray(parsed)) {
    throw new TypeError(`Postkit ${propName} must contain a JSON array.`);
  }

  return parsed as readonly T[];
}

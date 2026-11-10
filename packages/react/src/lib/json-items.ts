/**
 * Reads a `json` items prop: an array as given, or authored JSON text that
 * must parse to an array. Throws a `TypeError` naming the prop otherwise, the
 * same error the Chakra views throw.
 *
 * @internal
 */
export function postkitJsonItems<Item>(
  value: unknown,
  propName: string,
): readonly Item[] {
  if (Array.isArray(value)) return value as readonly Item[];
  if (value === undefined || value === null) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(String(value));
  } catch {
    throw new TypeError(`Postkit ${propName} must contain valid JSON.`);
  }
  if (!Array.isArray(parsed)) {
    throw new TypeError(`Postkit ${propName} must contain a JSON array.`);
  }
  return parsed as readonly Item[];
}

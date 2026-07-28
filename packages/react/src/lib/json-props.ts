export function parseJsonProp<T>(
  value: string | readonly T[],
  propName: string,
): readonly T[] {
  if (typeof value !== 'string') {
    return value;
  }

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

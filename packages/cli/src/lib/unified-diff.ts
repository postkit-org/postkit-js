type Operation = readonly [' ' | '+' | '-', string];

function splitLines(text: string): string[] {
  if (text === '') return [];
  const lines = text.split('\n');
  if (lines[lines.length - 1] === '') lines.pop();
  return lines;
}

/** Line operations from `a` to `b` (longest common subsequence). */
function diffLines(a: readonly string[], b: readonly string[]): Operation[] {
  let prefix = 0;
  while (prefix < a.length && prefix < b.length && a[prefix] === b[prefix]) {
    prefix += 1;
  }
  let suffix = 0;
  while (
    suffix < a.length - prefix &&
    suffix < b.length - prefix &&
    a[a.length - 1 - suffix] === b[b.length - 1 - suffix]
  ) {
    suffix += 1;
  }
  const midA = a.slice(prefix, a.length - suffix);
  const midB = b.slice(prefix, b.length - suffix);
  const rows = midA.length + 1;
  const columns = midB.length + 1;
  const table = new Uint32Array(rows * columns);
  for (let i = midA.length - 1; i >= 0; i -= 1) {
    for (let j = midB.length - 1; j >= 0; j -= 1) {
      table[i * columns + j] =
        midA[i] === midB[j]
          ? table[(i + 1) * columns + j + 1] + 1
          : Math.max(table[(i + 1) * columns + j], table[i * columns + j + 1]);
    }
  }
  const operations: Operation[] = a
    .slice(0, prefix)
    .map((line): Operation => [' ', line]);
  let i = 0;
  let j = 0;
  while (i < midA.length || j < midB.length) {
    if (i < midA.length && j < midB.length && midA[i] === midB[j]) {
      operations.push([' ', midA[i]]);
      i += 1;
      j += 1;
    } else if (
      i < midA.length &&
      (j >= midB.length ||
        table[(i + 1) * columns + j] >= table[i * columns + j + 1])
    ) {
      operations.push(['-', midA[i]]);
      i += 1;
    } else {
      operations.push(['+', midB[j]]);
      j += 1;
    }
  }
  for (const line of a.slice(a.length - suffix)) operations.push([' ', line]);
  return operations;
}

/**
 * A unified diff (`diff -u` format, three lines of context) from `before` to
 * `after`, or `''` when they're equal.
 */
export function unifiedDiff(
  before: string,
  after: string,
  labels: { readonly from: string; readonly to: string },
  context = 3,
): string {
  if (before === after) return '';
  const operations = diffLines(splitLines(before), splitLines(after));
  const changed = operations
    .map((operation, index) => (operation[0] === ' ' ? -1 : index))
    .filter((index) => index >= 0);
  if (changed.length === 0) return '';

  // Group changes whose context overlaps into hunks.
  const hunks: Array<[number, number]> = [];
  for (const index of changed) {
    const start = Math.max(0, index - context);
    const end = Math.min(operations.length - 1, index + context);
    const last = hunks[hunks.length - 1];
    if (last && start <= last[1] + 1) last[1] = end;
    else hunks.push([start, end]);
  }

  const lines = [`--- ${labels.from}`, `+++ ${labels.to}`];
  for (const [start, end] of hunks) {
    let oldLine = 1;
    let newLine = 1;
    for (let index = 0; index < start; index += 1) {
      if (operations[index][0] !== '+') oldLine += 1;
      if (operations[index][0] !== '-') newLine += 1;
    }
    const slice = operations.slice(start, end + 1);
    const oldCount = slice.filter((operation) => operation[0] !== '+').length;
    const newCount = slice.filter((operation) => operation[0] !== '-').length;
    lines.push(
      `@@ -${oldCount === 0 ? oldLine - 1 : oldLine},${oldCount} +${newCount === 0 ? newLine - 1 : newLine},${newCount} @@`,
    );
    for (const [mark, text] of slice) lines.push(`${mark}${text}`);
  }
  return `${lines.join('\n')}\n`;
}

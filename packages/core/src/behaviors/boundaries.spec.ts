import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const sourceRoot = join(__dirname, '..');

function sources(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return sources(path);
    return entry.name.endsWith('.ts') && !entry.name.includes('.spec')
      ? [path]
      : [];
  });
}

describe('@postkit/core/behaviors boundaries', () => {
  it('keeps Zag out of the root and components entries', () => {
    const offenders = sources(sourceRoot)
      .filter((path) => !relative(sourceRoot, path).startsWith('behaviors'))
      .filter((path) => {
        const source = readFileSync(path, 'utf8');
        return (
          /from '@zag-js\//.test(source) ||
          /from '(\.\.?\/)+behaviors/.test(source)
        );
      })
      .map((path) => relative(sourceRoot, path));
    expect(offenders).toEqual([]);
  });

  it('keeps UI frameworks out of the behaviours', () => {
    const offenders = sources(join(sourceRoot, 'behaviors'))
      .filter((path) =>
        /from '(react|react-dom|@chakra-ui\/[^']+|@ark-ui\/[^']+|vitest)'/.test(
          readFileSync(path, 'utf8'),
        ),
      )
      .map((path) => relative(sourceRoot, path));
    expect(offenders).toEqual([]);
  });
});

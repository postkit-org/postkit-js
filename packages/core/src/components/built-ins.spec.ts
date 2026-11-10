import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expectTypeOf } from 'vitest';
import {
  calloutDefinition,
  postkitBuiltInDefinitions,
  presentation,
  type PostkitBuiltInComponentName,
} from './index.js';

const componentsDirectory = fileURLToPath(new URL('.', import.meta.url));

function kebab(name: string): string {
  return name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? sourceFiles(join(directory, entry.name))
      : entry.name.endsWith('.ts') && !entry.name.endsWith('.spec.ts')
        ? [join(directory, entry.name)]
        : [],
  );
}

describe('Postkit built-in definitions', () => {
  const definitions = Object.entries(postkitBuiltInDefinitions);

  it('defines all 35 built-in components, keyed by name', () => {
    expect(definitions).toHaveLength(35);
    for (const [key, definition] of definitions) {
      expect(definition.name).toBe(key);
      expect(Object.isFrozen(definition)).toBe(true);
    }
    expect(Object.isFrozen(postkitBuiltInDefinitions)).toBe(true);
  });

  it('keeps one definition file per component and kebab-case directives', () => {
    const directives = new Set<string>();
    for (const [name, definition] of definitions) {
      const file = kebab(name);
      expect(
        readFileSync(
          join(componentsDirectory, file, `${file}.definition.ts`),
          'utf8',
        ),
      ).toContain(`name: '${name}'`);
      expect(definition.directive).toBe(`postkit-${file}`);
      directives.add(definition.directive);
    }
    expect(directives.size).toBe(definitions.length);
  });

  it('gives every component the presentation props, a root slot and an example', () => {
    for (const [, definition] of definitions) {
      expect(Object.keys(definition.props).slice(0, 2)).toEqual([
        'size',
        'variant',
      ]);
      expect(definition.props.size).toBe(presentation.size);
      expect(definition.props.variant).toBe(presentation.variant);
      expect(definition.slots[0]).toBe('root');
      expect(definition.themeVariants.slice(0, 2)).toEqual(['size', 'variant']);
      expect(definition.example).toBeDefined();
      for (const [propName, prop] of Object.entries(definition.props)) {
        if (prop.required) {
          expect(definition.example?.props).toHaveProperty(propName);
        }
      }
    }
  });

  it('stays framework-free (F6)', () => {
    for (const file of sourceFiles(componentsDirectory)) {
      const source = readFileSync(file, 'utf8');
      expect(source).not.toMatch(/from ['"](react|@chakra-ui|@emotion)/);
    }
  });

  it('types the built-in names and definitions', () => {
    expectTypeOf<PostkitBuiltInComponentName>().toExtend<string>();
    expectTypeOf<'Callout'>().toExtend<PostkitBuiltInComponentName>();
    expectTypeOf(postkitBuiltInDefinitions.Callout).toEqualTypeOf(
      calloutDefinition,
    );
  });
});

import { expectTypeOf } from 'vitest';
import {
  presentation,
  prop,
  type PostkitBooleanPropDefinition,
  type PostkitEnumPropDefinition,
  type PostkitJsonPropDefinition,
  type PostkitNumberPropDefinition,
  type PostkitPropValueOf,
  type PostkitStringPropDefinition,
} from './index.js';

describe('Postkit prop builders', () => {
  it('builds each prop kind with explicit required and themeVariant flags', () => {
    expect(prop.string('A title.')).toEqual({
      kind: 'string',
      description: 'A title.',
      required: false,
      themeVariant: false,
    });
    expect(prop.number('A count.', { default: 0 })).toEqual({
      kind: 'number',
      description: 'A count.',
      required: false,
      themeVariant: false,
      default: 0,
    });
    expect(
      prop.boolean('Open.', { default: false, themeVariant: true }),
    ).toEqual({
      kind: 'boolean',
      description: 'Open.',
      required: false,
      themeVariant: true,
      default: false,
    });
    expect(prop.json('Items.', { required: true })).toEqual({
      kind: 'json',
      description: 'Items.',
      required: true,
      themeVariant: false,
    });
    expect(prop.enum(['a', 'b'], 'A choice.')).toEqual({
      kind: 'enum',
      values: ['a', 'b'],
      description: 'A choice.',
      required: false,
      themeVariant: false,
    });
    expect(
      prop.enum(['a', 'b'], {
        description: 'A choice.',
        default: 'b',
        required: true,
        themeVariant: true,
      }),
    ).toEqual({
      kind: 'enum',
      values: ['a', 'b'],
      description: 'A choice.',
      required: true,
      themeVariant: true,
      default: 'b',
    });
  });

  it('returns deeply frozen props that do not share caller data', () => {
    const values = ['a', 'b'];
    const fallback = [{ title: 'First' }];
    const choice = prop.enum(values, 'A choice.');
    const items = prop.json('Items.', { default: fallback });

    values.push('c');
    fallback[0].title = 'Changed';

    expect(choice.values).toEqual(['a', 'b']);
    expect(items.default).toEqual([{ title: 'First' }]);
    expect(Object.isFrozen(choice)).toBe(true);
    expect(Object.isFrozen(choice.values)).toBe(true);
    expect(Object.isFrozen(items.default)).toBe(true);
    expect(Object.isFrozen((items.default as { title: string }[])[0])).toBe(
      true,
    );
    expect(() => {
      (choice as { description: string }).description = 'Changed';
    }).toThrow(TypeError);
  });

  it('rejects invalid descriptions, enum values and defaults', () => {
    expect(() => prop.string('')).toThrow('non-empty description');
    expect(() => prop.enum([], 'Empty.')).toThrow('at least one value');
    expect(() => prop.enum(['a', 'a'], 'Duplicate.')).toThrow('unique');
    expect(() => prop.enum(['a', ''], 'Blank.')).toThrow('non-empty strings');
    expect(() =>
      prop.enum(['a'], {
        description: 'Bad default.',
        default: 'b' as 'a',
      }),
    ).toThrow("isn't one of a");
    expect(() =>
      prop.number('Bad default.', { default: '1' as unknown as number }),
    ).toThrow("can't default to");
  });

  it('shares the presentation props with D12 defaults', () => {
    expect(Object.keys(presentation)).toEqual(['size', 'variant']);
    expect(presentation.size).toMatchObject({
      values: ['sm', 'md', 'lg'],
      default: 'md',
      themeVariant: true,
    });
    expect(presentation.variant).toMatchObject({
      values: ['outline', 'subtle', 'plain'],
      default: 'subtle',
      themeVariant: true,
    });
    expect(Object.isFrozen(presentation)).toBe(true);
  });

  it('infers literal prop types', () => {
    expectTypeOf(prop.string('A title.')).toEqualTypeOf<
      PostkitStringPropDefinition<false>
    >();
    expectTypeOf(prop.string('A title.', { required: true })).toEqualTypeOf<
      PostkitStringPropDefinition<true>
    >();
    expectTypeOf(prop.number('A count.')).toEqualTypeOf<
      PostkitNumberPropDefinition<false>
    >();
    expectTypeOf(prop.boolean('Open.', { themeVariant: true })).toEqualTypeOf<
      PostkitBooleanPropDefinition<false, true>
    >();
    expectTypeOf(
      prop.enum(['note', 'tip'], { description: 'Tone.', default: 'note' }),
    ).toEqualTypeOf<PostkitEnumPropDefinition<'note' | 'tip', false, false>>();
    expectTypeOf(
      prop.json<readonly { title: string }[]>('Items.'),
    ).toEqualTypeOf<
      PostkitJsonPropDefinition<readonly { title: string }[], false>
    >();
    expectTypeOf<
      PostkitPropValueOf<typeof presentation.variant>
    >().toEqualTypeOf<'outline' | 'subtle' | 'plain'>();

    expect(() =>
      // @ts-expect-error An enum default must be one of its values.
      prop.enum(['note', 'tip'], { description: 'Tone.', default: 'warning' }),
    ).toThrow(TypeError);
    expectTypeOf(
      prop.json<readonly string[]>('Items.', { required: true }),
    ).toEqualTypeOf<PostkitJsonPropDefinition<readonly string[], true>>();
  });
});

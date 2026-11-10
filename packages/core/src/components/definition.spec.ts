import { expectTypeOf } from 'vitest';
import {
  definePostkitComponent,
  presentation,
  prop,
  type AnyPostkitComponentDefinition,
  type PostkitPropNameOf,
  type PostkitPropsOf,
  type PostkitRecipeKeyOf,
  type PostkitSlotOf,
  type PostkitThemeKeyOf,
  type PostkitThemeVariantOf,
} from './index.js';

function defineCallout() {
  return definePostkitComponent({
    name: 'Callout',
    directive: 'postkit-callout',
    category: 'article-structure',
    description: 'A highlighted note, tip, warning, or caution.',
    children: 'mdx',
    props: {
      ...presentation,
      title: prop.string('An optional heading.'),
      tone: prop.enum(['note', 'tip', 'warning'], {
        description: 'The semantic emphasis.',
        default: 'note',
        themeVariant: true,
      }),
      items: prop.json<readonly string[]>('Bullets.', { required: true }),
      open: prop.boolean('Whether it starts open.'),
    },
    slots: ['root', 'icon', 'title', 'body'],
    keywords: ['admonition'],
    example: {
      props: { tone: 'tip', items: ['One'] },
      children: 'Keep the content.',
    },
  });
}

describe('definePostkitComponent', () => {
  it('returns the definition with defaults filled in', () => {
    const definition = definePostkitComponent({
      name: 'Stat',
      directive: 'postkit-stat',
      category: 'technical-content',
      description: 'A prominent metric.',
      props: { value: prop.string('The value.', { required: true }) },
      slots: ['root', 'value'],
    });

    expect(definition).toEqual({
      name: 'Stat',
      directive: 'postkit-stat',
      category: 'technical-content',
      description: 'A prominent metric.',
      children: 'none',
      runtime: 'static',
      stability: 'initial',
      props: { value: prop.string('The value.', { required: true }) },
      slots: ['root', 'value'],
      themeVariants: [],
      keywords: [],
    });
    expect(definition).not.toHaveProperty('example');
  });

  it('lists theme-variant props in prop order', () => {
    expect(defineCallout().themeVariants).toEqual(['size', 'variant', 'tone']);
  });

  it('is deeply frozen and independent of its input', () => {
    const slots = ['root', 'body'];
    const example = { props: { label: 'Example' } };
    const definition = definePostkitComponent({
      name: 'Badge',
      directive: 'postkit-badge',
      category: 'publishing',
      description: 'A badge.',
      props: { label: prop.string('The label.') },
      slots,
      example,
    });

    slots.push('extra');
    example.props.label = 'Changed';

    expect(definition.slots).toEqual(['root', 'body']);
    expect(definition.example?.props).toEqual({ label: 'Example' });
    for (const value of [
      definition,
      definition.props,
      definition.props.label,
      definition.slots,
      definition.themeVariants,
      definition.keywords,
      definition.example,
      definition.example?.props,
    ]) {
      expect(Object.isFrozen(value)).toBe(true);
    }
    expect(() => {
      (definition as { name: string }).name = 'Changed';
    }).toThrow(TypeError);
    expect(() => {
      (definition.slots as string[]).push('extra');
    }).toThrow(TypeError);
  });

  it('validates the definition', () => {
    const valid = {
      name: 'Badge',
      directive: 'postkit-badge',
      category: 'publishing',
      description: 'A badge.',
      props: { label: prop.string('The label.') },
      slots: ['root'],
    } as const;
    const define = (overrides: Record<string, unknown>) => () =>
      definePostkitComponent({ ...valid, ...overrides } as never);

    expect(define({})).not.toThrow();
    expect(define({ name: 'badge' })).toThrow('PascalCase');
    expect(define({ directive: 'Postkit Badge' })).toThrow('kebab-case');
    expect(define({ category: 'widgets' })).toThrow('unknown category');
    expect(define({ description: ' ' })).toThrow('description is required');
    expect(define({ children: 'html' })).toThrow('children must be');
    expect(define({ runtime: 'server' })).toThrow('unknown runtime');
    expect(define({ stability: 'beta' })).toThrow('unknown stability');
    expect(define({ props: null })).toThrow('props are required');
    expect(define({ props: { Label: prop.string('Bad.') } })).toThrow(
      'camelCase',
    );
    expect(
      define({ props: { label: { kind: 'string', description: 'Raw.' } } }),
    ).toThrow('prop builders');
    expect(define({ slots: ['body'] })).toThrow('include "root"');
    expect(define({ slots: ['root', 'root'] })).toThrow('unique');
    expect(define({ slots: ['root', 'Body'] })).toThrow('camelCase');
    expect(define({ keywords: [''] })).toThrow('keywords');
    expect(define({ example: { props: { missing: 'x' } } })).toThrow(
      "isn't declared",
    );
    expect(define({ example: { props: { label: 1 } } })).toThrow(
      'must be a string',
    );
    expect(
      define({
        props: { tone: prop.enum(['a'], 'Tone.') },
        example: { props: { tone: 'b' } },
      }),
    ).toThrow('enum values');
    expect(define({ example: { children: 'Text.' } })).toThrow(
      'example children',
    );
  });

  it('derives view, slot, variant and key types from the definition', () => {
    const callout = defineCallout();
    type Callout = typeof callout;

    expectTypeOf(callout.name).toEqualTypeOf<'Callout'>();
    expectTypeOf(callout.children).toEqualTypeOf<'mdx'>();
    expectTypeOf(callout.runtime).toEqualTypeOf<'static'>();
    expectTypeOf<PostkitSlotOf<Callout>>().toEqualTypeOf<
      'root' | 'icon' | 'title' | 'body'
    >();
    expectTypeOf<PostkitThemeVariantOf<Callout>>().toEqualTypeOf<
      'size' | 'variant' | 'tone'
    >();
    expectTypeOf<PostkitPropNameOf<Callout>>().toEqualTypeOf<
      'size' | 'variant' | 'title' | 'tone' | 'items' | 'open'
    >();
    expectTypeOf<PostkitThemeKeyOf<Callout>>().toEqualTypeOf<'callout'>();
    expectTypeOf<
      PostkitRecipeKeyOf<Callout>
    >().toEqualTypeOf<'postkitCallout'>();

    type Props = PostkitPropsOf<Callout>;
    expectTypeOf<Props['items']>().toEqualTypeOf<readonly string[]>();
    expectTypeOf<Props['tone']>().toEqualTypeOf<
      'note' | 'tip' | 'warning' | undefined
    >();
    expectTypeOf<Props['size']>().toEqualTypeOf<
      'sm' | 'md' | 'lg' | undefined
    >();
    expectTypeOf<Props['title']>().toEqualTypeOf<string | undefined>();
    expectTypeOf<Props['open']>().toEqualTypeOf<boolean | undefined>();
    expectTypeOf<{ items: readonly string[] }>().toExtend<Props>();
    expectTypeOf<{ tone: 'tip' }>().not.toExtend<Props>();

    expectTypeOf(callout).toExtend<AnyPostkitComponentDefinition>();
  });

  it('type-checks examples against the props', () => {
    expect(() =>
      definePostkitComponent({
        name: 'Badge',
        directive: 'postkit-badge',
        category: 'publishing',
        description: 'A badge.',
        props: { tone: prop.enum(['a', 'b'], 'Tone.') },
        slots: ['root'],
        // @ts-expect-error The example value must be one of the enum values.
        example: { props: { tone: 'c' } },
      }),
    ).toThrow(TypeError);
  });
});

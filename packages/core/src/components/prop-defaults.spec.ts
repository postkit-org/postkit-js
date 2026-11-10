import { expectTypeOf } from 'vitest';
import {
  calloutDefinition,
  definePostkitComponent,
  figureDefinition,
  presentation,
  prop,
  type PostkitAuthoredPropsOf,
  type PostkitDefaultedPropNameOf,
  type PostkitEnumPropDefinition,
  type PostkitJsonPropDefinition,
  type PostkitPropsOf,
  type PostkitStringPropDefinition,
} from './index.js';

describe('prop defaults in types', () => {
  it('records whether a builder was given a default', () => {
    expectTypeOf(prop.string('A title.')).toEqualTypeOf<
      PostkitStringPropDefinition<false, false>
    >();
    expectTypeOf(prop.string('A title.', { default: 'Hi' })).toEqualTypeOf<
      PostkitStringPropDefinition<false, true>
    >();
    expectTypeOf(
      prop.enum(['note', 'tip'], { description: 'Tone.', default: 'note' }),
    ).toEqualTypeOf<
      PostkitEnumPropDefinition<'note' | 'tip', false, false, true>
    >();
    expectTypeOf(prop.enum(['note', 'tip'], 'Tone.')).toEqualTypeOf<
      PostkitEnumPropDefinition<'note' | 'tip', false, false, false>
    >();
    expectTypeOf(
      prop.json<readonly string[]>('Items.', { default: [] }),
    ).toEqualTypeOf<
      PostkitJsonPropDefinition<readonly string[], false, true>
    >();
    expectTypeOf(presentation.variant.default).toEqualTypeOf<
      'outline' | 'subtle' | 'plain'
    >();
  });

  it('makes defaulted props non-optional for views, not for authors', () => {
    type Resolved = PostkitPropsOf<typeof calloutDefinition>;
    expectTypeOf<Resolved['tone']>().toEqualTypeOf<
      'note' | 'tip' | 'important' | 'warning' | 'caution'
    >();
    expectTypeOf<Resolved['variant']>().toEqualTypeOf<
      'outline' | 'subtle' | 'plain'
    >();
    expectTypeOf<Resolved['title']>().toEqualTypeOf<string | undefined>();

    type Authored = PostkitAuthoredPropsOf<typeof calloutDefinition>;
    expectTypeOf<{ title: 'Hi' }>().toExtend<Authored>();
    expectTypeOf<{ title: 'Hi' }>().not.toExtend<Resolved>();

    expectTypeOf<
      PostkitDefaultedPropNameOf<typeof figureDefinition>
    >().toEqualTypeOf<
      'size' | 'variant' | 'objectFit' | 'loading' | 'layout'
    >();
  });

  it('types a host definition the same way', () => {
    const badge = defineBadge();
    expect(badge.props.tone.default).toBe('neutral');
    type Badge = typeof badge;
    type Props = PostkitPropsOf<Badge>;
    expectTypeOf<Props['tone']>().toEqualTypeOf<'neutral' | 'accent'>();
    expectTypeOf<{ label: 'New'; tone: 'accent' }>().toExtend<Props>();
    expectTypeOf<{ label: 'New' }>().not.toExtend<Props>();
    expectTypeOf<{ label: 'New' }>().toExtend<PostkitAuthoredPropsOf<Badge>>();
  });
});

function defineBadge() {
  return definePostkitComponent({
    name: 'Badge',
    directive: 'postkit-badge',
    category: 'publishing',
    description: 'A small label.',
    props: {
      label: prop.string('The label.', { required: true }),
      tone: prop.enum(['neutral', 'accent'], {
        description: 'The emphasis.',
        default: 'neutral',
      }),
    },
    slots: ['root'],
  });
}

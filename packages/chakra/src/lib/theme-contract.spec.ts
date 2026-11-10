import {
  postkitBuiltInDefinitions,
  type PostkitBuiltInComponentName,
  type PostkitSlotOf,
  type PostkitThemeKeyOf,
  type PostkitThemeVariantOf,
} from '@postkit/core/components';
import { expectTypeOf } from 'vitest';
import type {
  PostkitThemeSlotMap,
  PostkitThemeVariantMap,
} from './theme-contract.js';

/*
 * The theme maps are written out for type-check speed (see theme-contract.ts).
 * These assertions keep them identical to the definitions' anatomy and
 * theme-variant props.
 */

type Definitions = typeof postkitBuiltInDefinitions;

/** Aside shares the Callout recipe, so it has no theme key of its own. */
type ThemedName = Exclude<PostkitBuiltInComponentName, 'Aside'>;

type DefinitionSlotMap = {
  readonly [
    Name in ThemedName as PostkitThemeKeyOf<Definitions[Name]>
  ]: PostkitSlotOf<Definitions[Name]>;
};

type DefinitionVariantMap = {
  readonly [
    Name in ThemedName as PostkitThemeKeyOf<Definitions[Name]>
  ]: PostkitThemeVariantOf<Definitions[Name]>;
};

describe('Postkit theme contract', () => {
  it('matches the slot anatomy of every definition', () => {
    expectTypeOf<
      Omit<PostkitThemeSlotMap, 'prose'>
    >().toEqualTypeOf<DefinitionSlotMap>();
  });

  it('matches the theme-variant props of every definition', () => {
    expectTypeOf<
      Omit<PostkitThemeVariantMap, 'prose' | 'linkPreview'>
    >().toEqualTypeOf<Omit<DefinitionVariantMap, 'linkPreview'>>();
    expectTypeOf<PostkitThemeVariantMap['linkPreview']>().toEqualTypeOf<
      DefinitionVariantMap['linkPreview'] | 'compact'
    >();
  });

  it('shares the Callout anatomy with Aside', () => {
    expect(postkitBuiltInDefinitions.Aside.slots).toEqual(
      postkitBuiltInDefinitions.Callout.slots,
    );
    expect(postkitBuiltInDefinitions.Aside.themeVariants).toEqual(
      postkitBuiltInDefinitions.Callout.themeVariants,
    );
  });
});

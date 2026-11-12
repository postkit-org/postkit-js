import {
  calloutDefinition,
  definePostkitComponent,
  figureDefinition,
  prop,
} from '@postkit/core/components';

import {
  postkitPartAttributes,
  postkitStateAttributeName,
  resolvePostkitViewState,
  validatePostkitProps,
  warnPostkitProps,
} from './anatomy.js';

describe('resolvePostkitViewState', () => {
  it('applies definition defaults and computes the theme-variant state', () => {
    const { props, state } = resolvePostkitViewState(calloutDefinition, {
      title: 'Hi',
      children: 'Body',
    });

    expect(props).toEqual({
      title: 'Hi',
      children: 'Body',
      size: 'md',
      variant: 'subtle',
      tone: 'note',
    });
    expect(state).toEqual({ size: 'md', variant: 'subtle', tone: 'note' });
  });

  it('prefers theme defaults over definition defaults, but not over authored values', () => {
    const { state } = resolvePostkitViewState(
      figureDefinition,
      { src: '/a.jpg', alt: '', size: 'lg' },
      { themeDefaults: { size: 'sm', variant: 'plain', layout: 'nope' } },
    );

    expect(state).toEqual({ size: 'lg', variant: 'plain', layout: 'inline' });
  });

  it('falls back from enum values the definition does not allow', () => {
    const { props, state } = resolvePostkitViewState(calloutDefinition, {
      tone: 'bogus',
    });

    expect(props['tone']).toBe('note');
    expect(state['tone']).toBe('note');
  });

  it('passes responsive values through without a state entry', () => {
    const size = { base: 'sm', md: 'lg' };
    const { props, state } = resolvePostkitViewState(calloutDefinition, {
      size,
    });

    expect(props['size']).toBe(size);
    expect(state).not.toHaveProperty('size');
  });

  it('omits unset props that have no default', () => {
    const { props } = resolvePostkitViewState(figureDefinition, {
      src: '/a.jpg',
      alt: '',
    });

    expect(props).not.toHaveProperty('caption');
    expect(props['objectFit']).toBe('cover');
    expect(props['loading']).toBe('lazy');
  });
});

describe('postkitPartAttributes', () => {
  it('stamps the component and state on the root only', () => {
    expect(
      postkitPartAttributes(
        calloutDefinition,
        'root',
        { tone: 'tip', size: 'md', variant: 'plain' },
        { unstyled: true },
      ),
    ).toEqual({
      'data-postkit-component': 'Callout',
      'data-postkit-part': 'root',
      'data-size': 'md',
      'data-variant': 'plain',
      'data-tone': 'tip',
      'data-postkit-unstyled': '',
    });
    expect(postkitPartAttributes(calloutDefinition, 'icon', {})).toEqual({
      'data-postkit-part': 'icon',
    });
  });

  it('kebab-cases state attribute names', () => {
    expect(postkitStateAttributeName('layoutMode')).toBe('data-layout-mode');
    expect(postkitStateAttributeName('tone')).toBe('data-tone');
  });
});

describe('validatePostkitProps', () => {
  const definition = definePostkitComponent({
    name: 'Probe',
    directive: 'postkit-probe',
    category: 'media',
    description: 'A probe.',
    props: {
      label: prop.string('A label.', { required: true }),
      count: prop.number('A count.'),
      open: prop.boolean('Open.'),
      mode: prop.enum(['a', 'b'], 'A mode.'),
      tone: prop.enum(['x', 'y'], {
        description: 'A tone.',
        themeVariant: true,
      }),
      data: prop.json('Data.'),
    },
    slots: ['root'],
  });

  it('accepts valid values, string forms of numbers and booleans, and responsive theme variants', () => {
    expect(
      validatePostkitProps(definition, {
        label: 'Hi',
        count: '3',
        open: 'true',
        mode: 'a',
        tone: { base: 'x' },
        data: [1, 2],
        extra: 'not checked',
      }),
    ).toEqual([]);
  });

  it('accepts a number for an enum whose values are numeric strings', () => {
    const grid = definePostkitComponent({
      name: 'ProbeGrid',
      directive: 'postkit-probe-grid',
      category: 'media',
      description: 'A probe grid.',
      props: { columns: prop.enum(['1', '2'], 'Columns.') },
      slots: ['root'],
    });
    expect(validatePostkitProps(grid, { columns: 2 })).toEqual([]);
    expect(validatePostkitProps(grid, { columns: 3 })).toEqual([
      'ProbeGrid: the "columns" prop must be one of "1", "2"; received 3.',
    ]);
  });

  it('reports missing required props and wrong kinds', () => {
    expect(
      validatePostkitProps(definition, {
        count: 'many',
        open: 1,
        mode: { base: 'a' },
        tone: 'z',
        label: null,
      }),
    ).toEqual([
      'Probe: the "label" prop is required.',
      'Probe: the "count" prop must be a finite number; received "many".',
      'Probe: the "open" prop must be a boolean; received 1.',
      'Probe: the "mode" prop must be one of "a", "b"; received an object.',
      'Probe: the "tone" prop must be one of "x", "y"; received "z".',
    ]);
    expect(validatePostkitProps(definition, { label: 4 })).toEqual([
      'Probe: the "label" prop must be a string; received 4.',
    ]);
    expect(
      validatePostkitProps(definition, { label: 'x', mode: ['a'] }),
    ).toEqual([
      'Probe: the "mode" prop must be one of "a", "b"; received an array.',
    ]);
  });

  it('warns once per problem in development, and not in production', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    warnPostkitProps(definition, { label: 'x', count: 'once' });
    warnPostkitProps(definition, { label: 'x', count: 'once' });
    expect(warn).toHaveBeenCalledTimes(1);

    vi.stubEnv('NODE_ENV', 'production');
    warnPostkitProps(definition, { label: 'x', count: 'production' });
    vi.unstubAllEnvs();
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });
});

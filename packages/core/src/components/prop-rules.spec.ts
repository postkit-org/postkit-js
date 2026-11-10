import {
  calloutDefinition,
  definePostkitComponent,
  deviceDefinition,
  postkitBuiltInDefinitions,
  postkitCanonicalProps,
  postkitPropAdvisories,
  postkitPropAliases,
  postkitVideoDuration,
  prop,
  videoDefinition,
} from './index.js';
import { renderPostkitStaticView } from '../lib/serialize-views.js';

describe('prop aliases (D6)', () => {
  it("accepts Callout's type as an alias of tone", () => {
    expect(calloutDefinition.props.tone.aliases).toEqual(['type']);
    expect(postkitPropAliases(calloutDefinition).get('type')).toBe('tone');
    expect(postkitCanonicalProps(calloutDefinition, { type: 'tip' })).toEqual({
      tone: 'tip',
    });
  });

  it('keeps tone canonical when both are set', () => {
    expect(
      postkitCanonicalProps(calloutDefinition, {
        tone: 'warning',
        type: 'tip',
      }),
    ).toEqual({ tone: 'warning' });
  });

  it('returns the props unchanged when nothing is aliased', () => {
    const props = { tone: 'tip' };
    expect(postkitCanonicalProps(calloutDefinition, props)).toBe(props);
  });

  it('maps the alias in the static serializer', () => {
    const view = renderPostkitStaticView({
      type: 'component',
      name: 'Callout',
      props: { type: 'warning' },
      children: [],
    });
    expect(view?.kind === 'view' && view.root.attributes).toMatchObject({
      'data-tone': 'warning',
    });
  });

  it('rejects an alias that is already a prop or another alias', () => {
    expect(() =>
      definePostkitComponent({
        name: 'Badge',
        directive: 'postkit-badge',
        category: 'publishing',
        description: 'A label.',
        props: {
          label: prop.string('The label.'),
          text: prop.string('The text.', { aliases: ['label'] }),
        },
        slots: ['root'],
      }),
    ).toThrow(/alias "label"/);
    expect(() => prop.string('The text.', { aliases: ['Not-camel'] })).toThrow(
      /camelCase/,
    );
  });
});

describe('recommended props (D20)', () => {
  it('warns about a Video without captions, and never fails', () => {
    expect(
      postkitPropAdvisories(videoDefinition, { src: '/a.mp4', title: 'A' }),
    ).toEqual([
      'Video: the "captions" prop is missing. Add a captions track (a WebVTT file), or mark the video decorative.',
    ]);
  });

  it('is silenced by captions, decorative or tracks', () => {
    const base = { src: '/a.mp4', title: 'A' };
    expect(
      postkitPropAdvisories(videoDefinition, { ...base, captions: '/a.vtt' }),
    ).toEqual([]);
    expect(
      postkitPropAdvisories(videoDefinition, { ...base, decorative: true }),
    ).toEqual([]);
    expect(
      postkitPropAdvisories(videoDefinition, { ...base, decorative: 'true' }),
    ).toEqual([]);
    expect(
      postkitPropAdvisories(videoDefinition, {
        ...base,
        tracks: [{ src: '/a.vtt' }],
      }),
    ).toEqual([]);
    expect(
      postkitPropAdvisories(videoDefinition, base, {
        present: new Set(['decorative']),
      }),
    ).toEqual([]);
  });

  it('still warns when decorative is false', () => {
    expect(
      postkitPropAdvisories(videoDefinition, {
        src: '/a.mp4',
        title: 'A',
        decorative: false,
      }),
    ).toHaveLength(1);
  });

  it('only Video recommends a prop among the built-ins', () => {
    const recommended = Object.values(postkitBuiltInDefinitions).flatMap(
      (definition) =>
        Object.entries(definition.props)
          .filter(([, definitionProp]) => definitionProp.recommended)
          .map(([name]) => `${definition.name}.${name}`),
    );
    expect(recommended).toEqual(['Video.captions']);
  });

  it('rejects a required prop that is also recommended', () => {
    expect(() =>
      prop.string('The text.', {
        required: true,
        recommended: { reason: 'Set it.' },
      }),
    ).toThrow(/required/);
  });
});

describe('postkitVideoDuration', () => {
  it.each([
    ['0:24', '0:24', 'PT24S'],
    ['12:05', '12:05', 'PT12M5S'],
    ['1:02:03', '1:02:03', 'PT1H2M3S'],
    ['PT24S', '0:24', 'PT24S'],
    ['PT1H2M3S', '1:02:03', 'PT1H2M3S'],
    ['pt90s', '1:30', 'PT1M30S'],
    ['0:00', '0:00', 'PT0S'],
  ])('reads %s', (value, text, dateTime) => {
    expect(postkitVideoDuration(value)).toEqual({ text, dateTime });
  });

  it.each(['', '  ', 'two minutes', '1:75', 'PT'])('ignores %j', (value) => {
    expect(postkitVideoDuration(value)).toBeUndefined();
  });
});

describe('Device', () => {
  it('is an experimental media component', () => {
    expect(deviceDefinition).toMatchObject({
      name: 'Device',
      directive: 'postkit-device',
      category: 'media',
      stability: 'experimental',
    });
    expect(deviceDefinition.props.kind.values).toEqual([
      'iphone',
      'ipad',
      'mac',
    ]);
    expect(deviceDefinition.themeVariants).toEqual(['size', 'variant', 'kind']);
  });
});

describe('stability (03 §7)', () => {
  it('marks Poll, Chart, SocialPost and Device experimental', () => {
    const experimental = Object.values(postkitBuiltInDefinitions)
      .filter((definition) => definition.stability === 'experimental')
      .map((definition) => definition.name)
      .sort();
    expect(experimental).toEqual(['Chart', 'Device', 'Poll', 'SocialPost']);
  });
});

import { describe, expect, it } from 'vitest';

import { calloutDefinition } from './callout/callout.definition.js';
import { definePostkitComponent } from './definition.js';
import { createPostkitComponentManifest } from './manifest.js';
import { pollDefinition } from './poll/poll.definition.js';
import { prop } from './props.js';
import { shareActionsDefinition } from './share-actions/share-actions.definition.js';
import { tabsDefinition } from './tabs/tabs.definition.js';

describe('email support (03 §6)', () => {
  it('keeps a declared fallback on the definition', () => {
    expect(pollDefinition.email).toEqual({ fallback: 'link' });
    expect(tabsDefinition.email).toEqual({ fallback: 'text' });
    expect(shareActionsDefinition.email).toEqual({ fallback: 'omit' });
    expect(Object.isFrozen(pollDefinition.email)).toBe(true);
    expect(calloutDefinition.email).toBeUndefined();
  });

  it('rejects an unknown fallback', () => {
    expect(() =>
      definePostkitComponent({
        name: 'Badge',
        directive: 'site-badge',
        category: 'publishing',
        description: 'A badge.',
        props: { label: prop.string('The label.') },
        slots: ['root'],
        email: { fallback: 'image' as never },
      }),
    ).toThrow('email must be { fallback: "link" | "omit" | "text" }.');
  });

  it('computes email support from the views @postkit/email exports', () => {
    const custom = definePostkitComponent({
      name: 'Badge',
      directive: 'site-badge',
      category: 'publishing',
      description: 'A badge.',
      props: { label: prop.string('The label.') },
      slots: ['root'],
    });
    const { components } = createPostkitComponentManifest(
      [
        { definition: calloutDefinition },
        { definition: pollDefinition },
        { definition: tabsDefinition },
        { definition: shareActionsDefinition },
        { definition: custom },
      ],
      { renderers: { email: ['Callout'] } },
    );
    expect(components['Callout'].support.email).toBe('supported');
    expect(components['Poll'].support.email).toEqual({ fallback: 'link' });
    expect(components['Tabs'].support.email).toEqual({ fallback: 'text' });
    expect(components['ShareActions'].support.email).toEqual({
      fallback: 'omit',
    });
    expect(components['Badge'].support.email).toBe('not-supported');
    // The email field closes `support`, after `astro`.
    expect(Object.keys(components['Callout'].support)).toEqual([
      'react',
      'astro',
      'email',
    ]);
  });

  it('leaves email out when the producer does not know the email views', () => {
    const { components } = createPostkitComponentManifest([
      { definition: pollDefinition },
    ]);
    expect(components['Poll'].support).not.toHaveProperty('email');
  });
});

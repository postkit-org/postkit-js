// @vitest-environment node

import { disclosureDefinition } from '@postkit/core/components';
import { renderToStaticMarkup } from 'react-dom/server';

import { PostkitProvider } from '../../lib/provider.js';
import { createPostkitSystem, postkitDefaultTheme } from '../../lib/theme.js';
import { Disclosure } from './disclosure.js';
import {
  postkitDisclosureRecipe,
  postkitDisclosureSlots,
} from './disclosure.recipe.js';

function render(node: React.ReactNode) {
  return renderToStaticMarkup(
    <PostkitProvider
      system={createPostkitSystem({ preset: postkitDefaultTheme })}
    >
      {node}
    </PostkitProvider>,
  );
}

describe('Chakra Disclosure view', () => {
  it('types its recipe slots from the definition anatomy', () => {
    expect(Disclosure.definition).toBe(disclosureDefinition);
    expect(postkitDisclosureSlots).toBe(disclosureDefinition.slots);
    expect(postkitDisclosureRecipe.slots).toEqual(disclosureDefinition.slots);
  });

  it('stays native and stamps every part', () => {
    const markup = render(
      <Disclosure
        summary="Details"
        open
        classNames={{ summary: 'my-summary' }}
        rootProps={{ id: 'details' }}
      >
        Body
      </Disclosure>,
    );

    for (const part of postkitDisclosureSlots) {
      expect(markup).toContain(`data-postkit-part="${part}"`);
    }
    expect(markup).toMatch(/<details [^>]*open=""/);
    expect(markup).toContain('id="details"');
    expect(markup).toMatch(
      /<summary [^>]*class="postkit-disclosure__summary my-summary/,
    );
  });

  it('starts closed by default', () => {
    expect(render(<Disclosure summary="Details">Body</Disclosure>)).not.toMatch(
      /<details [^>]*open/,
    );
  });
});

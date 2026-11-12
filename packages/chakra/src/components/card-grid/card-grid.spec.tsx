// @vitest-environment node

import { cardGridDefinition } from '@postkit/core/components';
import { renderToStaticMarkup } from 'react-dom/server';

import { PostkitProvider } from '../../lib/postkit-provider.js';
import { createPostkitSystem } from '../../lib/create-postkit-system.js';
import { postkitDefaultTheme } from '../../lib/theme.js';
import { CardGrid } from './card-grid.js';
import {
  postkitCardGridRecipe,
  postkitCardGridSlots,
} from './card-grid.recipe.js';

function render(node: React.ReactNode) {
  return renderToStaticMarkup(
    <PostkitProvider
      system={createPostkitSystem({ preset: postkitDefaultTheme })}
    >
      {node}
    </PostkitProvider>,
  );
}

describe('Chakra CardGrid view', () => {
  it('types its recipe slots from the definition anatomy', () => {
    expect(CardGrid.definition).toBe(cardGridDefinition);
    expect(postkitCardGridSlots).toBe(cardGridDefinition.slots);
    expect(postkitCardGridRecipe.slots).toEqual(cardGridDefinition.slots);
  });

  it('stamps every part and merges view, slot and root styles in order', () => {
    const markup = render(
      <CardGrid
        title="Resources"
        description="Choose a guide."
        columns={3}
        items={[
          {
            title: 'Guide',
            description: 'Read it.',
            href: '/guide',
            image: { src: '/guide.jpg', alt: 'Cover' },
            meta: 'PDF',
          },
        ]}
        classNames={{ card: 'my-card' }}
        slotStyles={{ grid: { padding: '1px' } }}
        rootProps={{ id: 'cards', css: { marginTop: '3px' } }}
      />,
    );

    for (const part of postkitCardGridSlots) {
      expect(markup).toContain(`data-postkit-part="${part}"`);
    }
    expect(markup).toContain('data-postkit-component="CardGrid"');
    expect(markup).toContain('id="cards"');
    expect(markup).toMatch(/class="[^"]*postkit-card-grid__card my-card/);
    expect(markup).toMatch(
      /\{[^}]*--postkit-card-columns:3;[^}]*padding:1px[^}]*\}/,
    );
    expect(markup).toContain('margin-top:3px');
    expect(markup).toContain('Learn more');
  });
});

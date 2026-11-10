// @vitest-environment node

import { stepsDefinition } from '@postkit/core/components';
import { renderToStaticMarkup } from 'react-dom/server';

import { PostkitProvider } from '../../lib/provider.js';
import { createPostkitSystem, postkitDefaultTheme } from '../../lib/theme.js';
import { Steps } from './steps.js';
import { postkitStepsRecipe, postkitStepsSlots } from './steps.recipe.js';

function render(node: React.ReactNode) {
  return renderToStaticMarkup(
    <PostkitProvider
      system={createPostkitSystem({ preset: postkitDefaultTheme })}
    >
      {node}
    </PostkitProvider>,
  );
}

describe('Chakra Steps view', () => {
  it('types its recipe slots from the definition anatomy', () => {
    expect(Steps.definition).toBe(stepsDefinition);
    expect(postkitStepsSlots).toBe(stepsDefinition.slots);
    expect(postkitStepsRecipe.slots).toEqual(stepsDefinition.slots);
  });

  it('renders a numbered list and stamps every part', () => {
    const markup = render(
      <Steps
        size="lg"
        items='[{"title":"Install","description":"Add it."},{"title":"Render"}]'
        classNames={{ marker: 'my-marker' }}
        rootProps={{ id: 'steps' }}
      />,
    );

    for (const part of postkitStepsSlots) {
      expect(markup).toContain(`data-postkit-part="${part}"`);
    }
    expect(markup).toContain('<ol ');
    expect(markup).toContain('data-size="lg"');
    expect(markup).toContain('id="steps"');
    expect(markup).toMatch(/class="[^"]*postkit-steps__marker my-marker/);
    expect(markup).toMatch(/aria-hidden="true"[^>]*>2</);
  });
});

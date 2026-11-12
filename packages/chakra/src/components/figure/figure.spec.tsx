// @vitest-environment node

import { figureDefinition } from '@postkit/core/components';
import { renderToStaticMarkup } from 'react-dom/server';

import { PostkitProvider } from '../../lib/postkit-provider.js';
import { createPostkitSystem } from '../../lib/create-postkit-system.js';
import { postkitDefaultTheme } from '../../lib/theme.js';
import { Figure, type FigureProps } from './figure.js';
import { postkitFigureRecipe, postkitFigureSlots } from './figure.recipe.js';

function render(node: React.ReactNode) {
  return renderToStaticMarkup(
    <PostkitProvider
      system={createPostkitSystem({ preset: postkitDefaultTheme })}
    >
      {node}
    </PostkitProvider>,
  );
}

describe('Chakra Figure view', () => {
  it('types its recipe slots from the definition anatomy', () => {
    expect(Figure.definition).toBe(figureDefinition);
    expect(postkitFigureSlots).toBe(figureDefinition.slots);
    expect(postkitFigureRecipe.slots).toEqual(figureDefinition.slots);
  });

  it('defaults to the subtle variant on a quiet surface (D12)', () => {
    expect(postkitFigureRecipe.defaultVariants?.variant).toBe('subtle');
    expect(postkitFigureRecipe.variants?.variant?.subtle?.root).toMatchObject({
      background: 'bg.subtle',
    });

    const markup = render(<Figure src="/a.jpg" alt="A" />);
    expect(markup).toContain('data-variant="subtle"');
    expect(markup).toContain('var(--chakra-colors-bg-subtle)');
  });

  it('stamps every part and merges view, slot and root styles in order', () => {
    const markup = render(
      <Figure
        src="/a.jpg"
        alt="A"
        aspectRatio="4 / 3"
        layout="bleed"
        caption="Caption"
        credit="Credit"
        creditHref="/credit"
        href="/full.jpg"
        classNames={{ image: 'my-image' }}
        slotStyles={{ media: { padding: '1px' } }}
        rootProps={{ id: 'figure', css: { marginTop: '3px' } }}
      />,
    );

    for (const part of postkitFigureSlots) {
      expect(markup).toContain(`data-postkit-part="${part}"`);
    }
    expect(markup).toContain('data-layout="bleed"');
    expect(markup).toContain('id="figure"');
    expect(markup).toMatch(/class="[^"]*postkit-figure__image my-image/);
    expect(markup).toMatch(/\{[^}]*aspect-ratio:[^}]*padding:1px[^}]*\}/);
    expect(markup).toContain('margin-top:3px');
  });

  it('warns in development when a required prop is missing', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const props = { alt: 'No source' } as unknown as FigureProps;
    render(<Figure {...props} />);

    expect(warn).toHaveBeenCalledWith(
      'Postkit Figure: the "src" prop is required.',
    );
    warn.mockRestore();
  });

  it('accepts numeric strings for its dimensions without a warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const markup = render(
      <Figure src="/a.jpg" alt="A" width="1600" height={900} />,
    );

    expect(markup).toContain('width="1600"');
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});

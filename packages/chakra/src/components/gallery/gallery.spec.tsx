// @vitest-environment node

import { galleryDefinition } from '@postkit/core/components';
import { renderToStaticMarkup } from 'react-dom/server';

import { PostkitFiguresProvider } from '@postkit/react';

import { PostkitProvider } from '../../lib/provider.js';
import { createPostkitSystem, postkitDefaultTheme } from '../../lib/theme.js';
import { Gallery } from './gallery.js';
import { postkitGalleryRecipe, postkitGallerySlots } from './gallery.recipe.js';

function render(node: React.ReactNode) {
  return renderToStaticMarkup(
    <PostkitProvider
      system={createPostkitSystem({ preset: postkitDefaultTheme })}
    >
      {node}
    </PostkitProvider>,
  );
}

const items = [
  { src: '/a.jpg', alt: 'A', caption: 'Caption', width: 800, height: 600 },
  { src: '/b.jpg', alt: '', href: '/b-full.jpg' },
];

describe('Chakra Gallery view', () => {
  it('types its recipe slots from the definition anatomy', () => {
    expect(Gallery.definition).toBe(galleryDefinition);
    expect(postkitGallerySlots).toBe(galleryDefinition.slots);
    expect(postkitGalleryRecipe.slots).toEqual(galleryDefinition.slots);
  });

  it('stamps every part and merges view, slot and root styles in order', () => {
    const markup = render(
      // Numbered, so the figure-number part renders too.
      <PostkitFiguresProvider figures="numbered">
        <Gallery
          items={items}
          title="Title"
          description="Description"
          columns={3}
          classNames={{ image: 'my-image' }}
          slotStyles={{ grid: { padding: '1px' } }}
          rootProps={{ id: 'gallery', css: { marginTop: '3px' } }}
        />
      </PostkitFiguresProvider>,
    );

    for (const part of postkitGallerySlots) {
      expect(markup).toContain(`data-postkit-part="${part}"`);
    }
    expect(markup).toContain('data-variant="subtle"');
    expect(markup).toContain('id="gallery"');
    expect(markup).toMatch(/class="[^"]*postkit-gallery__image my-image/);
    expect(markup).toMatch(
      /\{[^}]*--postkit-gallery-columns:3;[^}]*padding:1px[^}]*\}/,
    );
    expect(markup).toContain('margin-top:3px');
    expect(markup).toContain('width="800"');
  });

  it('accepts a numeric column count without a warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    render(<Gallery items={items} columns={4} />);
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});

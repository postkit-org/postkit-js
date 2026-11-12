// @vitest-environment node

import { videoDefinition } from '@postkit/core/components';
import { renderToStaticMarkup } from 'react-dom/server';

import { Video } from './video.js';

describe('headless Video', () => {
  it('renders a framed native player with its default ratio', () => {
    expect(Video.definition).toBe(videoDefinition);
    const markup = renderToStaticMarkup(<Video src="/v.mp4" title="Demo" />);

    expect(markup).toContain(
      '<figure data-postkit-component="Video" data-postkit-part="root" data-size="md" data-variant="subtle">',
    );
    expect(markup).toContain(
      '<div data-postkit-part="frame" style="aspect-ratio:16 / 9">',
    );
    expect(markup).toContain('data-postkit-part="player"');
    expect(markup).toContain('preload="metadata"');
    expect(markup).toContain('playsInline=""');
    expect(markup).toContain(
      '<a data-postkit-part="fallback" href="/v.mp4">Open Demo</a>',
    );
    expect(markup).not.toContain('data-postkit-part="caption"');
  });

  it('renders tracks, a poster and a caption', () => {
    const markup = renderToStaticMarkup(
      <Video
        src="/v.mp4"
        title="Demo"
        poster="/p.jpg"
        caption="A caption"
        aspectRatio="4 / 3"
        tracks={[{ src: '/en.vtt', srcLang: 'en', label: 'English' }]}
      />,
    );

    expect(markup).toContain('style="aspect-ratio:4 / 3"');
    expect(markup).toContain('poster="/p.jpg"');
    expect(markup).toContain(
      '<track src="/en.vtt" srcLang="en" label="English" kind="captions"/>',
    );
    expect(markup).toContain(
      '<figcaption data-postkit-part="caption">A caption</figcaption>',
    );
  });
});

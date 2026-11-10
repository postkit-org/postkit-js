// @vitest-environment node

import { audioDefinition } from '@postkit/core/components';
import { renderToStaticMarkup } from 'react-dom/server';

import { Audio } from './audio.js';

describe('headless Audio', () => {
  it('renders the anatomy with no styles or Chakra', () => {
    expect(Audio.definition).toBe(audioDefinition);
    expect(
      renderToStaticMarkup(
        <Audio src="/episode.mp3" title="Episode 1" caption="Recorded live." />,
      ),
    ).toBe(
      '<figure data-postkit-component="Audio" data-postkit-part="root" data-size="md" data-variant="subtle">' +
        '<p data-postkit-part="title">Episode 1</p>' +
        '<audio data-postkit-part="player" src="/episode.mp3" aria-label="Episode 1" preload="metadata" controls="">' +
        '<a data-postkit-part="fallback" href="/episode.mp3">Open Episode 1</a></audio>' +
        '<figcaption data-postkit-part="caption">Recorded live.</figcaption>' +
        '</figure>',
    );
  });

  it('omits an empty caption and keeps the authored preload', () => {
    const markup = renderToStaticMarkup(
      <Audio src="/a.mp3" title="A" preload="none" size="lg" />,
    );

    expect(markup).not.toContain('data-postkit-part="caption"');
    expect(markup).toContain('preload="none"');
    expect(markup).toContain('data-size="lg"');
  });
});

// @vitest-environment node

import { StrictMode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { Callout } from '../components/callout/callout.js';
import { Carousel } from '../components/carousel/carousel.js';
import { Device } from '../components/device/device.js';
import { Figure } from '../components/figure/figure.js';
import { Gallery } from '../components/gallery/gallery.js';
import { Video } from '../components/video/video.js';
import { article, media } from '../kits/index.js';
import { createPostkit } from './create-postkit.js';
import { PostkitFiguresProvider, postkitFigureLabel } from './figures.js';

const numbers = (markup: string) =>
  [...markup.matchAll(/data-postkit-part="number">([^<]+)</g)].map(
    (match) => match[1],
  );

const article1 = (
  <>
    <Carousel
      items={[
        { title: 'One', caption: 'The launcher.' },
        { title: 'Two', caption: 'Zones.' },
        { title: 'Three' },
      ]}
    />
    <Figure src="/a.png" alt="A" caption="A figure." />
    <Gallery
      presentation="row"
      items={[
        { src: '/b.png', alt: 'B', caption: 'B' },
        { src: '/c.png', alt: 'C' },
      ]}
    />
    <Video src="/v.mp4" title="Walkthrough" captions="/v.vtt" />
    <Device src="/d.png" alt="D" />
  </>
);

describe('figure numbering (figures="numbered")', () => {
  it('labels a figure and the items of a group', () => {
    expect(postkitFigureLabel(1)).toBe('Fig. 1');
    expect(postkitFigureLabel(1, 1)).toBe('Fig. 1b');
    expect(postkitFigureLabel(3, 2)).toBe('Fig. 3c');
    expect(postkitFigureLabel(2, 25)).toBe('Fig. 2z');
    expect(postkitFigureLabel(2, 26)).toBe('Fig. 2ba');
    expect(postkitFigureLabel(4, 0, 'Figure')).toBe('Figure 4');
  });

  it('numbers groups as 1, 1b, 1c… and continues from 2', () => {
    const markup = renderToStaticMarkup(
      <PostkitFiguresProvider figures="numbered">
        {article1}
      </PostkitFiguresProvider>,
    );
    expect(numbers(markup)).toEqual([
      'Fig. 1',
      'Fig. 1b',
      'Fig. 1c',
      'Fig. 2',
      'Fig. 3',
      'Fig. 3b',
      'Fig. 4',
      'Fig. 5',
    ]);
  });

  it('is stable under StrictMode double rendering', () => {
    const markup = renderToStaticMarkup(
      <StrictMode>
        <PostkitFiguresProvider figures="numbered">
          {article1}
        </PostkitFiguresProvider>
      </StrictMode>,
    );
    expect(numbers(markup).filter((label) => !/\d[b-z]$/.test(label))).toEqual([
      'Fig. 1',
      'Fig. 2',
      'Fig. 3',
      'Fig. 4',
      'Fig. 5',
    ]);
  });

  it('leaves figures alone without the provider, or with figures="none"', () => {
    expect(numbers(renderToStaticMarkup(article1))).toEqual([]);
    expect(
      numbers(
        renderToStaticMarkup(
          <PostkitFiguresProvider figures="none">
            {article1}
          </PostkitFiguresProvider>,
        ),
      ),
    ).toEqual([]);
  });

  it('takes figures and figureLabel on createPostkit().Provider', () => {
    const postkit = createPostkit({ kits: [article, media] });
    const markup = renderToStaticMarkup(
      <postkit.Provider figures="numbered" figureLabel="Figure">
        <Figure src="/a.png" alt="A" />
        <Figure src="/b.png" alt="B" caption="Second." />
      </postkit.Provider>,
    );
    expect(numbers(markup)).toEqual(['Figure 1', 'Figure 2']);
    expect(markup).toContain(
      '<figcaption data-postkit-part="figcaption"><span data-postkit-part="number">Figure 1</span></figcaption>',
    );
  });
});

describe('catalog changes in the headless views (03 §7)', () => {
  it('accepts type as an alias of Callout tone (D6), tone winning', () => {
    expect(
      renderToStaticMarkup(<Callout type="warning">Body</Callout>),
    ).toContain('data-tone="warning"');
    expect(
      renderToStaticMarkup(
        <Callout type="warning" tone="tip">
          Body
        </Callout>,
      ),
    ).toContain('data-tone="tip"');
  });

  it('adds the Video captions track and duration', () => {
    const markup = renderToStaticMarkup(
      <Video
        src="/v.mp4"
        title="Walkthrough"
        captions="/v.vtt"
        captionsLang="en"
        duration="PT1M4S"
        caption="A morning in the app."
      />,
    );
    expect(markup).toContain(
      '<track src="/v.vtt" srcLang="en" label="Captions" kind="captions" default=""/>',
    );
    expect(markup).toContain(
      'A morning in the app.<time data-postkit-part="duration" dateTime="PT1M4S">1:04</time>',
    );
  });

  it('warns in development about a Video without captions, unless decorative (D20)', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    try {
      renderToStaticMarkup(<Video src="/warn.mp4" title="Uncaptioned" />);
      expect(warn).toHaveBeenCalledWith(
        'Postkit Video: the "captions" prop is missing. Add a captions track (a WebVTT file), or mark the video decorative.',
      );
      warn.mockClear();
      renderToStaticMarkup(<Video src="/loop.mp4" title="Loop" decorative />);
      renderToStaticMarkup(
        <Video
          src="/tracks.mp4"
          title="Tracks"
          tracks={[{ src: '/t.vtt', srcLang: 'en', label: 'English' }]}
        />,
      );
      expect(warn).not.toHaveBeenCalled();
    } finally {
      warn.mockRestore();
    }
  });

  it('marks a row Gallery and makes its rail focusable', () => {
    const markup = renderToStaticMarkup(
      <Gallery
        presentation="row"
        title="Three ways"
        items={[{ src: '/a.png', alt: 'A' }]}
      />,
    );
    expect(markup).toContain('data-presentation="row"');
    expect(markup).toContain(
      '<div data-postkit-part="grid" style="--postkit-gallery-columns:2" role="group" aria-label="Three ways" tabindex="0">',
    );
  });
});

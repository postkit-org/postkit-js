// @vitest-environment node

import { renderToStaticMarkup } from 'react-dom/server';

import { Device } from './device.js';

describe('headless Device', () => {
  it('draws an iPhone frame with a notch around the screenshot', () => {
    expect(
      renderToStaticMarkup(
        <Device src="/home.png" alt="The home screen" caption="On iPhone." />,
      ),
    ).toBe(
      '<figure data-postkit-component="Device" data-postkit-part="root" data-size="md" data-variant="subtle" data-kind="iphone">' +
        '<div data-postkit-part="frame">' +
        '<span data-postkit-part="notch" aria-hidden="true"></span>' +
        '<div data-postkit-part="screen">' +
        '<img data-postkit-part="image" src="/home.png" alt="The home screen" loading="lazy" decoding="async"/>' +
        '</div></div>' +
        '<figcaption data-postkit-part="figcaption"><span data-postkit-part="caption">On iPhone.</span></figcaption>' +
        '</figure>',
    );
  });

  it('gives a Mac a base and an iPad neither notch nor base', () => {
    const mac = renderToStaticMarkup(
      <Device kind="mac" src="/app.png" alt="The editor" />,
    );
    expect(mac).toContain('data-kind="mac"');
    expect(mac).toContain('<span data-postkit-part="base" aria-hidden="true">');
    expect(mac).not.toContain('notch');
    expect(mac).not.toContain('figcaption');

    const ipad = renderToStaticMarkup(
      <Device kind="ipad" src="/app.png" alt="The editor" />,
    );
    expect(ipad).toContain('data-kind="ipad"');
    expect(ipad).not.toMatch(/notch|base/);
  });

  it('falls back to iphone for an unknown kind', () => {
    expect(
      renderToStaticMarkup(
        <Device kind={'watch' as 'iphone'} src="/a.png" alt="A" />,
      ),
    ).toContain('data-kind="iphone"');
  });
});

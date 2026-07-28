import {
  assertHttpUrl,
  assertPublicHttpUrl,
  iframeSrcFromHtml,
  queryUrl,
} from './http.js';

describe('resolver URL boundaries', () => {
  it('accepts public HTTP(S) destinations and rejects local or credentialed ones', () => {
    expect(assertPublicHttpUrl('https://example.com/article').hostname).toBe(
      'example.com',
    );
    expect(() => assertPublicHttpUrl('http://127.0.0.1/admin')).toThrow(
      'public host',
    );
    expect(() => assertPublicHttpUrl('http://192.168.1.10')).toThrow(
      'public host',
    );
    expect(() => assertPublicHttpUrl('http://[::1]/')).toThrow('public host');
    expect(() =>
      assertPublicHttpUrl('https://user:secret@example.com'),
    ).toThrow('public host');
    expect(() => assertPublicHttpUrl('javascript:alert(1)')).toThrow(
      'HTTP or HTTPS',
    );
  });

  it('allows a local development endpoint without accepting it as content', () => {
    expect(assertHttpUrl('http://localhost:4000/v1/resolve').port).toBe('4000');
    expect(
      queryUrl('http://localhost:4000/v1/resolve', {
        url: 'https://example.com',
      }).toString(),
    ).toBe('http://localhost:4000/v1/resolve?url=https%3A%2F%2Fexample.com');
  });

  it('extracts only public HTTP(S) iframe sources', () => {
    expect(
      iframeSrcFromHtml(
        '<iframe title="Video" src="https://player.example.com/embed/1"></iframe>',
      ),
    ).toBe('https://player.example.com/embed/1');
    expect(
      iframeSrcFromHtml('<iframe src="http://127.0.0.1/private"></iframe>'),
    ).toBeUndefined();
    expect(
      iframeSrcFromHtml('<iframe src="javascript:alert(1)"></iframe>'),
    ).toBeUndefined();
  });
});

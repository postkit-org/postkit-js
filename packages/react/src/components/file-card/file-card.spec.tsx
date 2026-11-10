// @vitest-environment node

import { renderToStaticMarkup } from 'react-dom/server';

import { FileCard, postkitFileCardMark } from './file-card.js';

describe('headless FileCard', () => {
  it('renders a download link by default', () => {
    expect(renderToStaticMarkup(<FileCard href="/a.pdf" name="a.pdf" />)).toBe(
      '<div data-postkit-component="FileCard" data-postkit-part="root" data-size="md" data-variant="subtle">' +
        '<div data-postkit-part="icon" aria-hidden="true">PDF</div>' +
        '<div data-postkit-part="content"><p data-postkit-part="name">a.pdf</p></div>' +
        '<a data-postkit-part="action" href="/a.pdf" download="">Download</a></div>',
    );
  });

  it('renders an open link with its details', () => {
    const markup = renderToStaticMarkup(
      <FileCard
        href="/b"
        name="b.zip"
        description="Sources"
        fileType="ARCHIVE"
        fileSize="2 MB"
        download="false"
      />,
    );

    expect(markup).toContain('aria-hidden="true">ARCH</div>');
    expect(markup).toContain(
      '<p data-postkit-part="description">Sources</p><p data-postkit-part="meta">ARCHIVE · 2 MB</p>',
    );
    expect(markup).toContain(
      '<a data-postkit-part="action" href="/b">Open</a>',
    );
  });

  it('marks a file by its extension', () => {
    expect(postkitFileCardMark('notes.markdown')).toBe('MARK');
    expect(postkitFileCardMark('README')).toBe('READ');
    expect(postkitFileCardMark('a.pdf', 'Slides')).toBe('Slid');
  });
});

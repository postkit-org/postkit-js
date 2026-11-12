// @vitest-environment node

import { renderToStaticMarkup } from 'react-dom/server';

import {
  FileTree,
  postkitFileTreeDepth,
  postkitFileTreeItems,
} from './file-tree.js';

describe('headless FileTree', () => {
  it('renders the entries, indented by depth', () => {
    const markup = renderToStaticMarkup(
      <FileTree
        title="Files"
        items={JSON.stringify([
          { path: 'src', type: 'folder' },
          { path: 'src/a.ts', meta: '2 KB' },
        ])}
      />,
    );

    expect(markup).toBe(
      '<div data-postkit-component="FileTree" data-postkit-part="root" data-size="md" data-variant="subtle">' +
        '<p data-postkit-part="title">Files</p><ul data-postkit-part="list">' +
        '<li data-postkit-part="item" style="padding-inline-start:0em">' +
        '<span data-postkit-part="icon" aria-hidden="true">▸</span><span data-postkit-part="path">src</span></li>' +
        '<li data-postkit-part="item" style="padding-inline-start:1.25em">' +
        '<span data-postkit-part="icon" aria-hidden="true">·</span><span data-postkit-part="path">a.ts</span>' +
        '<span data-postkit-part="meta">2 KB</span></li></ul></div>',
    );
  });

  it('parses JSON items and rejects anything but an array', () => {
    const item = { path: 'a/b/c.ts' };
    const items = [item];
    expect(postkitFileTreeItems(items)).toBe(items);
    expect(postkitFileTreeDepth(item)).toBe(2);
    expect(() => postkitFileTreeItems('{')).toThrow(
      'Postkit FileTree items must contain valid JSON.',
    );
    expect(() => postkitFileTreeItems('{}')).toThrow(
      'Postkit FileTree items must contain a JSON array.',
    );
  });
});

import {
  parsePostkitFenceMeta,
  resolvePostkitFenceMetadata,
} from './fence-metadata.js';

describe('fenced code metadata', () => {
  it('parses the supported literal fence options', () => {
    expect(
      parsePostkitFenceMeta(
        'title="answer.ts" showLineNumbers wrap {1, 3-5} maxHeight="24rem"',
      ),
    ).toEqual({
      filename: 'answer.ts',
      highlightLines: '1, 3-5',
      lineNumbers: true,
      maxHeight: '24rem',
      wrap: true,
    });

    expect(parsePostkitFenceMeta('noLineNumbers noWrap')).toMatchObject({
      lineNumbers: false,
      wrap: false,
    });
  });

  it('lets explicit attributes override the metadata string', () => {
    expect(
      resolvePostkitFenceMetadata(
        {
          filename: 'explicit.ts',
          lineNumbers: 'false',
          meta: 'title="metadata.ts" lineNumbers wrap',
        },
        { filename: 'child.ts', wrap: 'false' },
      ),
    ).toMatchObject({
      filename: 'explicit.ts',
      lineNumbers: false,
      wrap: false,
    });
  });

  it('rejects non-literal maximum-height expressions', () => {
    expect(
      parsePostkitFenceMeta('maxHeight="url(https://example.com/value)"')
        .maxHeight,
    ).toBeUndefined();
    expect(
      resolvePostkitFenceMetadata(
        { maxHeight: 'calc(100vh - 2rem)' },
        { maxHeight: '32rem' },
      ).maxHeight,
    ).toBe('32rem');
  });
});

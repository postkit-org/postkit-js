import { childElements, parseXml, textContent, XmlSyntaxError } from './xml.js';

describe('parseXml', () => {
  it('reads elements, attributes, entities and CDATA', () => {
    const root = parseXml(
      `<?xml version="1.0" encoding="UTF-8"?>
<!-- a comment -->
<rss version="2.0" xmlns:content="x">
  <channel>
    <title>A &amp; B &#38; C &#x26; D</title>
    <item><content:encoded><![CDATA[<p>Hi]]]]><![CDATA[></p>]]></content:encoded></item>
    <empty />
  </channel>
</rss>`,
    );
    expect(root.name).toBe('rss');
    expect(root.attributes).toEqual({ version: '2.0', 'xmlns:content': 'x' });
    const [channel] = childElements(root, 'channel');
    expect(textContent(childElements(channel, 'title')[0])).toBe(
      'A & B & C & D',
    );
    const [item] = childElements(channel, 'item');
    expect(textContent(item)).toBe('<p>Hi]]></p>');
    expect(childElements(channel, 'empty')).toHaveLength(1);
  });

  it.each([
    ['a mismatched end tag', '<a><b></a></b>'],
    ['an unclosed element', '<a><b></b>'],
    ['two roots', '<a></a><b></b>'],
    ['an unescaped ampersand', '<a>Fish & chips</a>'],
    ['an unknown entity', '<a>&nbsp;</a>'],
    ['a duplicate attribute', '<a x="1" x="2"></a>'],
    ['an unquoted attribute', '<a x=1></a>'],
    ['"<" in an attribute', '<a x="<"></a>'],
    ['text outside the root', 'hello <a></a>'],
    ['a DTD', '<!DOCTYPE a><a></a>'],
    ['no root', '<?xml version="1.0"?>'],
  ])('rejects %s', (_, source) => {
    expect(() => parseXml(source)).toThrow(XmlSyntaxError);
  });
});

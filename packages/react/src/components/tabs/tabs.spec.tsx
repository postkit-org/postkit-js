// @vitest-environment node

import { renderToStaticMarkup } from 'react-dom/server';

import { CodeGroup } from '../code-group/code-group.js';
import { Tabs } from './tabs.js';

describe('headless Tabs', () => {
  it('renders a labelled tablist and one visible panel per tab', () => {
    const markup = renderToStaticMarkup(
      <Tabs
        items='[{"label":"A","content":"a"},{"id":"b","label":"B","content":"b"}]'
        initialIndex="1"
        size="sm"
        classNames={{ tab: 'tab' }}
      />,
    );

    expect(markup).toContain('data-postkit-component="Tabs"');
    expect(markup).toContain('data-size="sm"');
    expect(markup).toContain('role="tablist"');
    expect(markup).toContain('aria-label="Tabbed content"');
    expect(markup.match(/role="tab"/g)).toHaveLength(2);
    expect(markup.match(/class="tab"/g)).toHaveLength(2);
    expect(markup).toContain('<div data-postkit-part="panels">');
    expect(markup).toMatch(
      /aria-selected="true"[^>]*data-value="b"|data-value="b"[^>]*aria-selected="true"/,
    );
    expect(markup.match(/role="tabpanel"/g)).toHaveLength(2);
  });

  it('rejects items that are not a JSON array', () => {
    expect(() => renderToStaticMarkup(<Tabs items="{}" />)).toThrow(
      'Postkit Tabs items must contain a JSON array.',
    );
  });
});

describe('headless CodeGroup', () => {
  it('renders a CodeBlock in each tab panel', () => {
    const markup = renderToStaticMarkup(
      <CodeGroup
        label="Install"
        items={[
          { label: 'npm', code: 'npm i', language: 'sh' },
          { label: 'pnpm', code: 'pnpm add' },
        ]}
      />,
    );

    expect(markup).toContain('data-postkit-component="CodeGroup"');
    expect(markup).toContain('aria-label="Install"');
    expect(markup.match(/data-postkit-component="CodeBlock"/g)).toHaveLength(2);
    expect(markup).toContain('data-variant="plain"');
  });
});

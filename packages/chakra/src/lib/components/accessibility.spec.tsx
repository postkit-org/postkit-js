/**
 * @jest-environment jsdom
 */

import { render } from '@testing-library/react';
import type { ReactNode } from 'react';

import { PostkitProvider } from '../postkit-provider.js';
import { postkitDefaultTheme } from '../theme.js';
import { Chart } from '../../components/chart/chart.js';
import { postkitProseComponents } from './prose.js';
import { CodeBlock } from '../../components/code-block/code-block.js';
import { CodeGroup } from '../../components/code-group/code-group.js';
import { Diff } from '../../components/diff/diff.js';
import { Terminal } from '../../components/terminal/terminal.js';
import { Comparison } from '../../components/comparison/comparison.js';
import { Stat } from '../../components/stat/stat.js';

globalThis.structuredClone ??= <T,>(value: T): T =>
  value === undefined ? value : (JSON.parse(JSON.stringify(value)) as T);

function renderWithPreset(children: ReactNode) {
  return render(
    <PostkitProvider preset={postkitDefaultTheme}>{children}</PostkitProvider>,
  );
}

/** Roles that allow `aria-expanded` (WAI-ARIA 1.2), plus native buttons. */
const expandableRoles = new Set([
  'application',
  'button',
  'checkbox',
  'combobox',
  'gridcell',
  'link',
  'listbox',
  'menuitem',
  'row',
  'rowheader',
  'columnheader',
  'tab',
  'treeitem',
]);

function accessibleName(element: Element): string | undefined {
  const labelledBy = element.getAttribute('aria-labelledby');
  if (labelledBy) {
    return labelledBy
      .split(/\s+/)
      .map((id) => element.ownerDocument.getElementById(id)?.textContent)
      .join(' ')
      .trim();
  }
  return element.getAttribute('aria-label') ?? undefined;
}

describe('Postkit accessibility', () => {
  it('puts aria-expanded only on elements whose role allows it (P3)', () => {
    const { container } = renderWithPreset(
      <>
        <CodeBlock code="const answer = 42;" language="ts" filename="a.ts" />
        <CodeBlock code="npm test" copy={false} />
        <CodeGroup
          items={[
            { label: 'npm', code: 'npm install @postkit/chakra' },
            { label: 'pnpm', code: 'pnpm add @postkit/chakra' },
          ]}
        />
        <Terminal command="npm test" output="ok" />
      </>,
    );

    const offenders = Array.from(
      container.querySelectorAll('[aria-expanded]'),
    ).filter((element) => {
      const role =
        element.getAttribute('role') ??
        (element.tagName === 'BUTTON' ? 'button' : undefined);
      return !role || !expandableRoles.has(role);
    });

    expect(offenders.map((element) => element.outerHTML)).toEqual([]);
    expect(
      container
        .querySelector('.postkit-code-block__content')
        ?.hasAttribute('aria-expanded'),
    ).toBe(false);
  });

  it('gives Stat a valid definition list (P7)', () => {
    const { container } = renderWithPreset(
      <Stat
        value="98%"
        label="Reader completion"
        trend="+4%"
        description="Since the redesign"
      />,
    );
    const list = container.querySelector('dl') as HTMLDListElement;
    const children = Array.from(list.children);

    expect(children.map((child) => child.tagName)).toEqual([
      'DT',
      'DD',
      'DD',
      'DD',
    ]);
    expect(children.map((child) => child.textContent)).toEqual([
      'Reader completion',
      '98%',
      '+4%',
      'Since the redesign',
    ]);
  });

  it('keeps a Stat without help text valid', () => {
    const { container } = renderWithPreset(
      <Stat value="12" label="Releases" />,
    );
    const list = container.querySelector('dl') as HTMLDListElement;

    expect(Array.from(list.children).map((child) => child.tagName)).toEqual([
      'DT',
      'DD',
    ]);
  });

  it('makes scrollable regions keyboard-focusable and named (P6)', () => {
    const Table = postkitProseComponents.table;
    const { container } = renderWithPreset(
      <>
        <Chart
          title="Readers"
          data={[
            { label: 'Mon', readers: 3 },
            { label: 'Tue', readers: 5 },
          ]}
        />
        <Comparison
          title="Plans"
          columns={['Free', 'Pro']}
          items={[{ label: 'Previews', values: [true, true] }]}
        />
        <Comparison
          columns={['Free', 'Pro']}
          items={[{ label: 'Previews', values: [true, true] }]}
        />
        <Diff diff={'-a\n+b'} title="config.ts" />
        <Diff diff={'-a\n+b'} />
        <Table>
          <tbody>
            <tr>
              <td>Cell</td>
            </tr>
          </tbody>
        </Table>
      </>,
    );

    const regions = [
      ...container.querySelectorAll('.postkit-chart__plot'),
      ...container.querySelectorAll('.postkit-comparison__scroller'),
      ...container.querySelectorAll('.postkit-diff__code'),
    ];
    expect(regions).toHaveLength(5);
    expect(
      regions.map((region) => ({
        tabIndex: region.getAttribute('tabindex'),
        role: region.getAttribute('role'),
        name: accessibleName(region),
      })),
    ).toEqual([
      { tabIndex: '0', role: 'region', name: 'Readers' },
      { tabIndex: '0', role: 'region', name: 'Plans' },
      { tabIndex: '0', role: 'region', name: 'Comparison' },
      { tabIndex: '0', role: 'region', name: 'config.ts' },
      { tabIndex: '0', role: 'region', name: 'Diff' },
    ]);

    // A prose table keeps its table role and becomes focusable.
    const table = container.querySelector(
      '[data-postkit-prose-element="table"]',
    );
    expect(table?.tagName).toBe('TABLE');
    expect(table?.getAttribute('tabindex')).toBe('0');
    expect(table?.hasAttribute('role')).toBe(false);
  });
});

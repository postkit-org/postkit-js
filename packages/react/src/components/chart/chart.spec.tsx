// @vitest-environment node

import { chartDefinition } from '@postkit/core/components';
import { renderToStaticMarkup } from 'react-dom/server';

import { Chart, postkitChartLayout } from './chart.js';

const data = '[{"label":"Jan","a":1,"b":3},{"label":"Feb","a":2,"b":5}]';

describe('postkitChartLayout', () => {
  it('infers series from the first record and lays out bars', () => {
    const layout = postkitChartLayout({ data });

    expect(layout.empty).toBe(false);
    expect(layout.viewBox).toBe('0 0 640 320');
    expect(layout.series).toEqual([
      {
        key: 'a',
        label: 'a',
        color: 'var(--chakra-colors-blue-fg, currentColor)',
      },
      {
        key: 'b',
        label: 'b',
        color: 'var(--chakra-colors-purple-fg, currentColor)',
      },
    ]);
    expect(layout.gridLines.map((line) => line.value)).toEqual([5, 2.5, 0]);
    expect(layout.categories.map((category) => category.x)).toEqual([197, 479]);
    expect(layout.bars).toHaveLength(4);
    expect(layout.bars[0]).toMatchObject({
      key: 'Jan:a',
      y: 219.20000000000002,
      height: 48.79999999999998,
      title: 'Jan, a: 1',
    });
    expect(layout.lines).toEqual([]);
    expect(layout.rows[1]).toEqual({
      key: 'Feb',
      label: 'Feb',
      values: [
        { key: 'a', value: 2 },
        { key: 'b', value: 5 },
      ],
    });
  });

  it('lays out lines with configured series and treats missing values as 0', () => {
    const layout = postkitChartLayout({
      data: [{ label: 'Jan', a: 'n/a' }],
      series: '[{"key":"a","label":"Visits","color":"red"}]',
      type: 'line',
    });

    expect(layout.bars).toEqual([]);
    expect(layout.lines).toEqual([
      {
        key: 'a',
        color: 'red',
        path: 'M 338 268',
        points: [
          {
            key: 'Jan:a',
            x: 338,
            y: 268,
            color: 'red',
            title: 'Jan, Visits: 0',
          },
        ],
      },
    ]);
  });

  it('is empty without records or numeric series', () => {
    expect(postkitChartLayout({ data: [] }).empty).toBe(true);
    expect(
      postkitChartLayout({ data: [{ label: 'x', note: 'text' }] }).empty,
    ).toBe(true);
  });
});

describe('headless Chart', () => {
  it('renders a labelled plot, a legend and the source table', () => {
    expect(Chart.definition).toBe(chartDefinition);
    const markup = renderToStaticMarkup(
      <Chart title="Visits" description="Per month" data={data} showTable />,
    );

    expect(markup).toContain(
      '<figure data-postkit-component="Chart" data-postkit-part="root" data-size="md" data-variant="subtle">',
    );
    expect(markup).toMatch(
      /<h3 data-postkit-part="title" id="([^"]+)-title">Visits<\/h3>/,
    );
    expect(markup).toContain(
      '<div data-postkit-part="legend" aria-label="Chart legend">',
    );
    expect(markup).toContain(
      '<span data-postkit-part="legendSwatch" style="background:var(--chakra-colors-blue-fg, currentColor)" aria-hidden="true"></span>',
    );
    expect(markup).toMatch(
      /<svg data-postkit-part="svg" role="img" aria-labelledby="[^"]+-title [^"]+-title-description" viewBox="0 0 640 320">/,
    );
    expect(markup.match(/data-postkit-part="seriesMark"/g)).toHaveLength(4);
    expect(markup).toContain('<title>Feb, b: 5</title>');
    expect(markup).toContain(
      '<th data-postkit-part="rowHeader" scope="row">Jan</th>',
    );
    expect(markup).toContain('<td data-postkit-part="dataCell">5</td>');
  });

  it('renders a line chart without a table, and an empty state', () => {
    const line = renderToStaticMarkup(
      <Chart title="T" data={data} type="line" showTable="false" />,
    );
    const empty = renderToStaticMarkup(<Chart title="T" data="[]" showTable />);

    expect(line).toContain('<path data-postkit-part="seriesMark"');
    expect(line.match(/<circle data-postkit-part="seriesMark"/g)).toHaveLength(
      4,
    );
    expect(line).not.toContain('data-postkit-part="table"');
    expect(empty).toContain(
      '<p data-postkit-part="emptyState">This chart does not contain any numeric data.</p>',
    );
    expect(empty).not.toContain('data-postkit-part="plot"');
    expect(empty).not.toContain('data-postkit-part="tableContainer"');
  });
});

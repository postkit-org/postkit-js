import { chartDefinition, type PostkitSlotOf } from '@postkit/core/components';
import { useId } from 'react';

import { parseJsonProp } from '../../lib/json-props.js';
import { postkitView, type PostkitViewProps } from '../../lib/view.js';

/** One labelled record; every numeric field can be a series. */
export interface ChartDatum {
  readonly label: string;
  readonly [key: string]: string | number;
}

/** A value to graph: a record key, with an optional label and colour. */
export interface ChartSeries {
  readonly key: string;
  readonly label?: string;
  readonly color?: string;
}

/** A series with its label and colour resolved. */
export interface PostkitChartLayoutSeries {
  readonly key: string;
  readonly label: string;
  readonly color: string;
}

/** A point on the chart, with its accessible description. */
export interface PostkitChartMark {
  readonly key: string;
  readonly x: number;
  readonly y: number;
  readonly color: string;
  readonly title: string;
}

/**
 * Everything a renderer needs to draw a Chart: the parsed records, the
 * resolved series and the SVG geometry. Renderers share it so they draw the
 * same chart.
 */
export interface PostkitChartLayout {
  readonly records: readonly ChartDatum[];
  readonly series: readonly PostkitChartLayoutSeries[];
  /** No records or no numeric series: render the empty state. */
  readonly empty: boolean;
  readonly viewBox: string;
  /** Horizontal grid lines with their value labels, top to bottom. */
  readonly gridLines: readonly {
    readonly key: number;
    readonly x1: number;
    readonly x2: number;
    readonly y: number;
    readonly labelX: number;
    readonly value: number;
  }[];
  /** One category label per record, under the plot. */
  readonly categories: readonly {
    readonly key: string;
    readonly x: number;
    readonly y: number;
    readonly label: string;
  }[];
  /** Bars, for a bar chart. */
  readonly bars: readonly (PostkitChartMark & {
    readonly width: number;
    readonly height: number;
  })[];
  /** One path and its points per series, for a line chart. */
  readonly lines: readonly {
    readonly key: string;
    readonly color: string;
    readonly path: string;
    readonly points: readonly PostkitChartMark[];
  }[];
  /** The source-data table: one row per record, one value per series. */
  readonly rows: readonly {
    readonly key: string;
    readonly label: string;
    readonly values: readonly {
      readonly key: string;
      readonly value: number;
    }[];
  }[];
}

/**
 * Series colours when the author gives none: the `--postkit-chart-1` to `-4`
 * custom properties, which `styles.css` defines for light and dark. Without
 * them, each falls back to a mid-tone of the same hue that keeps at least
 * 3.9:1 against both a white and a near-black page, so an unstyled chart
 * still reads in either colour mode.
 */
export const postkitChartColors = Object.freeze([
  'var(--postkit-chart-1, #5b7fb0)',
  'var(--postkit-chart-2, #a8761e)',
  'var(--postkit-chart-3, #3f8a5c)',
  'var(--postkit-chart-4, #7a7a84)',
] as const);

const WIDTH = 640;
const HEIGHT = 320;
const LEFT = 56;
const RIGHT = 20;
const TOP = 24;
const BOTTOM = 52;

function numericValue(datum: ChartDatum, key: string): number {
  const value = datum[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function inferredSeries(data: readonly ChartDatum[]): ChartSeries[] {
  const first = data[0];
  if (!first) return [];
  return Object.entries(first)
    .filter(([key, value]) => key !== 'label' && typeof value === 'number')
    .map(([key]) => ({ key, label: key }));
}

/**
 * Lays out a Chart on a 640 × 320 SVG viewBox. `data` and `series` take
 * arrays or JSON array strings; without `series`, every numeric field of the
 * first record is one.
 */
export function postkitChartLayout(options: {
  readonly data: string | readonly ChartDatum[];
  readonly series?: string | readonly ChartSeries[];
  readonly type?: 'bar' | 'line';
  /**
   * Colours for series without an authored `color`, used in turn. Defaults
   * to {@link postkitChartColors}; `@postkit/chakra` passes its own tokens.
   */
  readonly palette?: readonly string[];
}): PostkitChartLayout {
  const records = parseJsonProp<ChartDatum>(options.data, 'Chart data');
  const palette = options.palette?.length
    ? options.palette
    : postkitChartColors;
  const series = (
    options.series
      ? parseJsonProp<ChartSeries>(options.series, 'Chart series')
      : inferredSeries(records)
  ).map((item, index) => ({
    key: item.key,
    label: item.label ?? item.key,
    color: item.color ?? palette[index % palette.length] ?? 'currentColor',
  }));
  const plotWidth = WIDTH - LEFT - RIGHT;
  const plotHeight = HEIGHT - TOP - BOTTOM;
  const maximum = Math.max(
    1,
    ...records.flatMap((datum) =>
      series.map((item) => numericValue(datum, item.key)),
    ),
  );
  const xStep = records.length > 0 ? plotWidth / records.length : plotWidth;
  const yFor = (value: number) => TOP + plotHeight * (1 - value / maximum);
  const markTitle = (datum: ChartDatum, item: PostkitChartLayoutSeries) =>
    `${datum.label}, ${item.label}: ${numericValue(datum, item.key)}`;
  const groupWidth = xStep * 0.72;
  const barWidth = groupWidth / series.length;

  return {
    records,
    series,
    empty: records.length === 0 || series.length === 0,
    viewBox: `0 0 ${WIDTH} ${HEIGHT}`,
    gridLines: [0, 0.5, 1].map((fraction) => {
      const y = TOP + plotHeight * fraction;
      return {
        key: fraction,
        x1: LEFT,
        x2: WIDTH - RIGHT,
        y,
        labelX: LEFT - 8,
        value: Math.round(maximum * (1 - fraction) * 100) / 100,
      };
    }),
    categories: records.map((datum, datumIndex) => ({
      key: `${datum.label}:label`,
      x: LEFT + xStep * (datumIndex + 0.5),
      y: HEIGHT - 20,
      label: datum.label,
    })),
    bars:
      options.type === 'line'
        ? []
        : records.flatMap((datum, datumIndex) =>
            series.map((item, seriesIndex) => {
              const y = yFor(numericValue(datum, item.key));
              return {
                key: `${datum.label}:${item.key}`,
                x:
                  LEFT +
                  xStep * datumIndex +
                  (xStep - groupWidth) / 2 +
                  barWidth * seriesIndex,
                y,
                width: Math.max(1, barWidth - 2),
                height: TOP + plotHeight - y,
                color: item.color,
                title: markTitle(datum, item),
              };
            }),
          ),
    lines:
      options.type === 'line'
        ? series.map((item) => {
            const points = records.map((datum, datumIndex) => ({
              key: `${datum.label}:${item.key}`,
              x: LEFT + xStep * (datumIndex + 0.5),
              y: yFor(numericValue(datum, item.key)),
              color: item.color,
              title: markTitle(datum, item),
            }));
            return {
              key: item.key,
              color: item.color,
              path: points
                .map(
                  (point, index) =>
                    `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`,
                )
                .join(' '),
              points,
            };
          })
        : [],
    rows: records.map((datum) => ({
      key: datum.label,
      label: datum.label,
      values: series.map((item) => ({
        key: item.key,
        value: numericValue(datum, item.key),
      })),
    })),
  };
}

export type ChartSlot = PostkitSlotOf<typeof chartDefinition>;

export type ChartProps = Omit<
  PostkitViewProps<typeof chartDefinition>,
  'data' | 'series'
> & {
  /** The records, as an array or a JSON array string. */
  readonly data: string | readonly ChartDatum[];
  /** The values to graph, as an array or a JSON array string. */
  readonly series?: string | readonly ChartSeries[];
};

/**
 * An accessible SVG bar or line chart with a legend for several series and an
 * optional source-data table. Headless markup only; series colours apply as
 * presentation attributes.
 */
export const Chart = postkitView<typeof chartDefinition, ChartProps>(
  chartDefinition,
  ({ props, part }) => {
    const titleId = `${useId()}-title`;
    const descriptionId = `${titleId}-description`;
    const layout = postkitChartLayout(props);
    const showTable =
      props.showTable === true || String(props.showTable) === 'true';

    return (
      <figure {...part('root')}>
        <h3 {...part('title')} id={titleId}>
          {props.title}
        </h3>
        {props.description ? (
          <p {...part('description')} id={descriptionId}>
            {props.description}
          </p>
        ) : null}
        {layout.series.length > 1 ? (
          <div {...part('legend')} aria-label="Chart legend">
            {layout.series.map((item) => (
              <div key={item.key} {...part('legendItem')}>
                <span
                  {...part('legendSwatch', {
                    style: { background: item.color },
                  })}
                  aria-hidden="true"
                />
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        ) : null}
        {layout.empty ? (
          <p {...part('emptyState')}>
            This chart does not contain any numeric data.
          </p>
        ) : (
          // The plot can scroll sideways, so keyboard users need to reach it.
          <div
            {...part('plot')}
            tabIndex={0}
            role="region"
            aria-labelledby={titleId}
          >
            <svg
              {...part('svg')}
              role="img"
              aria-labelledby={
                props.description ? `${titleId} ${descriptionId}` : titleId
              }
              viewBox={layout.viewBox}
            >
              {layout.gridLines.map((line) => (
                <g key={line.key}>
                  <line
                    {...part('gridLine')}
                    x1={line.x1}
                    x2={line.x2}
                    y1={line.y}
                    y2={line.y}
                  />
                  <text
                    {...part('axisLabel')}
                    x={line.labelX}
                    y={line.y + 4}
                    textAnchor="end"
                    fontSize="12"
                  >
                    {line.value}
                  </text>
                </g>
              ))}
              {layout.categories.map((category) => (
                <text
                  key={category.key}
                  {...part('axisLabel')}
                  x={category.x}
                  y={category.y}
                  textAnchor="middle"
                  fontSize="12"
                >
                  {category.label}
                </text>
              ))}
              {layout.bars.map((bar) => (
                <rect
                  key={bar.key}
                  {...part('seriesMark')}
                  x={bar.x}
                  y={bar.y}
                  width={bar.width}
                  height={bar.height}
                  rx="2"
                  fill={bar.color}
                >
                  <title>{bar.title}</title>
                </rect>
              ))}
              {layout.lines.map((line) => (
                <g key={line.key}>
                  <path
                    {...part('seriesMark')}
                    d={line.path}
                    fill="none"
                    stroke={line.color}
                    strokeWidth="3"
                    strokeLinejoin="round"
                  />
                  {line.points.map((point) => (
                    <circle
                      key={point.key}
                      {...part('seriesMark')}
                      cx={point.x}
                      cy={point.y}
                      r="5"
                      fill={point.color}
                      stroke="Canvas"
                      strokeWidth="2"
                    >
                      <title>{point.title}</title>
                    </circle>
                  ))}
                </g>
              ))}
            </svg>
          </div>
        )}
        {showTable && !layout.empty ? (
          <div {...part('tableContainer')}>
            <table {...part('table')}>
              <thead>
                <tr>
                  <th {...part('headerCell')}>Label</th>
                  {layout.series.map((item) => (
                    <th key={item.key} {...part('headerCell')}>
                      {item.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {layout.rows.map((row) => (
                  <tr key={row.key}>
                    <th {...part('rowHeader')} scope="row">
                      {row.label}
                    </th>
                    {row.values.map((cell) => (
                      <td key={cell.key} {...part('dataCell')}>
                        {cell.value}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </figure>
    );
  },
);

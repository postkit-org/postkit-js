'use client';

import {
  Box,
  Flex,
  Heading,
  Table,
  Text,
  chakra,
  type BoxProps,
  type RecipeVariantProps,
  type UnstyledProp,
} from '@chakra-ui/react';
import { useId } from 'react';

import { parseJsonProp } from '../json-props.js';
import {
  postkitChartRecipe,
  type PostkitChartSlot,
} from '../recipes/chart.recipe.js';
import {
  postkitSlotClassName,
  type PostkitSlotStyles,
  usePostkitSlotRecipe,
} from '../recipes/types.js';
import { postkitRecipeKeys } from '../theme.js';
import { postkitHeadingSize } from './heading-size.js';

export interface ChartDatum {
  readonly label: string;
  readonly [key: string]: string | number;
}

export interface ChartSeries {
  readonly key: string;
  readonly label?: string;
  readonly color?: string;
}

export type ChartProps = {
  readonly data: string | readonly ChartDatum[];
  readonly series?: string | readonly ChartSeries[];
  readonly title: string;
  readonly description?: string;
  readonly type?: 'bar' | 'line';
  readonly showTable?: boolean | string;
  readonly rootProps?: BoxProps;
  readonly slotStyles?: PostkitSlotStyles<PostkitChartSlot>;
} & RecipeVariantProps<typeof postkitChartRecipe> &
  UnstyledProp;

const DEFAULT_COLORS = [
  'var(--chakra-colors-blue-500, #3182ce)',
  'var(--chakra-colors-purple-500, #805ad5)',
  'var(--chakra-colors-teal-500, #319795)',
  'var(--chakra-colors-orange-500, #dd6b20)',
] as const;

function numericValue(datum: ChartDatum, key: string): number {
  const value = datum[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function inferredSeries(data: readonly ChartDatum[]): ChartSeries[] {
  const first = data[0];
  if (!first) {
    return [];
  }

  return Object.entries(first)
    .filter(([key, value]) => key !== 'label' && typeof value === 'number')
    .map(([key]) => ({ key, label: key }));
}

function shouldShowTable(value: boolean | string | undefined): boolean {
  return value === true || value === 'true';
}

export function Chart({
  data,
  series,
  title,
  description,
  type = 'bar',
  showTable = false,
  rootProps,
  slotStyles,
  size,
  variant,
  unstyled,
}: ChartProps) {
  const titleId = `${useId()}-title`;
  const descriptionId = `${titleId}-description`;
  const recipe = usePostkitSlotRecipe(
    postkitRecipeKeys.chart,
    postkitChartRecipe,
  );
  const styles: PostkitSlotStyles<PostkitChartSlot> = unstyled
    ? {}
    : recipe({ size, variant });
  const {
    css: rootCss,
    className: rootClassName,
    ...restRootProps
  } = rootProps ?? {};
  const records = parseJsonProp<ChartDatum>(data, 'Chart data');
  const configuredSeries = series
    ? parseJsonProp<ChartSeries>(series, 'Chart series')
    : inferredSeries(records);
  const width = 640;
  const height = 320;
  const left = 56;
  const right = 20;
  const top = 24;
  const bottom = 52;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const maximum = Math.max(
    1,
    ...records.flatMap((datum) =>
      configuredSeries.map((item) => numericValue(datum, item.key)),
    ),
  );
  const xStep = records.length > 0 ? plotWidth / records.length : plotWidth;
  const yFor = (value: number) => top + plotHeight * (1 - value / maximum);

  return (
    <Box
      data-postkit-component="Chart"
      as="figure"
      {...restRootProps}
      className={postkitSlotClassName(recipe.classNameMap.root, rootClassName)}
      css={[styles.root, slotStyles?.root, rootCss]}
    >
      <Heading
        id={titleId}
        as="h3"
        size={postkitHeadingSize(size, { sm: 'md', md: 'lg', lg: 'xl' })}
        className={recipe.classNameMap.title}
        css={[styles.title, slotStyles?.title]}
      >
        {title}
      </Heading>
      {description ? (
        <Text
          id={descriptionId}
          className={recipe.classNameMap.description}
          css={[styles.description, slotStyles?.description]}
        >
          {description}
        </Text>
      ) : null}
      {configuredSeries.length > 1 ? (
        <Flex
          aria-label="Chart legend"
          className={recipe.classNameMap.legend}
          css={[styles.legend, slotStyles?.legend]}
        >
          {configuredSeries.map((item, index) => (
            <Flex
              key={item.key}
              className={recipe.classNameMap.legendItem}
              css={[styles.legendItem, slotStyles?.legendItem]}
            >
              <Box
                aria-hidden="true"
                background={
                  item.color ?? DEFAULT_COLORS[index % DEFAULT_COLORS.length]
                }
                className={recipe.classNameMap.legendSwatch}
                css={[styles.legendSwatch, slotStyles?.legendSwatch]}
              />
              <Text>{item.label ?? item.key}</Text>
            </Flex>
          ))}
        </Flex>
      ) : null}
      {records.length === 0 || configuredSeries.length === 0 ? (
        <Text
          className={recipe.classNameMap.emptyState}
          css={[styles.emptyState, slotStyles?.emptyState]}
        >
          This chart does not contain any numeric data.
        </Text>
      ) : (
        <Box
          className={recipe.classNameMap.plot}
          css={[styles.plot, slotStyles?.plot]}
        >
          <chakra.svg
            role="img"
            aria-labelledby={
              description ? `${titleId} ${descriptionId}` : titleId
            }
            viewBox={`0 0 ${width} ${height}`}
            className={recipe.classNameMap.svg}
            css={[styles.svg, slotStyles?.svg]}
          >
            {[0, 0.5, 1].map((fraction) => {
              const y = top + plotHeight * fraction;
              const value = Math.round(maximum * (1 - fraction) * 100) / 100;
              return (
                <g key={fraction}>
                  <chakra.line
                    x1={left}
                    x2={width - right}
                    y1={y}
                    y2={y}
                    className={recipe.classNameMap.gridLine}
                    css={[styles.gridLine, slotStyles?.gridLine]}
                  />
                  <chakra.text
                    x={left - 8}
                    y={y + 4}
                    textAnchor="end"
                    fontSize="12"
                    className={recipe.classNameMap.axisLabel}
                    css={[styles.axisLabel, slotStyles?.axisLabel]}
                  >
                    {value}
                  </chakra.text>
                </g>
              );
            })}
            {records.map((datum, datumIndex) => (
              <chakra.text
                key={`${datum.label}:label`}
                x={left + xStep * (datumIndex + 0.5)}
                y={height - 20}
                textAnchor="middle"
                fontSize="12"
                className={recipe.classNameMap.axisLabel}
                css={[styles.axisLabel, slotStyles?.axisLabel]}
              >
                {datum.label}
              </chakra.text>
            ))}
            {type === 'bar'
              ? records.flatMap((datum, datumIndex) =>
                  configuredSeries.map((item, seriesIndex) => {
                    const value = numericValue(datum, item.key);
                    const groupWidth = xStep * 0.72;
                    const barWidth = groupWidth / configuredSeries.length;
                    const x =
                      left +
                      xStep * datumIndex +
                      (xStep - groupWidth) / 2 +
                      barWidth * seriesIndex;
                    const y = yFor(value);
                    return (
                      <chakra.rect
                        key={`${datum.label}:${item.key}`}
                        x={x}
                        y={y}
                        width={Math.max(1, barWidth - 2)}
                        height={top + plotHeight - y}
                        rx="2"
                        fill={
                          item.color ??
                          DEFAULT_COLORS[seriesIndex % DEFAULT_COLORS.length]
                        }
                        className={recipe.classNameMap.seriesMark}
                        css={[styles.seriesMark, slotStyles?.seriesMark]}
                      >
                        <title>{`${datum.label}, ${
                          item.label ?? item.key
                        }: ${value}`}</title>
                      </chakra.rect>
                    );
                  }),
                )
              : configuredSeries.map((item, seriesIndex) => {
                  const points = records.map((datum, datumIndex) => ({
                    datum,
                    value: numericValue(datum, item.key),
                    x: left + xStep * (datumIndex + 0.5),
                  }));
                  const path = points
                    .map(
                      (point, index) =>
                        `${index === 0 ? 'M' : 'L'} ${point.x} ${yFor(
                          point.value,
                        )}`,
                    )
                    .join(' ');
                  const color =
                    item.color ??
                    DEFAULT_COLORS[seriesIndex % DEFAULT_COLORS.length];
                  return (
                    <g key={item.key}>
                      <chakra.path
                        d={path}
                        fill="none"
                        stroke={color}
                        strokeWidth="3"
                        strokeLinejoin="round"
                        className={recipe.classNameMap.seriesMark}
                        css={[styles.seriesMark, slotStyles?.seriesMark]}
                      />
                      {points.map((point) => (
                        <chakra.circle
                          key={`${point.datum.label}:${item.key}`}
                          cx={point.x}
                          cy={yFor(point.value)}
                          r="5"
                          fill={color}
                          stroke="var(--chakra-colors-bg, white)"
                          strokeWidth="2"
                          className={recipe.classNameMap.seriesMark}
                          css={[styles.seriesMark, slotStyles?.seriesMark]}
                        >
                          <title>{`${point.datum.label}, ${
                            item.label ?? item.key
                          }: ${point.value}`}</title>
                        </chakra.circle>
                      ))}
                    </g>
                  );
                })}
          </chakra.svg>
        </Box>
      )}
      {shouldShowTable(showTable) &&
      records.length > 0 &&
      configuredSeries.length > 0 ? (
        <Box
          className={recipe.classNameMap.tableContainer}
          css={[styles.tableContainer, slotStyles?.tableContainer]}
        >
          <Table.Root
            size={size ?? 'md'}
            className={recipe.classNameMap.table}
            css={[styles.table, slotStyles?.table]}
          >
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader
                  textAlign="left"
                  className={recipe.classNameMap.headerCell}
                  css={[styles.headerCell, slotStyles?.headerCell]}
                >
                  Label
                </Table.ColumnHeader>
                {configuredSeries.map((item) => (
                  <Table.ColumnHeader
                    key={item.key}
                    textAlign="right"
                    className={recipe.classNameMap.headerCell}
                    css={[styles.headerCell, slotStyles?.headerCell]}
                  >
                    {item.label ?? item.key}
                  </Table.ColumnHeader>
                ))}
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {records.map((datum) => (
                <Table.Row key={datum.label}>
                  <Table.ColumnHeader
                    scope="row"
                    className={recipe.classNameMap.rowHeader}
                    css={[styles.rowHeader, slotStyles?.rowHeader]}
                  >
                    {datum.label}
                  </Table.ColumnHeader>
                  {configuredSeries.map((item) => (
                    <Table.Cell
                      key={item.key}
                      className={recipe.classNameMap.dataCell}
                      css={[styles.dataCell, slotStyles?.dataCell]}
                    >
                      {numericValue(datum, item.key)}
                    </Table.Cell>
                  ))}
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </Box>
      ) : null}
    </Box>
  );
}

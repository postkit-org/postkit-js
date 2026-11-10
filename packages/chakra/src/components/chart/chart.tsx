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
  type TableRootProps,
  type UnstyledProp,
} from '@chakra-ui/react';
import { chartDefinition } from '@postkit/core/components';
import { postkitChartLayout } from '@postkit/react';
import { useId } from 'react';

import { postkitHeadingSize } from '../../lib/components/heading-size.js';
import type { PostkitSlotStyles } from '../../lib/recipes/types.js';
import { postkitChakraView } from '../../lib/view.js';
import { postkitChartRecipe, type PostkitChartSlot } from './chart.recipe.js';

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
  /** A class per anatomy part, added after the recipe's class. */
  readonly classNames?: Partial<Readonly<Record<PostkitChartSlot, string>>>;
} & RecipeVariantProps<typeof postkitChartRecipe> &
  UnstyledProp;

function shouldShowTable(value: boolean | string | undefined): boolean {
  return value === true || value === 'true';
}

/** An accessible bar or line chart, styled by its Chakra recipe. */
export const Chart = postkitChakraView<typeof chartDefinition, ChartProps>(
  chartDefinition,
  postkitChartRecipe,
  ({ props, variants, part }) => {
    const titleId = `${useId()}-title`;
    const descriptionId = `${titleId}-description`;
    const { title, description } = props;
    const layout = postkitChartLayout(props);

    return (
      <Box as="figure" {...part('root')}>
        <Heading
          id={titleId}
          as="h3"
          size={postkitHeadingSize(variants['size'], {
            sm: 'md',
            md: 'lg',
            lg: 'xl',
          })}
          {...part('title')}
        >
          {title}
        </Heading>
        {description ? (
          <Text id={descriptionId} {...part('description')}>
            {description}
          </Text>
        ) : null}
        {layout.series.length > 1 ? (
          <Flex aria-label="Chart legend" {...part('legend')}>
            {layout.series.map((item) => (
              <Flex key={item.key} {...part('legendItem')}>
                <Box
                  aria-hidden="true"
                  background={item.color}
                  {...part('legendSwatch')}
                />
                <Text>{item.label}</Text>
              </Flex>
            ))}
          </Flex>
        ) : null}
        {layout.empty ? (
          <Text {...part('emptyState')}>
            This chart does not contain any numeric data.
          </Text>
        ) : (
          // The plot scrolls sideways on narrow screens, so keyboard users need to reach it.
          <Box
            tabIndex={0}
            role="region"
            aria-labelledby={titleId}
            {...part('plot')}
          >
            <chakra.svg
              role="img"
              aria-labelledby={
                description ? `${titleId} ${descriptionId}` : titleId
              }
              viewBox={layout.viewBox}
              {...part('svg')}
            >
              {layout.gridLines.map((line) => (
                <g key={line.key}>
                  <chakra.line
                    x1={line.x1}
                    x2={line.x2}
                    y1={line.y}
                    y2={line.y}
                    {...part('gridLine')}
                  />
                  <chakra.text
                    x={line.labelX}
                    y={line.y + 4}
                    textAnchor="end"
                    fontSize="12"
                    {...part('axisLabel')}
                  >
                    {line.value}
                  </chakra.text>
                </g>
              ))}
              {layout.categories.map((category) => (
                <chakra.text
                  key={category.key}
                  x={category.x}
                  y={category.y}
                  textAnchor="middle"
                  fontSize="12"
                  {...part('axisLabel')}
                >
                  {category.label}
                </chakra.text>
              ))}
              {layout.bars.map((bar) => (
                <chakra.rect
                  key={bar.key}
                  x={bar.x}
                  y={bar.y}
                  width={bar.width}
                  height={bar.height}
                  rx="2"
                  fill={bar.color}
                  {...part('seriesMark')}
                >
                  <title>{bar.title}</title>
                </chakra.rect>
              ))}
              {layout.lines.map((line) => (
                <g key={line.key}>
                  <chakra.path
                    d={line.path}
                    fill="none"
                    stroke={line.color}
                    strokeWidth="3"
                    strokeLinejoin="round"
                    {...part('seriesMark')}
                  />
                  {line.points.map((point) => (
                    <chakra.circle
                      key={point.key}
                      cx={point.x}
                      cy={point.y}
                      r="5"
                      fill={point.color}
                      stroke="var(--chakra-colors-bg, Canvas)"
                      strokeWidth="2"
                      {...part('seriesMark')}
                    >
                      <title>{point.title}</title>
                    </chakra.circle>
                  ))}
                </g>
              ))}
            </chakra.svg>
          </Box>
        )}
        {shouldShowTable(props.showTable) && !layout.empty ? (
          <Box {...part('tableContainer')}>
            <Table.Root
              size={(variants['size'] ?? 'md') as TableRootProps['size']}
              {...part('table')}
            >
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader textAlign="left" {...part('headerCell')}>
                    Label
                  </Table.ColumnHeader>
                  {layout.series.map((item) => (
                    <Table.ColumnHeader
                      key={item.key}
                      textAlign="right"
                      {...part('headerCell')}
                    >
                      {item.label}
                    </Table.ColumnHeader>
                  ))}
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {layout.rows.map((row) => (
                  <Table.Row key={row.key}>
                    <Table.ColumnHeader scope="row" {...part('rowHeader')}>
                      {row.label}
                    </Table.ColumnHeader>
                    {row.values.map((cell) => (
                      <Table.Cell key={cell.key} {...part('dataCell')}>
                        {cell.value}
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
  },
);

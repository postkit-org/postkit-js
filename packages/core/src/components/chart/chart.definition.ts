import { definePostkitComponent } from '../definition.js';
import { presentation, prop } from '../props.js';

export const chartDefinition = definePostkitComponent({
  name: 'Chart',
  directive: 'postkit-chart',
  category: 'technical-content',
  description: 'An accessible bar or line chart with optional data table.',
  runtime: 'static',
  stability: 'initial',
  props: {
    ...presentation,
    data: prop.json('A JSON array of labeled data records.', {
      required: true,
    }),
    series: prop.json('A JSON array describing the values to graph.'),
    title: prop.string('The visible and accessible chart title.', {
      required: true,
    }),
    description: prop.string('A concise explanation of the chart.'),
    type: prop.enum(['bar', 'line'], {
      description: 'The chart presentation.',
      default: 'bar',
    }),
    showTable: prop.boolean(
      'Whether to show an accessible source-data table.',
      { default: false },
    ),
  },
  slots: [
    'root',
    'title',
    'description',
    'legend',
    'legendItem',
    'legendSwatch',
    'plot',
    'svg',
    'gridLine',
    'axisLabel',
    'seriesMark',
    'emptyState',
    'tableContainer',
    'table',
    'headerCell',
    'rowHeader',
    'dataCell',
  ],
  example: {
    props: { data: [{ label: 'January', value: 12 }], title: 'chart example' },
  },
});

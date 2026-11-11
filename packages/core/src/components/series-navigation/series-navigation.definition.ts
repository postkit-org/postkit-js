import { definePostkitComponent } from '../definition.js';
import { presentation, prop } from '../props.js';
import { postkitBuiltInSlots } from '../slots.js';

export const seriesNavigationDefinition = definePostkitComponent({
  name: 'SeriesNavigation',
  directive: 'postkit-series-navigation',
  category: 'discovery',
  description: 'Previous and next navigation for a named article series.',
  runtime: 'static',
  stability: 'initial',
  email: { fallback: 'text' },
  props: {
    ...presentation,
    title: prop.string('The series title.', { required: true }),
    current: prop.number('The current article position.'),
    total: prop.number('The number of articles in the series.'),
    previous: prop.json('The previous article title and URL.'),
    next: prop.json('The next article title and URL.'),
  },
  slots: postkitBuiltInSlots.SeriesNavigation,
  example: {
    props: { title: 'series navigation example' },
  },
});

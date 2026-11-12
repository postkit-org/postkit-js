import { definePostkitComponent } from '../definition.js';
import { presentation, prop } from '../props.js';
import { postkitBuiltInSlots } from '../slots.js';

export const appearsOnDefinition = definePostkitComponent({
  name: 'AppearsOn',
  directive: 'postkit-appears-on',
  category: 'discovery',
  description:
    'A provenance-aware list of destinations where the post was syndicated.',
  runtime: 'static',
  stability: 'initial',
  email: { fallback: 'text' },
  props: {
    ...presentation,
    items: prop.json('A JSON array of syndicated publication references.', {
      required: true,
    }),
    label: prop.string('The accessible heading for the destination list.', {
      default: 'Appears on',
    }),
    presentation: prop.enum(['inline', 'list', 'badges', 'card'], {
      description: 'How syndicated destinations are arranged.',
      default: 'inline',
      themeVariant: true,
    }),
    showDates: prop.boolean('Whether publication dates are shown.', {
      default: false,
    }),
  },
  slots: postkitBuiltInSlots.AppearsOn,
  example: {
    props: {
      items: [{ name: 'Example publication', href: 'https://example.com' }],
    },
  },
});

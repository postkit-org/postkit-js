import { definePostkitComponent } from '../definition.js';
import { presentation, prop } from '../props.js';

export const audienceBoundaryDefinition = definePostkitComponent({
  name: 'AudienceBoundary',
  directive: 'postkit-audience-boundary',
  category: 'article-structure',
  description:
    'An authored audience marker with a host-controlled visibility boundary.',
  children: 'mdx',
  runtime: 'static',
  stability: 'initial',
  props: {
    ...presentation,
    audience: prop.string('The host-defined audience identifier.', {
      required: true,
    }),
    fallback: prop.string('Fallback copy for an unauthorized viewer.', {
      default: 'This section is available to a different audience.',
    }),
    showLabel: prop.boolean('Whether the audience label is visible.', {
      default: false,
    }),
  },
  slots: ['root', 'label', 'content', 'fallback'],
  example: {
    props: { audience: 'members' },
    children: 'Example content.',
  },
});

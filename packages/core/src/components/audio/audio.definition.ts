import { definePostkitComponent } from '../definition.js';
import { presentation, prop } from '../props.js';
import { postkitBuiltInSlots } from '../slots.js';

export const audioDefinition = definePostkitComponent({
  name: 'Audio',
  directive: 'postkit-audio',
  category: 'media',
  description: 'An accessible audio player with an optional caption.',
  runtime: 'native-controls',
  stability: 'initial',
  props: {
    ...presentation,
    src: prop.string('The audio file URL.', { required: true }),
    title: prop.string('An accessible title for the recording.', {
      required: true,
    }),
    caption: prop.string('Visible supporting text below the player.'),
    preload: prop.enum(['none', 'metadata', 'auto'], {
      description: 'Browser preload behavior.',
      default: 'metadata',
    }),
  },
  slots: postkitBuiltInSlots.Audio,
  example: {
    props: { src: '/media/episode.mp3', title: 'audio example' },
  },
});

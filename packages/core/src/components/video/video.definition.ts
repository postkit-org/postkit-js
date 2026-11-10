import { definePostkitComponent } from '../definition.js';
import { presentation, prop } from '../props.js';

export const videoDefinition = definePostkitComponent({
  name: 'Video',
  directive: 'postkit-video',
  category: 'media',
  description: 'A responsive HTML video player with caption support.',
  runtime: 'native-controls',
  stability: 'initial',
  props: {
    ...presentation,
    src: prop.string('The video file URL.', { required: true }),
    title: prop.string('An accessible title for the video.', {
      required: true,
    }),
    poster: prop.string('The preview image URL.'),
    caption: prop.string('Visible supporting text below the player.'),
    aspectRatio: prop.string('A CSS aspect ratio such as 16 / 9.', {
      default: '16 / 9',
    }),
    preload: prop.enum(['none', 'metadata', 'auto'], {
      description: 'Browser preload behavior.',
      default: 'metadata',
    }),
  },
  slots: ['root', 'frame', 'player', 'caption', 'fallback'],
  example: {
    props: { src: '/media/video.mp4', title: 'video example' },
  },
});

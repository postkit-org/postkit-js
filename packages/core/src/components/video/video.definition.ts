import { definePostkitComponent } from '../definition.js';
import { presentation, prop } from '../props.js';
import { postkitBuiltInSlots } from '../slots.js';

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
    captions: prop.string('The captions track (a WebVTT file URL).', {
      recommended: {
        reason:
          'Add a captions track (a WebVTT file), or mark the video decorative.',
        unless: ['decorative', 'tracks'],
      },
    }),
    captionsLang: prop.string(
      'The language of the captions track, such as en.',
    ),
    duration: prop.string(
      'The running time, such as 0:24 or 1:02:03, shown with the caption.',
    ),
    decorative: prop.boolean(
      'Marks a video without speech or meaningful sound, such as a silent loop, so it needs no captions track.',
    ),
  },
  slots: postkitBuiltInSlots.Video,
  example: {
    props: {
      src: '/media/video.mp4',
      title: 'video example',
      captions: '/media/video.vtt',
    },
  },
});

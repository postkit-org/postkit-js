import {
  calloutDefinition,
  definePostkitComponent,
  presentation,
  prop,
  type PostkitAuthoredPropsOf,
  type PostkitPropsOf,
  type PostkitSlotOf,
  type PostkitThemeVariantOf,
} from '@postkit/core/components';

interface ShowcaseScreen {
  readonly src: string;
  readonly alt: string;
}

/** A host-defined component, defined the same way as Postkit's built-ins. */
export const showcaseDefinition = definePostkitComponent({
  name: 'Showcase',
  directive: 'postkit-showcase',
  category: 'media',
  description: 'A screenshot framed in a phone or laptop.',
  runtime: 'static',
  stability: 'experimental',
  props: {
    ...presentation,
    frame: prop.enum(['phone', 'laptop'], {
      description: 'The device frame.',
      default: 'phone',
      themeVariant: true,
    }),
    screens: prop.json<readonly ShowcaseScreen[]>(
      'A JSON array of screenshots.',
      { required: true },
    ),
    caption: prop.string('Visible supporting text below the device.'),
  },
  slots: ['root', 'frame', 'screen', 'caption'],
  keywords: ['screenshot', 'mockup'],
  example: {
    props: {
      frame: 'laptop',
      screens: [{ src: '/media/editor.png', alt: 'The editor' }],
    },
  },
});

/** Authored props: `screens` is required, everything else optional. */
export type ShowcaseProps = PostkitAuthoredPropsOf<typeof showcaseDefinition>;
/** Props as the view receives them: defaulted props (`frame`) are set. */
export type ResolvedShowcaseProps = PostkitPropsOf<typeof showcaseDefinition>;
/** 'root' | 'frame' | 'screen' | 'caption' */
export type ShowcaseSlot = PostkitSlotOf<typeof showcaseDefinition>;
/** 'size' | 'variant' | 'frame' */
export type ShowcaseVariant = PostkitThemeVariantOf<typeof showcaseDefinition>;

export const exampleProps: ShowcaseProps = {
  screens: [{ src: '/media/home.png', alt: 'The home screen' }],
  frame: 'phone',
};

/** Built-in definitions are exported individually and as a registry. */
export const calloutSlots: readonly PostkitSlotOf<typeof calloutDefinition>[] =
  calloutDefinition.slots;

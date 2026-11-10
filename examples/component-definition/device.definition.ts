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

interface DeviceScreen {
  readonly src: string;
  readonly alt: string;
}

/** A host-defined component, defined the same way as Postkit's built-ins. */
export const deviceDefinition = definePostkitComponent({
  name: 'Device',
  directive: 'postkit-device',
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
    screens: prop.json<readonly DeviceScreen[]>(
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
export type DeviceProps = PostkitAuthoredPropsOf<typeof deviceDefinition>;
/** Props as the view receives them: defaulted props (`frame`) are set. */
export type ResolvedDeviceProps = PostkitPropsOf<typeof deviceDefinition>;
/** 'root' | 'frame' | 'screen' | 'caption' */
export type DeviceSlot = PostkitSlotOf<typeof deviceDefinition>;
/** 'size' | 'variant' | 'frame' */
export type DeviceVariant = PostkitThemeVariantOf<typeof deviceDefinition>;

export const exampleProps: DeviceProps = {
  screens: [{ src: '/media/home.png', alt: 'The home screen' }],
  frame: 'phone',
};

/** Built-in definitions are exported individually and as a registry. */
export const calloutSlots: readonly PostkitSlotOf<typeof calloutDefinition>[] =
  calloutDefinition.slots;

import { defineSlotRecipe } from '@chakra-ui/react';
import { deviceDefinition } from '@postkit/core/components';

/** The Device anatomy, from its definition. */
export const postkitDeviceSlots = deviceDefinition.slots;

export type PostkitDeviceSlot = (typeof postkitDeviceSlots)[number];

const frameWidth =
  'calc(var(--postkit-device-width) * var(--postkit-device-scale, 1))';

/**
 * A plain device frame drawn with CSS around the screenshot: a rounded,
 * surface-coloured bezel with a hairline edge, a notch for `iphone` and a
 * base for `mac`. Colours are semantic tokens, so it follows the colour mode.
 */
export const postkitDeviceRecipe = defineSlotRecipe({
  className: 'postkit-device',
  slots: postkitDeviceSlots,
  base: {
    root: {
      '--postkit-device-padding': '0.625rem',
      display: 'grid',
      // One column that can shrink, so a wide frame scales down on phones.
      gridTemplateColumns: 'minmax(0, 1fr)',
      justifyItems: 'center',
      margin: '0',
      minWidth: '0',
    },
    frame: {
      background: 'bg.emphasized',
      borderColor: 'border.emphasized',
      borderWidth: '1px',
      boxSizing: 'border-box',
      maxWidth: '100%',
      padding: 'var(--postkit-device-padding)',
      position: 'relative',
      width: frameWidth,
    },
    screen: {
      aspectRatio: 'var(--postkit-device-aspect)',
      background: 'bg',
      overflow: 'hidden',
    },
    image: {
      display: 'block',
      height: '100%',
      objectFit: 'cover',
      objectPosition: 'top center',
      width: '100%',
    },
    notch: {
      background: 'bg.emphasized',
      borderRadius: 'full',
      height: '1.375rem',
      left: '50%',
      position: 'absolute',
      top: 'calc(var(--postkit-device-padding) + 0.5rem)',
      transform: 'translateX(-50%)',
      width: '30%',
      zIndex: '1',
    },
    base: {
      background: 'bg.muted',
      borderBottomRadius: 'xl',
      borderColor: 'border.emphasized',
      borderWidth: '1px',
      boxSizing: 'border-box',
      display: 'block',
      height: '0.875rem',
      maxWidth: '100%',
      width: `calc(${frameWidth} * 1.16)`,
    },
    figcaption: {
      color: 'fg.muted',
      marginTop: '3',
      maxWidth: `calc(${frameWidth} * 1.16)`,
      textAlign: 'center',
    },
    number: { color: 'fg', fontWeight: 'semibold', marginEnd: '0.5em' },
    caption: {},
  },
  variants: {
    size: {
      sm: {
        root: { '--postkit-device-scale': '0.75' },
        figcaption: { fontSize: 'xs' },
      },
      md: { figcaption: { fontSize: 'sm' } },
      lg: {
        root: { '--postkit-device-scale': '1.25' },
        figcaption: { fontSize: 'md' },
      },
    },
    variant: {
      outline: {
        root: {
          borderColor: 'border',
          borderRadius: 'xl',
          borderWidth: '1px',
          paddingX: '4',
          paddingY: '6',
        },
      },
      subtle: {
        root: {
          background: 'bg.muted',
          borderRadius: 'xl',
          paddingX: '4',
          paddingY: '6',
        },
      },
      plain: {},
    },
    kind: {
      iphone: {
        root: {
          '--postkit-device-width': '17rem',
          '--postkit-device-aspect': '9 / 19.5',
        },
        frame: { borderRadius: '2.75rem' },
        screen: {
          borderRadius: 'calc(2.75rem - var(--postkit-device-padding))',
        },
      },
      ipad: {
        root: {
          '--postkit-device-width': '26rem',
          '--postkit-device-aspect': '3 / 4',
          '--postkit-device-padding': '0.875rem',
        },
        frame: { borderRadius: '1.75rem' },
        screen: {
          borderRadius: 'calc(1.75rem - var(--postkit-device-padding))',
        },
      },
      mac: {
        root: {
          '--postkit-device-width': '38rem',
          '--postkit-device-aspect': '16 / 10',
        },
        frame: {
          borderTopRadius: '1rem',
          paddingBottom: 'calc(var(--postkit-device-padding) * 1.75)',
        },
        screen: { borderRadius: 'xs' },
      },
    },
  },
  defaultVariants: { size: 'md', variant: 'subtle', kind: 'iphone' },
});

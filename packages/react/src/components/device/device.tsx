import { deviceDefinition, type PostkitSlotOf } from '@postkit/core/components';

import { usePostkitFigureNumber } from '../../lib/figures.js';
import { postkitView, type PostkitViewProps } from '../../lib/view.js';

export type DeviceSlot = PostkitSlotOf<typeof deviceDefinition>;

/** The device a `Device` frames: `iphone`, `ipad` or `mac`. */
export type DeviceKind = (typeof deviceDefinition.props.kind.values)[number];

export type DeviceProps = PostkitViewProps<typeof deviceDefinition>;

/**
 * A screenshot in a plain device frame: headless markup only. The frame is
 * drawn with CSS around the image (a rounded bezel, a notch for `iphone`, a
 * base for `mac`), never a frame image, so it follows the page's colours.
 * The notch and base are decorative and hidden from assistive technology;
 * the screenshot's `alt` describes what it shows.
 *
 * Beneath `figures="numbered"`, its number ("Fig. 3") leads the caption.
 */
export const Device = postkitView<typeof deviceDefinition, DeviceProps>(
  deviceDefinition,
  ({ props, part }) => {
    const figure = usePostkitFigureNumber();
    const { kind, caption } = props;
    return (
      <figure {...part('root')}>
        <div {...part('frame')}>
          {kind === 'iphone' ? (
            <span {...part('notch')} aria-hidden="true" />
          ) : null}
          <div {...part('screen')}>
            <img
              {...part('image')}
              src={props.src}
              alt={props.alt}
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>
        {kind === 'mac' ? <span {...part('base')} aria-hidden="true" /> : null}
        {caption || figure ? (
          <figcaption {...part('figcaption')}>
            {figure ? <span {...part('number')}>{figure.label()}</span> : null}
            {caption ? <span {...part('caption')}>{caption}</span> : null}
          </figcaption>
        ) : null}
      </figure>
    );
  },
);

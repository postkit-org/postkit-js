import {
  pullQuoteDefinition,
  type PostkitSlotOf,
} from '@postkit/core/components';

import { postkitView, type PostkitViewProps } from '../../lib/view.js';

export type PullQuoteSlot = PostkitSlotOf<typeof pullQuoteDefinition>;
export type PullQuoteProps = PostkitViewProps<typeof pullQuoteDefinition>;

/** A prominent quotation with optional attribution: headless markup only. */
export const PullQuote = postkitView<
  typeof pullQuoteDefinition,
  PullQuoteProps
>(pullQuoteDefinition, ({ props, part }) => {
  const { quote, attribution, cite } = props;
  return (
    <figure {...part('root')}>
      <span {...part('mark')} aria-hidden="true">
        “
      </span>
      <blockquote {...part('quote')}>{quote}</blockquote>
      {attribution || cite ? (
        <figcaption {...part('attribution')}>
          {attribution}
          {cite ? (
            <cite {...part('cite')}>{attribution ? ` — ${cite}` : cite}</cite>
          ) : null}
        </figcaption>
      ) : null}
    </figure>
  );
});

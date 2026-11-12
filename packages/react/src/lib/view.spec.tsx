// @vitest-environment node

import { definePostkitComponent, prop } from '@postkit/core/components';
import { renderToStaticMarkup } from 'react-dom/server';

import { postkitView } from './view.js';

const cardDefinition = definePostkitComponent({
  name: 'ProbeCard',
  directive: 'postkit-probe-card',
  category: 'discovery',
  description: 'A probe card.',
  children: 'mdx',
  props: {
    heading: prop.string('A heading.', { required: true }),
    layoutMode: prop.enum(['stack', 'row'], {
      description: 'The layout.',
      default: 'stack',
      themeVariant: true,
    }),
  },
  slots: ['root', 'heading', 'body'],
});

const ProbeCard = postkitView(cardDefinition, ({ props, part }) => (
  <section {...part('root')}>
    <h2 {...part('heading', { style: { margin: 0 } })}>{props.heading}</h2>
    <div {...part('body')}>{props.children}</div>
  </section>
));

describe('postkitView', () => {
  it('names the view after its definition and carries the definition', () => {
    expect(ProbeCard.displayName).toBe('ProbeCard');
    expect(ProbeCard.definition).toBe(cardDefinition);
    expect(
      postkitView(cardDefinition, () => null, { displayName: 'Custom' })
        .displayName,
    ).toBe('Custom');
  });

  it('emits the anatomy, defaults and state without styles', () => {
    expect(
      renderToStaticMarkup(<ProbeCard heading="Hello">Body</ProbeCard>),
    ).toBe(
      '<section data-postkit-component="ProbeCard" data-postkit-part="root" data-layout-mode="stack">' +
        '<h2 data-postkit-part="heading" style="margin:0">Hello</h2>' +
        '<div data-postkit-part="body">Body</div></section>',
    );
  });

  it('merges classNames, slotStyles and rootProps per part', () => {
    const markup = renderToStaticMarkup(
      <ProbeCard
        heading="Hello"
        layoutMode="row"
        unstyled
        classNames={{ root: 'card', heading: 'card-heading' }}
        slotStyles={{ heading: { margin: 4, color: 'red' }, root: { gap: 1 } }}
        rootProps={{
          id: 'probe',
          className: 'host',
          style: { gap: 2 },
          'data-extra': 'yes',
        }}
      >
        Body
      </ProbeCard>,
    );

    expect(markup).toContain(
      '<section data-postkit-component="ProbeCard" data-postkit-part="root" data-layout-mode="row" data-postkit-unstyled="" id="probe" data-extra="yes" class="card host" style="gap:2px">',
    );
    expect(markup).toContain(
      '<h2 data-postkit-part="heading" class="card-heading" style="margin:4px;color:red">',
    );
  });
});

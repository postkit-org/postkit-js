// @vitest-environment node

import { pollDefinition } from '@postkit/core/components';
import { renderToStaticMarkup } from 'react-dom/server';

import { Poll } from './poll.js';

describe('headless Poll', () => {
  it('carries its definition', () => {
    expect(Poll.definition).toBe(pollDefinition);
  });

  it('renders the question, options and status without counts', () => {
    expect(
      renderToStaticMarkup(
        <Poll question="Which?" options='[{"id":"a","label":"A"}]' />,
      ),
    ).toBe(
      '<div data-postkit-component="Poll" data-postkit-part="root" data-size="md" data-variant="subtle">' +
        '<p data-postkit-part="question">Which?</p>' +
        '<div role="group" aria-label="Which?" data-postkit-part="options">' +
        '<button type="button" aria-pressed="false" data-postkit-part="option">' +
        '<span data-postkit-part="optionLabel"><span>A</span></span></button></div>' +
        '<p aria-live="polite" data-postkit-part="status">Select an option</p></div>',
    );
  });

  it('renders results, the selected option and part classes', () => {
    const markup = renderToStaticMarkup(
      <Poll
        question="Which?"
        description="Pick one."
        options={[
          { id: 'a', label: 'A', votes: 1 },
          { id: 'b', label: 'B', votes: 3 },
        ]}
        selectedId="b"
        size="sm"
        classNames={{ option: 'opt', bar: 'fill' }}
      />,
    );

    expect(markup).toContain('data-size="sm"');
    expect(markup).toContain(
      '<p data-postkit-part="description">Pick one.</p>',
    );
    expect(markup).toContain(
      '<span data-postkit-part="result">75%</span></span>' +
        '<span role="progressbar" aria-label="B: 75%" aria-valuemin="0" aria-valuemax="100" aria-valuenow="75">' +
        '<span><span style="width:75%" data-postkit-part="bar" class="fill"></span></span></span>',
    );
    expect(markup).toContain(
      '<button type="button" aria-pressed="true" data-postkit-part="option" class="opt">',
    );
    expect(markup).toContain('>Vote selected</p>');
  });

  it('rejects options that are not a JSON array', () => {
    expect(() =>
      renderToStaticMarkup(<Poll question="Q" options="{}" />),
    ).toThrow('Postkit Poll options must contain a JSON array.');
  });
});

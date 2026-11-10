import { pollDefinition } from '@postkit/core/components';
import { chakraOnly } from '@postkit/react';
import { fireEvent, render, screen } from '@testing-library/react';

import { PostkitProvider } from '../../lib/provider.js';
import { createPostkitSystem, postkitDefaultTheme } from '../../lib/theme.js';
import { Poll } from './poll.js';

const system = createPostkitSystem({ preset: postkitDefaultTheme });

describe('Chakra Poll view', () => {
  it('carries its definition and is chakra-only for now', () => {
    expect(Poll.definition).toBe(pollDefinition);
    expect(chakraOnly).toContain('Poll');
  });

  it('stamps the anatomy and records a vote', () => {
    const onVote = vi.fn();
    const { container } = render(
      <PostkitProvider system={system}>
        <Poll
          question="Which format?"
          size="sm"
          options={[
            { id: 'md', label: 'Markdown', votes: 3 },
            { id: 'mdx', label: 'MDX', votes: 1 },
          ]}
          onVote={onVote}
        />
      </PostkitProvider>,
    );
    const root = container.querySelector('[data-postkit-part="root"]');

    expect(root?.getAttribute('data-postkit-component')).toBe('Poll');
    expect(root?.getAttribute('data-size')).toBe('sm');
    expect(root?.getAttribute('data-variant')).toBe('subtle');
    expect(
      container.querySelectorAll('[data-postkit-part="option"]'),
    ).toHaveLength(2);
    expect(screen.getByText('4 votes')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /MDX/ }));

    expect(onVote).toHaveBeenCalledWith({ id: 'mdx', label: 'MDX', votes: 1 });
    expect(
      screen.getByRole('button', { name: /MDX/ }).getAttribute('aria-pressed'),
    ).toBe('true');
    expect(screen.getByText('Vote selected')).toBeTruthy();
  });
});

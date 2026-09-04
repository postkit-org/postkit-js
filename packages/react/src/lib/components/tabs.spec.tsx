import { defaultSystem } from '@chakra-ui/react';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach } from 'vitest';

import { PostkitProvider } from '../provider.js';
import { Tabs } from './article-structure.js';

afterEach(cleanup);

describe('Tabs', () => {
  it('updates the selected tab from user interaction', async () => {
    render(
      <PostkitProvider system={defaultSystem}>
        <Tabs
          initialIndex="not-a-number"
          items={[
            { id: 'first', label: 'First', content: 'First panel' },
            { id: 'second', label: 'Second', content: 'Second panel' },
          ]}
          unstyled
        />
      </PostkitProvider>,
    );

    fireEvent.click(screen.getByRole('tab', { name: 'Second' }));
    await waitFor(() => {
      expect(
        screen
          .getByRole('tab', { name: 'Second' })
          .getAttribute('aria-selected'),
      ).toBe('true');
    });
  });
});

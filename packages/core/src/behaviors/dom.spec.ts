// @vitest-environment jsdom
import { normalizeProps, spreadProps } from './dom.js';

describe('spreadProps', () => {
  it('applies JSX-style props and removes the ones that go away', () => {
    const button = document.createElement('button');
    const onClick = vi.fn();
    const onFocus = vi.fn();
    spreadProps(
      button,
      normalizeProps.button({
        id: 'trigger',
        className: 'trigger',
        tabIndex: -1,
        'aria-disabled': true,
        hidden: false,
        'aria-selected': false,
        'data-copied': '',
        style: { scrollSnapAlign: 'start', '--slides-per-page': 1 },
        onClick,
        onFocus,
        children: 'ignored',
      }),
    );
    expect(button.getAttribute('class')).toBe('trigger');
    expect(button.getAttribute('tabindex')).toBe('-1');
    expect(button.getAttribute('aria-disabled')).toBe('true');
    expect(button.hasAttribute('hidden')).toBe(false);
    expect(button.getAttribute('aria-selected')).toBe('false');
    expect(button.getAttribute('data-copied')).toBe('');
    expect(button.style.getPropertyValue('scroll-snap-align')).toBe('start');
    expect(button.style.getPropertyValue('--slides-per-page')).toBe('1');
    button.click();
    button.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onFocus).toHaveBeenCalledTimes(1);

    const nextClick = vi.fn();
    spreadProps(button, { id: 'trigger', onClick: nextClick, style: {} });
    button.click();
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(nextClick).toHaveBeenCalledTimes(1);
    expect(button.hasAttribute('aria-disabled')).toBe(false);
    expect(button.hasAttribute('data-copied')).toBe(false);
    expect(button.style.getPropertyValue('scroll-snap-align')).toBe('');
    button.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    expect(onFocus).toHaveBeenCalledTimes(1);
  });

  it('sets input values, labels and removes everything on cleanup', () => {
    const input = document.createElement('input');
    const onChange = vi.fn();
    const remove = spreadProps(input, {
      defaultValue: 'npm i',
      readOnly: true,
      htmlFor: 'x',
      onChange,
      onDoubleClick: 'not a function',
      style: { color: 'red' },
    });
    expect(input.value).toBe('npm i');
    expect(input.hasAttribute('readonly')).toBe(true);
    input.dispatchEvent(new Event('input'));
    expect(onChange).toHaveBeenCalledTimes(1);
    remove();
    input.dispatchEvent(new Event('input'));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(input.hasAttribute('readonly')).toBe(false);
    expect(input.style.getPropertyValue('color')).toBe('');
  });
});

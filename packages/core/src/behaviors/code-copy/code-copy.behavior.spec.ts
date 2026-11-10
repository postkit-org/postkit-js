// @vitest-environment jsdom
import { spreadProps } from '../dom.js';
import {
  createBareDriver,
  element,
} from '../testing/bare-driver.spec-support.js';
import { registerBehaviorSpec } from '../testing/harness.js';
import {
  codeCopyBehaviorSpec,
  type CodeCopyBehaviorFixture,
} from './code-copy.behavior.spec-suite.js';
import {
  codeCopyProps,
  createCodeCopy,
  postkitCodeCopyConfig,
  type CodeCopyBehaviorApi,
} from './code-copy.behavior.js';

let count = 0;

const driver = createBareDriver<CodeCopyBehaviorFixture, CodeCopyBehaviorApi>(
  (container, fixture) => {
    const behavior = createCodeCopy({
      id: `copy-${(count += 1)}`,
      code: fixture.code,
    });
    const root = element('figure');
    const code = element('pre', fixture.code);
    const trigger = element('button');
    const indicator = element('span');
    trigger.append(indicator);
    root.append(trigger, code);
    container.append(root);
    return {
      behavior,
      update(api) {
        spreadProps(root, api.getRootProps());
        spreadProps(trigger, {
          ...api.getTriggerProps(),
          'aria-label': fixture.label,
        });
        spreadProps(indicator, { 'aria-live': 'polite' });
        indicator.textContent = api.copied
          ? fixture.copiedLabel
          : fixture.label;
      },
    };
  },
);

registerBehaviorSpec(
  codeCopyBehaviorSpec(driver),
  { describe, it },
  {
    label: 'bare machine',
  },
);

describe('codeCopyProps', () => {
  it('configures Zag as @postkit/chakra does', () => {
    expect(codeCopyProps({ id: 'c', code: 'x' })).toEqual({
      id: 'c',
      value: 'x',
      timeout: postkitCodeCopyConfig.timeout,
    });
    expect(postkitCodeCopyConfig).toEqual({
      timeout: 1000,
      label: 'Copy code',
      copiedLabel: 'Copied',
    });
  });

  it('passes a timeout and callbacks through', () => {
    const onStatusChange = vi.fn();
    const getRootNode = () => document;
    expect(
      codeCopyProps({
        id: 'c',
        code: 'x',
        timeout: 50,
        onStatusChange,
        getRootNode,
      }),
    ).toMatchObject({ timeout: 50, onStatusChange, getRootNode });
  });
});

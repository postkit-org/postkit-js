// @vitest-environment jsdom
import { normalizeProps, spreadProps } from '../dom.js';
import {
  createBareDriver,
  element,
} from '../testing/bare-driver.spec-support.js';
import { registerBehaviorSpec } from '../testing/harness.js';
import {
  newsletterSignupBehaviorSpec,
  type NewsletterSignupBehaviorFixture,
} from './newsletter-signup.behavior.spec-suite.js';
import {
  connectNewsletterSignup,
  createNewsletterSignup,
  newsletterSignupInitialState,
  newsletterSignupTransition,
  type NewsletterSignupApi,
} from './newsletter-signup.behavior.js';

let count = 0;

const driver = createBareDriver<
  NewsletterSignupBehaviorFixture,
  NewsletterSignupApi
>((container, fixture) => {
  const behavior = createNewsletterSignup(fixture);
  const form = element('form');
  const label = element('label', fixture.emailLabel);
  const input = element('input');
  input.id = `newsletter-email-${(count += 1)}`;
  label.htmlFor = input.id;
  const submit = element('button', fixture.buttonLabel);
  const status = element('p');
  form.append(label, input, submit, status);
  for (const [name, value] of behavior.api.hiddenFields) {
    const hidden = element('input');
    hidden.type = 'hidden';
    hidden.name = name;
    hidden.value = value;
    form.append(hidden);
  }
  container.append(element('h2', fixture.title), form);
  return {
    behavior,
    update(api) {
      spreadProps(form, api.getFormProps());
      spreadProps(input, api.getInputProps());
      spreadProps(submit, api.getSubmitProps());
      spreadProps(status, api.getStatusProps());
      status.textContent = api.message;
    },
  };
});

registerBehaviorSpec(
  newsletterSignupBehaviorSpec(driver),
  { describe, it },
  { label: 'bare machine' },
);

describe('newsletter signup machine', () => {
  it('moves idle → submitting → success or error', () => {
    const idle = newsletterSignupInitialState();
    expect(idle).toEqual({ status: 'idle', message: '' });
    expect(
      newsletterSignupTransition(idle, { type: 'RESOLVE', message: 'x' }),
    ).toBe(idle);
    const submitting = newsletterSignupTransition(idle, { type: 'SUBMIT' });
    expect(submitting).toEqual({
      status: 'submitting',
      message: 'Subscribing…',
    });
    expect(newsletterSignupTransition(submitting, { type: 'SUBMIT' })).toBe(
      submitting,
    );
    expect(
      newsletterSignupTransition(submitting, {
        type: 'RESOLVE',
        message: 'ok',
      }),
    ).toEqual({ status: 'success', message: 'ok' });
    const failed = newsletterSignupTransition(submitting, {
      type: 'REJECT',
      message: 'no',
    });
    expect(failed).toEqual({ status: 'error', message: 'no' });
    expect(newsletterSignupTransition(failed, { type: 'SUBMIT' }).status).toBe(
      'submitting',
    );
  });

  it('lets the browser post to an action and blocks an unconfigured form', () => {
    const send = vi.fn();
    const preventDefault = vi.fn();
    const posting = connectNewsletterSignup(
      { state: newsletterSignupInitialState(), send },
      normalizeProps,
      { config: { action: '/subscribe' } },
    );
    (posting.getFormProps() as { onSubmit(event: unknown): void }).onSubmit({
      currentTarget: null,
      preventDefault,
    });
    expect(preventDefault).not.toHaveBeenCalled();
    const unconfigured = connectNewsletterSignup(
      { state: newsletterSignupInitialState(), send },
      normalizeProps,
      {},
    );
    (
      unconfigured.getFormProps() as { onSubmit(event: unknown): void }
    ).onSubmit({ currentTarget: null, preventDefault });
    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(send).not.toHaveBeenCalled();
    expect(unconfigured.getSubmitProps()).toMatchObject({ disabled: true });
    expect(unconfigured.message).toBe('Newsletter signup is not configured.');
  });

  it('gives a callback form no action and runs framework-free', () => {
    const behavior = createNewsletterSignup({
      config: { subscribe: () => undefined, action: '/ignored' },
    });
    expect(behavior.api.getFormProps()).toMatchObject({
      action: undefined,
      method: 'post',
    });
    const listener = vi.fn();
    const unsubscribe = behavior.subscribe(listener);
    behavior.start();
    behavior.send({ type: 'SUBMIT' });
    expect(listener).toHaveBeenCalledTimes(1);
    expect(behavior.state.status).toBe('submitting');
    unsubscribe();
    behavior.stop();
  });
});

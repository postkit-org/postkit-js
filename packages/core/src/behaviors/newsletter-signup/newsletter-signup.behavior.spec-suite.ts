import type { NewsletterSignupConfig } from './newsletter-signup.behavior.js';
import {
  byId,
  check,
  checkEqual,
  click,
  visibleText,
  type BehaviorDriver,
  type BehaviorSpec,
} from '../testing/harness.js';
import { installBehaviorEnvironment } from '../testing/environment.js';

/** What a newsletter signup renderer draws for the shared spec. */
export interface NewsletterSignupBehaviorFixture {
  readonly title: string;
  readonly emailLabel: string;
  readonly buttonLabel: string;
  readonly successMessage: string;
  readonly errorMessage: string;
  readonly list?: string;
  /** The host's configuration; pass it as the renderer takes it. */
  readonly config?: NewsletterSignupConfig;
}

const fixture: NewsletterSignupBehaviorFixture = {
  title: 'Get the newsletter',
  emailLabel: 'Email address',
  buttonLabel: 'Subscribe',
  successMessage: 'Thanks for subscribing.',
  errorMessage: 'Subscription failed. Please try again.',
  list: 'weekly',
};

const EMAIL = 'reader@example.com';

function parts(root: Element) {
  const form = root.querySelector('form');
  check(form, 'The signup renders a form');
  const input = form.querySelector<HTMLInputElement>('input[type="email"]');
  check(input, 'The form has an email input');
  const submit = Array.from(form.querySelectorAll('button')).find(
    (button) => visibleText(button) === fixture.buttonLabel,
  );
  check(submit, `A button reads "${fixture.buttonLabel}"`);
  const status = Array.from(form.querySelectorAll('[aria-live="polite"]'));
  checkEqual(status.length, 1, 'One polite status region');
  return { form, input, submit, status: status[0] as Element };
}

function hiddenValue(form: Element, name: string): string | null {
  const input = form.querySelector<HTMLInputElement>(
    `input[type="hidden"][name="${name}"]`,
  );
  return input ? input.value : null;
}

/** A promise the spec settles by hand. */
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((settle, fail) => {
    resolve = settle;
    reject = fail;
  });
  return { promise, resolve, reject };
}

/**
 * The shared newsletter signup spec: a labelled, required email field; an
 * unconfigured form that says so and can't submit; a host `subscribe`
 * callback that receives the email and list while the form is busy, then
 * resets the form and announces success, the host's message or the failure;
 * and a host `action` that the form posts to with its hidden fields.
 */
export function newsletterSignupBehaviorSpec(
  driver: BehaviorDriver<NewsletterSignupBehaviorFixture>,
): BehaviorSpec {
  const run =
    (
      body: (root: Element) => Promise<void>,
      overrides: Partial<NewsletterSignupBehaviorFixture> = {},
    ) =>
    async () => {
      const restore = installBehaviorEnvironment();
      try {
        await body(await driver.render({ ...fixture, ...overrides }));
      } finally {
        await driver.cleanup();
        restore();
      }
    };

  const submitEmail = async (root: Element) => {
    const { input, submit } = parts(root);
    input.value = EMAIL;
    await driver.interact(() => click(submit));
  };

  const subscribing = (
    outcome: (subscription: {
      readonly email: string;
      readonly list?: string;
    }) => Promise<{ readonly message?: string } | void>,
  ): NewsletterSignupConfig => ({ subscribe: outcome });

  return {
    behavior: 'NewsletterSignup',
    cases: [
      {
        name: 'labels a required email field',
        run: run(async (root) => {
          const { input } = parts(root);
          const label = root.querySelector(`label[for="${input.id}"]`);
          check(input.id && label, 'A label points at the input by id');
          checkEqual(visibleText(label), fixture.emailLabel, 'Label text');
          check(input.required, 'The email is required');
          checkEqual(input.name, 'email', 'The default field name');
          checkEqual(input.autocomplete, 'email', 'The input autocompletes');
        }),
      },
      {
        name: 'says it is not configured and cannot submit without a host',
        run: run(async (root) => {
          const { submit, status } = parts(root);
          check(submit.disabled, 'The submit button is disabled');
          checkEqual(submit.getAttribute('type'), 'submit', 'Button type');
          checkEqual(
            visibleText(status),
            'Newsletter signup is not configured.',
            'The status',
          );
          checkEqual(status.getAttribute('role'), 'status', 'Status role');
        }),
      },
      {
        name: 'subscribes through the host callback, then resets and announces success',
        run: async () => {
          const pending = deferred<void>();
          const received: { email: string; list?: string }[] = [];
          await run(
            async (root) => {
              const { status } = parts(root);
              checkEqual(visibleText(status), '', 'No status before submit');
              await submitEmail(root);
              await driver.waitFor(() => {
                const busy = parts(root);
                check(busy.submit.disabled, 'Submit is disabled while busy');
                check(busy.input.disabled, 'The input is disabled while busy');
                checkEqual(
                  visibleText(busy.status),
                  'Subscribing…',
                  'The busy status',
                );
              });
              checkEqual(
                JSON.stringify(received),
                JSON.stringify([{ email: EMAIL, list: fixture.list }]),
                'The callback receives the email and list',
              );
              await driver.interact(() => pending.resolve());
              await driver.waitFor(() => {
                const done = parts(root);
                checkEqual(
                  visibleText(done.status),
                  fixture.successMessage,
                  'The success status',
                );
                checkEqual(done.status.getAttribute('role'), 'status', 'Role');
                checkEqual(done.input.value, '', 'The form was reset');
                check(!done.submit.disabled, 'Submit is enabled again');
              });
            },
            {
              config: subscribing(async (subscription) => {
                received.push(subscription);
                await pending.promise;
              }),
            },
          )();
        },
      },
      {
        name: "announces the host's own success message",
        run: run(
          async (root) => {
            await submitEmail(root);
            await driver.waitFor(() =>
              checkEqual(
                visibleText(parts(root).status),
                'Check your inbox.',
                'The host message',
              ),
            );
          },
          {
            config: subscribing(async () => ({ message: 'Check your inbox.' })),
          },
        ),
      },
      {
        name: 'announces a failure and keeps the email',
        run: run(
          async (root) => {
            await submitEmail(root);
            await driver.waitFor(() => {
              const { input, status } = parts(root);
              checkEqual(
                visibleText(status),
                fixture.errorMessage,
                'The error status',
              );
              checkEqual(input.value, EMAIL, 'The email is kept');
              checkEqual(
                input.getAttribute('aria-invalid'),
                'true',
                'The input is invalid',
              );
              check(!input.disabled, 'The input is enabled again');
            });
          },
          {
            config: subscribing(async () => {
              throw new Error('Provider unavailable');
            }),
          },
        ),
      },
      {
        name: "posts to the host's action with the list and hidden fields",
        run: run(
          async (root) => {
            const { form, input, submit, status } = parts(root);
            checkEqual(
              form.getAttribute('action'),
              'https://newsletter.example.com/subscribe',
              'The form action',
            );
            checkEqual(form.getAttribute('method'), 'get', 'The form method');
            checkEqual(input.name, 'address', 'The configured field name');
            checkEqual(hiddenValue(form, 'audience'), 'weekly', 'The list');
            checkEqual(hiddenValue(form, 'source'), 'blog', 'A hidden field');
            check(!submit.disabled, 'The submit button is enabled');
            checkEqual(visibleText(status), '', 'No status');
            check(
              byId(root, input.id) === input,
              'The input is in the document',
            );
          },
          {
            config: {
              action: 'https://newsletter.example.com/subscribe',
              method: 'get',
              emailFieldName: 'address',
              listFieldName: 'audience',
              hiddenFields: { source: 'blog' },
            },
          },
        ),
      },
    ],
  };
}

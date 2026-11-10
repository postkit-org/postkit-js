import type { NewsletterSignupConfig } from '@postkit/core/behaviors';
import {
  newsletterSignupDefinition,
  type PostkitSlotOf,
} from '@postkit/core/components';
import { useId } from 'react';

import { useNewsletterSignup } from '../../hooks/use-newsletter-signup.js';
import { mergePostkitPartProps } from '../../lib/merge-part.js';
import { postkitView, type PostkitViewProps } from '../../lib/view.js';

export type { NewsletterSignupConfig };
export type NewsletterSignupSlot = PostkitSlotOf<
  typeof newsletterSignupDefinition
>;

export type NewsletterSignupProps = PostkitViewProps<
  typeof newsletterSignupDefinition
> & {
  /**
   * The host's newsletter configuration: a `subscribe` callback or a form
   * `action`. Authored content can't set it, so credentials and endpoints
   * stay with the host. Without it the form says it isn't configured.
   */
  readonly newsletter?: NewsletterSignupConfig;
};

/**
 * A newsletter signup form, from `useNewsletterSignup`: headless markup
 * only. The root carries `data-postkit-configured`; the status line is
 * announced politely.
 */
export const NewsletterSignup = postkitView<
  typeof newsletterSignupDefinition,
  NewsletterSignupProps
>(newsletterSignupDefinition, ({ props, part }) => {
  const {
    title,
    description,
    list,
    emailLabel,
    emailPlaceholder,
    buttonLabel,
    privacy,
    successMessage,
    errorMessage,
    children,
    newsletter,
  } = props;
  const inputId = useId();
  const statusId = useId();
  const api = useNewsletterSignup({
    config: newsletter,
    list,
    successMessage,
    errorMessage,
  });
  return (
    <aside
      data-postkit-configured={api.configured ? 'true' : 'false'}
      {...part('root')}
    >
      <div {...part('content')}>
        <h2 {...part('title')}>{title}</h2>
        {description || children ? (
          <div {...part('description')}>{children ?? description}</div>
        ) : null}
      </div>
      <form {...mergePostkitPartProps(api.getFormProps(), part('form'))}>
        <label {...part('label')} htmlFor={inputId}>
          {emailLabel}
        </label>
        <div {...part('fields')}>
          <input
            {...mergePostkitPartProps(api.getInputProps(), part('input'))}
            id={inputId}
            placeholder={emailPlaceholder}
            aria-describedby={statusId}
          />
          <button
            {...mergePostkitPartProps(api.getSubmitProps(), part('submit'))}
          >
            {buttonLabel}
          </button>
        </div>
        <span
          {...mergePostkitPartProps(api.getStatusProps(), part('status'))}
          id={statusId}
        >
          {api.message}
        </span>
        {api.hiddenFields.map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
        {privacy ? <p {...part('privacy')}>{privacy}</p> : null}
      </form>
    </aside>
  );
});

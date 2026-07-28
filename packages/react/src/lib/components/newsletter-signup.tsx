'use client';

import {
  Box,
  Button,
  chakra,
  Heading,
  Input,
  Text,
  type BoxProps,
  type RecipeVariantProps,
  type UnstyledProp,
} from '@chakra-ui/react';
import { type FormEvent, type ReactNode, useId, useState } from 'react';

import { usePostkit } from '../provider.js';
import {
  postkitNewsletterSignupRecipe,
  type PostkitNewsletterSignupSlot,
} from '../recipes/newsletter-signup.recipe.js';
import {
  postkitSlotClassName,
  type PostkitSlotStyles,
  usePostkitSlotRecipe,
} from '../recipes/types.js';
import { postkitRecipeKeys } from '../theme.js';

export type PostkitNewsletterSignupProps = {
  readonly title: string;
  readonly description?: string;
  readonly list?: string;
  readonly emailLabel?: string;
  readonly emailPlaceholder?: string;
  readonly buttonLabel?: string;
  readonly privacy?: string;
  readonly successMessage?: string;
  readonly errorMessage?: string;
  readonly children?: ReactNode;
  readonly rootProps?: BoxProps;
  readonly slotStyles?: PostkitSlotStyles<PostkitNewsletterSignupSlot>;
} & RecipeVariantProps<typeof postkitNewsletterSignupRecipe> &
  UnstyledProp;

type SubmissionState =
  | { readonly status: 'idle' | 'submitting'; readonly message: string }
  | { readonly status: 'success' | 'error'; readonly message: string };

const NewsletterForm = chakra('form');
const NewsletterLabel = chakra('label');

export function PostkitNewsletterSignup({
  title,
  description,
  list,
  emailLabel = 'Email address',
  emailPlaceholder,
  buttonLabel = 'Subscribe',
  privacy,
  successMessage = 'Thanks for subscribing.',
  errorMessage = 'Subscription failed. Please try again.',
  children,
  rootProps,
  slotStyles,
  alignment,
  size,
  variant,
  unstyled,
}: PostkitNewsletterSignupProps) {
  const { newsletter } = usePostkit();
  const inputId = useId();
  const [submission, setSubmission] = useState<SubmissionState>({
    status: 'idle',
    message: '',
  });
  const recipe = usePostkitSlotRecipe(
    postkitRecipeKeys.newsletterSignup,
    postkitNewsletterSignupRecipe,
  );
  const styles: PostkitSlotStyles<PostkitNewsletterSignupSlot> = unstyled
    ? {}
    : recipe({ alignment, size, variant });
  const {
    css: rootCss,
    className: rootClassName,
    ...restRootProps
  } = rootProps ?? {};
  const configured = Boolean(newsletter?.subscribe || newsletter?.action);
  const usesCallback = Boolean(newsletter?.subscribe);
  const emailFieldName = newsletter?.emailFieldName ?? 'email';
  const listFieldName = newsletter?.listFieldName ?? 'list';

  async function submit(event: FormEvent<HTMLFormElement>) {
    if (!newsletter?.subscribe) {
      if (!newsletter?.action) event.preventDefault();
      return;
    }

    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const email = String(form.get(emailFieldName) ?? '');
    setSubmission({ status: 'submitting', message: 'Subscribing…' });

    try {
      const result = await newsletter.subscribe({ email, list });
      formElement.reset();
      setSubmission({
        status: 'success',
        message: result?.message ?? successMessage,
      });
    } catch {
      setSubmission({ status: 'error', message: errorMessage });
    }
  }

  const statusMessage =
    submission.message ||
    (!configured ? 'Newsletter signup is not configured.' : '');

  return (
    <Box
      as="aside"
      data-postkit-component="NewsletterSignup"
      data-postkit-configured={configured ? 'true' : 'false'}
      {...restRootProps}
      className={postkitSlotClassName(recipe.classNameMap.root, rootClassName)}
      css={[styles.root, slotStyles?.root, rootCss]}
    >
      <Box
        className={recipe.classNameMap.content}
        css={[styles.content, slotStyles?.content]}
      >
        <Heading
          as="h2"
          className={recipe.classNameMap.title}
          css={[styles.title, slotStyles?.title]}
        >
          {title}
        </Heading>
        {description || children ? (
          <Box
            className={recipe.classNameMap.description}
            css={[styles.description, slotStyles?.description]}
          >
            {children ?? description}
          </Box>
        ) : null}
      </Box>
      <NewsletterForm
        action={usesCallback ? undefined : newsletter?.action}
        method={newsletter?.method ?? 'post'}
        onSubmit={submit}
        className={recipe.classNameMap.form}
        css={[styles.form, slotStyles?.form]}
      >
        <NewsletterLabel
          htmlFor={inputId}
          className={recipe.classNameMap.label}
          css={[styles.label, slotStyles?.label]}
        >
          {emailLabel}
        </NewsletterLabel>
        <Box
          className={recipe.classNameMap.fields}
          css={[styles.fields, slotStyles?.fields]}
        >
          <Input
            id={inputId}
            name={emailFieldName}
            type="email"
            autoComplete="email"
            placeholder={emailPlaceholder}
            required
            disabled={submission.status === 'submitting'}
            className={recipe.classNameMap.input}
            css={[styles.input, slotStyles?.input]}
          />
          <Button
            type="submit"
            disabled={!configured || submission.status === 'submitting'}
            loading={submission.status === 'submitting'}
            className={recipe.classNameMap.submit}
            css={[styles.submit, slotStyles?.submit]}
          >
            {buttonLabel}
          </Button>
        </Box>
        {list ? (
          <input type="hidden" name={listFieldName} value={list} />
        ) : null}
        {Object.entries(newsletter?.hiddenFields ?? {}).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
        <Text
          aria-live="polite"
          role={submission.status === 'error' ? 'alert' : 'status'}
          className={recipe.classNameMap.status}
          css={[styles.status, slotStyles?.status]}
        >
          {statusMessage}
        </Text>
        {privacy ? (
          <Text
            className={recipe.classNameMap.privacy}
            css={[styles.privacy, slotStyles?.privacy]}
          >
            {privacy}
          </Text>
        ) : null}
      </NewsletterForm>
    </Box>
  );
}

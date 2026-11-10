'use client';

import {
  Box,
  Button,
  chakra,
  Field,
  Heading,
  Input,
  Text,
  type BoxProps,
  type ButtonProps,
  type InputProps,
  type RecipeVariantProps,
  type UnstyledProp,
} from '@chakra-ui/react';
import { newsletterSignupDefinition } from '@postkit/core/components';
import { type FormEvent, type ReactNode, useId, useState } from 'react';

import { postkitHeadingSize } from '../../lib/components/heading-size.js';
import { usePostkit } from '../../lib/provider.js';
import type { PostkitSlotStyles } from '../../lib/recipes/types.js';
import { postkitChakraView } from '../../lib/view.js';
import {
  postkitNewsletterSignupRecipe,
  type PostkitNewsletterSignupSlot,
} from './newsletter-signup.recipe.js';

export type NewsletterSignupProps = {
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
  /** A class per anatomy part, added after the recipe's class. */
  readonly classNames?: Partial<
    Readonly<Record<PostkitNewsletterSignupSlot, string>>
  >;
} & RecipeVariantProps<typeof postkitNewsletterSignupRecipe> &
  UnstyledProp;

type SubmissionState =
  | { readonly status: 'idle' | 'submitting'; readonly message: string }
  | { readonly status: 'success' | 'error'; readonly message: string };

const NewsletterForm = chakra('form');

/**
 * A newsletter form connected by `PostkitProvider`, styled by its Chakra
 * recipe. There is no headless view yet (03 D11).
 */
export const NewsletterSignup = postkitChakraView<
  typeof newsletterSignupDefinition,
  NewsletterSignupProps
>(
  newsletterSignupDefinition,
  postkitNewsletterSignupRecipe,
  ({ props, variants, part }) => {
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
    } = props;
    const { newsletter } = usePostkit();
    const inputId = useId();
    const [submission, setSubmission] = useState<SubmissionState>({
      status: 'idle',
      message: '',
    });
    const fieldSize = variants['size'] ?? 'md';
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
          message: result?.message ?? successMessage ?? '',
        });
      } catch {
        setSubmission({ status: 'error', message: errorMessage ?? '' });
      }
    }

    const statusMessage =
      submission.message ||
      (!configured ? 'Newsletter signup is not configured.' : '');

    return (
      <Box
        as="aside"
        data-postkit-configured={configured ? 'true' : 'false'}
        {...part('root')}
      >
        <Box {...part('content')}>
          <Heading
            as="h2"
            size={postkitHeadingSize(variants['size'], {
              sm: 'lg',
              md: 'xl',
              lg: '2xl',
            })}
            {...part('title')}
          >
            {title}
          </Heading>
          {description || children ? (
            <Box {...part('description')}>{children ?? description}</Box>
          ) : null}
        </Box>
        <NewsletterForm
          action={usesCallback ? undefined : newsletter?.action}
          method={newsletter?.method ?? 'post'}
          onSubmit={submit}
          {...part('form')}
        >
          <Field.Root
            required
            invalid={submission.status === 'error'}
            disabled={submission.status === 'submitting'}
          >
            <Field.Label htmlFor={inputId} {...part('label')}>
              {emailLabel}
            </Field.Label>
            <Box {...part('fields')}>
              <Input
                size={fieldSize as InputProps['size']}
                id={inputId}
                name={emailFieldName}
                type="email"
                autoComplete="email"
                placeholder={emailPlaceholder}
                required
                disabled={submission.status === 'submitting'}
                {...part('input')}
              />
              <Button
                size={fieldSize as ButtonProps['size']}
                variant="solid"
                type="submit"
                disabled={!configured || submission.status === 'submitting'}
                loading={submission.status === 'submitting'}
                {...part('submit')}
              >
                {buttonLabel}
              </Button>
            </Box>
            {submission.status === 'error' ? (
              <Field.ErrorText aria-live="polite" {...part('status')}>
                {statusMessage}
              </Field.ErrorText>
            ) : (
              <Field.HelperText
                aria-live="polite"
                role="status"
                {...part('status')}
              >
                {statusMessage}
              </Field.HelperText>
            )}
          </Field.Root>
          {list ? (
            <input type="hidden" name={listFieldName} value={list} />
          ) : null}
          {Object.entries(newsletter?.hiddenFields ?? {}).map(
            ([name, value]) => (
              <input key={name} type="hidden" name={name} value={value} />
            ),
          )}
          {privacy ? <Text {...part('privacy')}>{privacy}</Text> : null}
        </NewsletterForm>
      </Box>
    );
  },
);

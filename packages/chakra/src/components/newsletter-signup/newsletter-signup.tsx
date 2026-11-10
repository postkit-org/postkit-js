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
import { useNewsletterSignup } from '@postkit/react';
import { type ComponentProps, type ReactNode, useId } from 'react';

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

const NewsletterForm = chakra('form');

/**
 * A newsletter form connected by `PostkitProvider`, styled by its Chakra
 * recipe. Its form states come from `useNewsletterSignup` in
 * `@postkit/react`, which the headless `NewsletterSignup` uses too.
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
    const api = useNewsletterSignup({
      config: newsletter,
      list,
      successMessage,
      errorMessage,
    });
    const fieldSize = variants['size'] ?? 'md';

    return (
      <Box
        as="aside"
        data-postkit-configured={api.configured ? 'true' : 'false'}
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
          {...(api.getFormProps() as ComponentProps<typeof NewsletterForm>)}
          {...part('form')}
        >
          <Field.Root
            required
            invalid={api.status === 'error'}
            disabled={api.submitting}
          >
            <Field.Label htmlFor={inputId} {...part('label')}>
              {emailLabel}
            </Field.Label>
            <Box {...part('fields')}>
              <Input
                {...(api.getInputProps() as InputProps)}
                size={fieldSize as InputProps['size']}
                id={inputId}
                placeholder={emailPlaceholder}
                {...part('input')}
              />
              <Button
                {...(api.getSubmitProps() as ButtonProps)}
                size={fieldSize as ButtonProps['size']}
                variant="solid"
                loading={api.submitting}
                {...part('submit')}
              >
                {buttonLabel}
              </Button>
            </Box>
            {api.status === 'error' ? (
              <Field.ErrorText
                {...(api.getStatusProps() as BoxProps)}
                {...part('status')}
              >
                {api.message}
              </Field.ErrorText>
            ) : (
              <Field.HelperText
                {...(api.getStatusProps() as BoxProps)}
                {...part('status')}
              >
                {api.message}
              </Field.HelperText>
            )}
          </Field.Root>
          {api.hiddenFields.map(([name, value]) => (
            <input key={name} type="hidden" name={name} value={value} />
          ))}
          {privacy ? <Text {...part('privacy')}>{privacy}</Text> : null}
        </NewsletterForm>
      </Box>
    );
  },
);

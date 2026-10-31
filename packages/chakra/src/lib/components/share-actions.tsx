'use client';

import {
  Box,
  Button,
  Text,
  type BoxProps,
  type RecipeVariantProps,
  type UnstyledProp,
} from '@chakra-ui/react';
import { useState } from 'react';

import { parseJsonProp } from '../json-props.js';
import { usePostkit } from '../provider.js';
import {
  postkitShareActionsRecipe,
  type PostkitShareActionsSlot,
} from '../recipes/share-actions.recipe.js';
import {
  postkitSlotClassName,
  type PostkitSlotStyles,
  usePostkitSlotRecipe,
} from '../recipes/types.js';
import type { PostkitShareRequest } from '../social-services.js';
import { postkitRecipeKeys } from '../theme.js';

export type ShareActionsProps = {
  readonly url: string;
  readonly title?: string;
  readonly text?: string;
  readonly services?: string | readonly string[];
  readonly label?: string;
  readonly onShare?: (service: string, request: PostkitShareRequest) => void;
  readonly rootProps?: BoxProps;
  readonly slotStyles?: PostkitSlotStyles<PostkitShareActionsSlot>;
} & RecipeVariantProps<typeof postkitShareActionsRecipe> &
  UnstyledProp;

async function copyUrl(url: string): Promise<void> {
  if (
    typeof navigator === 'undefined' ||
    typeof navigator.clipboard?.writeText !== 'function'
  ) {
    throw new Error('Clipboard access is unavailable.');
  }
  await navigator.clipboard.writeText(url);
}

export function ShareActions({
  url,
  title,
  text,
  services: servicesValue = ['native', 'copy', 'email'],
  label = 'Share this post',
  onShare,
  rootProps,
  slotStyles,
  layout,
  size,
  variant,
  unstyled,
}: ShareActionsProps) {
  const services = parseJsonProp<string>(
    servicesValue,
    'ShareActions services',
  );
  const { socialServices } = usePostkit();
  const [status, setStatus] = useState('');
  const recipe = usePostkitSlotRecipe(
    postkitRecipeKeys.shareActions,
    postkitShareActionsRecipe,
  );
  const styles: PostkitSlotStyles<PostkitShareActionsSlot> = unstyled
    ? {}
    : recipe({ layout, size, variant });
  const {
    css: rootCss,
    className: rootClassName,
    ...restRootProps
  } = rootProps ?? {};
  const request: PostkitShareRequest = { url, title, text };

  async function share(serviceId: string) {
    const service = socialServices[serviceId];
    try {
      if (
        serviceId === 'native' &&
        typeof navigator !== 'undefined' &&
        typeof navigator.share === 'function'
      ) {
        await navigator.share(request);
      } else if (serviceId === 'native' || serviceId === 'copy') {
        await copyUrl(url);
        setStatus('Link copied.');
      } else if (serviceId === 'email' && typeof window !== 'undefined') {
        const subject = title ?? text ?? '';
        const body = [text, url].filter(Boolean).join('\n\n');
        window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      } else if (service?.share) {
        await service.share(request);
      } else if (service?.createShareUrl && typeof window !== 'undefined') {
        const shareUrl = service.createShareUrl(request);
        window.open(shareUrl, '_blank', 'noopener,noreferrer');
      } else {
        throw new Error(
          `${service?.label ?? serviceId} sharing is unavailable.`,
        );
      }
      onShare?.(serviceId, request);
      if (serviceId !== 'copy') {
        setStatus(`Opened ${service?.label ?? serviceId}.`);
      }
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'name' in error &&
        error.name === 'AbortError'
      ) {
        return;
      }
      setStatus(
        error instanceof Error ? error.message : 'Sharing is unavailable.',
      );
    }
  }

  return (
    <Box
      as="aside"
      data-postkit-component="ShareActions"
      {...restRootProps}
      className={postkitSlotClassName(recipe.classNameMap.root, rootClassName)}
      css={[styles.root, slotStyles?.root, rootCss]}
    >
      <Text
        className={recipe.classNameMap.label}
        css={[styles.label, slotStyles?.label]}
      >
        {label}
      </Text>
      <Box
        className={recipe.classNameMap.actions}
        css={[styles.actions, slotStyles?.actions]}
      >
        {services.map((serviceId) => {
          const service = socialServices[serviceId];
          const serviceLabel = service?.label ?? serviceId;
          return (
            <Button
              key={serviceId}
              type="button"
              data-postkit-service={serviceId}
              aria-label={`${label}: ${serviceLabel}`}
              onClick={() => void share(serviceId)}
              className={recipe.classNameMap.action}
              css={[
                styles.action,
                service?.accent ? { color: service.accent } : undefined,
                slotStyles?.action,
              ]}
            >
              <Box
                as="span"
                aria-hidden={service?.icon ? undefined : true}
                className={recipe.classNameMap.icon}
                css={[styles.icon, slotStyles?.icon]}
              >
                {service?.icon ?? serviceLabel.slice(0, 1).toUpperCase()}
              </Box>
              {serviceLabel}
            </Button>
          );
        })}
      </Box>
      <Text
        aria-live="polite"
        className={recipe.classNameMap.status}
        css={[styles.status, slotStyles?.status]}
      >
        {status}
      </Text>
    </Box>
  );
}

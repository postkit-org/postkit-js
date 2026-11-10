'use client';

import {
  Box,
  Button,
  Text,
  type BoxProps,
  type RecipeVariantProps,
  type UnstyledProp,
} from '@chakra-ui/react';
import { shareActionsDefinition } from '@postkit/core/components';
import { useState } from 'react';

import { parseJsonProp } from '../../lib/json-props.js';
import { usePostkit } from '../../lib/provider.js';
import type { PostkitSlotStyles } from '../../lib/recipes/types.js';
import type { PostkitShareRequest } from '../../lib/social-services.js';
import { postkitChakraView } from '../../lib/view.js';
import {
  postkitShareActionsRecipe,
  type PostkitShareActionsSlot,
} from './share-actions.recipe.js';

export type ShareActionsProps = {
  readonly url: string;
  readonly title?: string;
  readonly text?: string;
  readonly services?: string | readonly string[];
  readonly label?: string;
  readonly onShare?: (service: string, request: PostkitShareRequest) => void;
  readonly rootProps?: BoxProps;
  readonly slotStyles?: PostkitSlotStyles<PostkitShareActionsSlot>;
  /** A class per anatomy part, added after the recipe's class. */
  readonly classNames?: Partial<
    Readonly<Record<PostkitShareActionsSlot, string>>
  >;
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

/**
 * Reader-initiated native, copy, email and social sharing, styled by its
 * Chakra recipe. There is no headless view yet (03 D11).
 */
export const ShareActions = postkitChakraView<
  typeof shareActionsDefinition,
  ShareActionsProps
>(shareActionsDefinition, postkitShareActionsRecipe, ({ props, part }) => {
  const { url, title, text, label, onShare } = props;
  const services = parseJsonProp<string>(
    props.services ?? ['native', 'copy', 'email'],
    'ShareActions services',
  );
  const { socialServices } = usePostkit();
  const [status, setStatus] = useState('');
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
    <Box as="aside" {...part('root')}>
      <Text {...part('label')}>{label}</Text>
      <Box {...part('actions')}>
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
              {...part('action', {
                css: service?.accent ? { color: service.accent } : undefined,
              })}
            >
              <Box
                as="span"
                aria-hidden={service?.icon ? undefined : true}
                {...part('icon')}
              >
                {service?.icon ?? serviceLabel.slice(0, 1).toUpperCase()}
              </Box>
              {serviceLabel}
            </Button>
          );
        })}
      </Box>
      <Text aria-live="polite" {...part('status')}>
        {status}
      </Text>
    </Box>
  );
});

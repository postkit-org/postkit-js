'use client';

import {
  Box,
  Button,
  Text,
  type BoxProps,
  type ButtonProps,
  type RecipeVariantProps,
  type UnstyledProp,
} from '@chakra-ui/react';
import { postkitDefaultShareServiceIds } from '@postkit/core/behaviors';
import { shareActionsDefinition } from '@postkit/core/components';
import { useShareActions } from '@postkit/react';
import { useId } from 'react';

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

/**
 * Reader-initiated native, copy, email and social sharing, styled by its
 * Chakra recipe. Sharing comes from `useShareActions` in `@postkit/react`,
 * which the headless `ShareActions` uses too; the provider's
 * `socialServices` supply labels, icons and accents.
 *
 * The `label` part names the group of actions, and each action is named by
 * its visible service label. A service without an icon shows its initial,
 * drawn by the recipe from `data-postkit-initial` so it stays out of the
 * button's text (WCAG 2.5.3).
 */
export const ShareActions = postkitChakraView<
  typeof shareActionsDefinition,
  ShareActionsProps
>(shareActionsDefinition, postkitShareActionsRecipe, ({ props, part }) => {
  const { url, title, text, label, onShare } = props;
  const services = parseJsonProp<string>(
    props.services ?? postkitDefaultShareServiceIds,
    'ShareActions services',
  );
  const { socialServices } = usePostkit();
  const api = useShareActions({
    url,
    title,
    text,
    label: label ?? '',
    services: socialServices,
    onShare,
  });

  const labelId = `${useId()}-label`;

  return (
    <Box as="aside" {...part('root')}>
      <Text id={label ? labelId : undefined} {...part('label')}>
        {label}
      </Text>
      <Box
        role="group"
        aria-labelledby={label ? labelId : undefined}
        {...part('actions')}
      >
        {services.map((serviceId) => {
          const service = socialServices[serviceId];
          const serviceLabel = service?.label ?? serviceId;
          return (
            <Button
              key={serviceId}
              data-postkit-service={serviceId}
              {...(api.getActionProps(serviceId) as ButtonProps)}
              {...part('action', {
                css: service?.accent ? { color: service.accent } : undefined,
              })}
            >
              <Box
                as="span"
                aria-hidden={service?.icon ? undefined : true}
                data-postkit-initial={
                  service?.icon
                    ? undefined
                    : serviceLabel.slice(0, 1).toUpperCase()
                }
                {...part('icon')}
              >
                {service?.icon}
              </Box>
              {serviceLabel}
            </Button>
          );
        })}
      </Box>
      <Text {...(api.getStatusProps() as BoxProps)} {...part('status')}>
        {api.status}
      </Text>
    </Box>
  );
});

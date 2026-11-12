import { Box, chakra, Flex } from '@chakra-ui/react';
import type { PostkitComponentCatalogEntry } from '@postkit/chakra';

import type { PreviewControl } from '../../lib/components';
import { ComponentPreview } from '../component-preview';
import { SegmentedControl } from '../primitives';
import { segmentedOnSubtle } from './usage-panel';

/** Size values read as words; every other value is shown capitalised ("Subtle"). */
const valueLabels: Readonly<Record<string, string>> = {
  sm: 'Small',
  md: 'Medium',
  lg: 'Large',
};

function capitalise(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export interface PreviewControlsProps {
  /** One control per enum prop (`previewControls(component)`). */
  readonly controls: readonly PreviewControl[];
  readonly values: Readonly<Record<string, string>>;
  readonly onChange: (prop: string, value: string) => void;
}

/**
 * The preview's tweak controls (01 §6.3): a segmented control per manifest enum prop (tone,
 * variant, size), each a labelled radiogroup with the arrow-key pattern. On phones each
 * takes the full width and scrolls sideways if its values don't fit.
 */
export function PreviewControls({
  controls,
  values,
  onChange,
}: PreviewControlsProps) {
  if (controls.length === 0) return null;

  return (
    <Flex wrap="wrap" align="center" justify="space-between" gap="12px 16px">
      {controls.map((control) => (
        <Box
          key={control.prop}
          flex={{ base: '1 1 100%', md: '0 0 auto' }}
          maxWidth="100%"
          overflowX="auto"
          padding="3px"
          margin="-3px"
          css={segmentedOnSubtle}
        >
          <SegmentedControl
            aria-label={capitalise(control.prop)}
            fullWidth
            items={control.values.map((value) => ({
              value,
              label: valueLabels[value] ?? capitalise(value),
            }))}
            value={values[control.prop]}
            onValueChange={(value) => onChange(control.prop, value)}
          />
        </Box>
      ))}
    </Flex>
  );
}

export interface PreviewPanelProps extends PreviewControlsProps {
  readonly component: PostkitComponentCatalogEntry;
}

/**
 * The live preview (SiteComponent* boards): the controls on `bg.subtle`, then the real
 * `@postkit/chakra` component on the page colour. Changing a control re-renders it.
 */
export function PreviewPanel({
  component,
  controls,
  values,
  onChange,
}: PreviewPanelProps) {
  return (
    <chakra.section
      id="preview"
      aria-label="Preview"
      scrollMarginTop="calc({sizes.header} + 24px)"
      marginTop="48px"
      borderRadius="3xl"
      bg="bg.subtle"
      padding="clamp(20px, 4vw, 40px)"
    >
      <PreviewControls
        controls={controls}
        values={values}
        onChange={onChange}
      />
      <Box
        marginTop={controls.length ? { base: '24px', md: '40px' } : '0'}
        marginBottom="16px"
        borderRadius="xl"
        bg="bg"
        paddingBlock="clamp(24px, 5vw, 56px)"
        paddingInline="clamp(16px, 5vw, 64px)"
        minWidth="0"
      >
        <ComponentPreview name={component.name} values={values} />
      </Box>
    </chakra.section>
  );
}

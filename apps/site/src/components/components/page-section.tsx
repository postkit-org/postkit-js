import { chakra } from '@chakra-ui/react';
import type { ReactNode } from 'react';

import { TwoToneHeading } from '../layout';

export interface PageSectionProps {
  /** The section's anchor, also the "On this page" target: `props`. */
  readonly id: string;
  /** The statement half, without the full stop: "Props". */
  readonly title: string;
  /** The grey half: "Always in step with the code." */
  readonly quiet?: string;
  readonly children: ReactNode;
}

/**
 * One component-page section (SiteComponent* boards): 96px above (64px on phones), a two-tone
 * `docsH2` heading set at the boards' 28–36px, then the content.
 */
export function PageSection({ id, title, quiet, children }: PageSectionProps) {
  const headingId = `${id}-heading`;

  return (
    <chakra.section
      id={id}
      aria-labelledby={headingId}
      marginTop={{ base: '64px', md: '96px' }}
      scrollMarginTop="calc({sizes.header} + 24px)"
    >
      <TwoToneHeading
        as="h2"
        id={headingId}
        textStyle="docsH2"
        fontSize="clamp(28px, 3vw, 36px)"
        lineHeight="1.12"
        title={`${title}.`}
        quiet={quiet}
      />
      {children}
    </chakra.section>
  );
}

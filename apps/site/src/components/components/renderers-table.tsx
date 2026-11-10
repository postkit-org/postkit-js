import { chakra } from '@chakra-ui/react';

import type { RendererStatus, RendererSupportRow } from '../../lib/components';

const statusLabels: Readonly<Record<RendererStatus, string>> = {
  supported: 'Supported',
  static: 'Static',
  hydrated: 'Hydrated',
  planned: 'Planned',
  'not-supported': 'Not supported',
};

/** Supported in some form: a filled tip-green dot. Planned or missing: a hollow one. */
function isAvailable(status: RendererStatus): boolean {
  return status === 'supported' || status === 'static' || status === 'hydrated';
}

/**
 * The Renderers table (SiteComponent* boards): one row per renderer with its package and
 * status. Rows come from `rendererSupport` (`lib/components.ts`), which says where each
 * status comes from until 03 step 9's computed matrix lands.
 */
export function RenderersTable({
  rows,
}: {
  readonly rows: readonly RendererSupportRow[];
}) {
  return (
    <chakra.ul
      margin="24px 0 0"
      padding="0"
      listStyleType="none"
      borderBottomWidth="1px"
      borderBottomColor="border"
    >
      {rows.map((row) => {
        const available = isAvailable(row.status);
        return (
          <chakra.li
            key={row.renderer}
            display="flex"
            flexWrap="wrap"
            justifyContent="space-between"
            gap="6px 16px"
            paddingBlock="14px"
            borderTopWidth="1px"
            borderTopColor="border"
          >
            <span>
              <chakra.span fontWeight="medium">{row.renderer}</chakra.span>{' '}
              <chakra.span fontFamily="mono" fontSize="13px" color="fg.muted">
                {row.packageName}
              </chakra.span>
            </span>
            <chakra.span
              display="inline-flex"
              alignItems="center"
              gap="8px"
              fontSize="15px"
              color={available ? 'fg' : 'fg.muted'}
            >
              <chakra.span
                aria-hidden="true"
                width="8px"
                height="8px"
                borderRadius="full"
                bg={available ? 'tone.tip' : 'transparent'}
                borderWidth={available ? '0' : '1px'}
                borderColor="fg.quiet"
              />
              {statusLabels[row.status]}
            </chakra.span>
          </chakra.li>
        );
      })}
    </chakra.ul>
  );
}

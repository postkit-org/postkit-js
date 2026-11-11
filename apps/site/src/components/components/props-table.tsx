import { Box, chakra, Link as ChakraLink } from '@chakra-ui/react';
import type {
  PostkitComponentCatalogEntry,
  PostkitPropDeclaration,
} from '@postkit/chakra';
import NextLink from 'next/link';
import { Fragment } from 'react';

import type {
  ComponentPropDefault,
  ComponentPropDefaults,
} from '../../lib/component-prop-defaults';
import { formatPropType } from '../../lib/components';

/** `size` and `variant` sit last, under "Appearance" (01 §6.4). */
const appearanceProps = ['size', 'variant'] as const;

interface PropRow {
  readonly name: string;
  readonly prop: PostkitPropDeclaration;
  readonly defaultValue: string | null;
}

function formatDefault(value: ComponentPropDefault | undefined): string | null {
  if (value === undefined) return null;
  return typeof value === 'string' ? `"${value}"` : String(value);
}

/** Phone layout (under 761px): each row stacks, with "Type" and "Default" as labels. */
const stackedTable = {
  '@media (max-width: 760px)': {
    '&, & tbody, & tr, & th, & td': { display: 'block' },
    '& thead': { display: 'none' },
    '& tr[data-prop]': { paddingBlock: '16px' },
    '& tr[data-group]': { paddingTop: '28px', paddingBottom: '4px' },
    '& th, & td': { padding: '0 !important' },
    '& td': { marginTop: '6px' },
    '& td[data-label]::before': {
      content: 'attr(data-label)',
      display: 'inline-block',
      width: '68px',
      fontFamily: 'body',
      fontSize: '13px',
      color: 'fg.muted',
    },
    '& td[data-empty]': { display: 'none' },
    '& td[data-description]': { marginTop: '8px' },
  },
} as const;

const headerCell = {
  textAlign: 'start',
  paddingBottom: '12px',
  paddingInlineEnd: '16px',
  fontWeight: 'regular',
  fontSize: '14px',
  color: 'fg.muted',
} as const;

function Row({ row }: { readonly row: PropRow }) {
  return (
    <chakra.tr data-prop="" borderTopWidth="1px" borderTopColor="border">
      <chakra.th
        scope="row"
        textAlign="start"
        verticalAlign="top"
        paddingBlock="14px"
        paddingInlineEnd="16px"
        fontFamily="mono"
        fontWeight="medium"
        fontSize="14px"
        color="fg"
        overflowWrap="anywhere"
      >
        {row.name}
        {row.prop.required ? (
          <chakra.span
            display="block"
            marginTop="2px"
            fontFamily="body"
            fontWeight="regular"
            fontSize="12px"
            color="tone.caution"
          >
            Required
          </chakra.span>
        ) : null}
      </chakra.th>
      <chakra.td
        data-label="Type"
        verticalAlign="top"
        paddingBlock="14px"
        paddingInlineEnd="16px"
        fontFamily="mono"
        fontSize="13px"
        color="fg.secondary"
        overflowWrap="anywhere"
      >
        {formatPropType(row.prop)}
      </chakra.td>
      <chakra.td
        data-label="Default"
        data-empty={row.defaultValue === null ? '' : undefined}
        verticalAlign="top"
        paddingBlock="14px"
        paddingInlineEnd="16px"
        fontFamily="mono"
        fontSize="13px"
        color="fg.secondary"
        whiteSpace="nowrap"
      >
        {row.defaultValue ?? (
          <chakra.span color="border.faint">
            <chakra.span aria-hidden="true">—</chakra.span>
            <chakra.span srOnly>None</chakra.span>
          </chakra.span>
        )}
      </chakra.td>
      <chakra.td
        data-description=""
        verticalAlign="top"
        paddingBlock="14px"
        fontSize="15px"
        lineHeight="1.5"
        color="fg.secondary"
      >
        {row.prop.description}
      </chakra.td>
    </chakra.tr>
  );
}

/**
 * The props table (01 §6.4): Prop (mono, "Required" in red under the name), Type (string
 * enums as `"a" | "b"`), Default, Description. `size` and `variant` sit last, under
 * "Appearance". Under 761px each row stacks. `defaults` are manifest v2's per-prop
 * `default` (`componentPropDefaults`, read in `getStaticProps`).
 */
export function PropsTable({
  component,
  defaults,
}: {
  readonly component: PostkitComponentCatalogEntry;
  readonly defaults: ComponentPropDefaults;
}) {
  const rows = Object.entries(component.props).map(([name, prop]): PropRow => ({
    name,
    prop,
    defaultValue: formatDefault(
      Object.hasOwn(defaults, name) ? defaults[name] : undefined,
    ),
  }));
  const isAppearance = (row: PropRow) =>
    (appearanceProps as readonly string[]).includes(row.name);
  const ownRows = rows.filter((row) => !isAppearance(row));
  const appearanceRows = appearanceProps.flatMap((name) =>
    rows.filter((row) => row.name === name),
  );

  return (
    <Box marginTop="24px">
      <chakra.table width="100%" borderCollapse="collapse" css={stackedTable}>
        <colgroup>
          <col style={{ width: '22%' }} />
          <col style={{ width: '30%' }} />
          <col style={{ width: '12%' }} />
          <col />
        </colgroup>
        <thead>
          <tr>
            <chakra.th scope="col" {...headerCell}>
              Prop
            </chakra.th>
            <chakra.th scope="col" {...headerCell}>
              Type
            </chakra.th>
            <chakra.th scope="col" {...headerCell}>
              Default
            </chakra.th>
            <chakra.th scope="col" {...headerCell} paddingInlineEnd="0">
              Description
            </chakra.th>
          </tr>
        </thead>
        <tbody>
          {ownRows.map((row) => (
            <Row key={row.name} row={row} />
          ))}
          {appearanceRows.length ? (
            <Fragment>
              <chakra.tr data-group="">
                <chakra.th
                  colSpan={4}
                  scope="colgroup"
                  textAlign="start"
                  paddingTop="32px"
                  paddingBottom="10px"
                  fontWeight="medium"
                  fontSize="13px"
                  color="fg.muted"
                >
                  Appearance
                </chakra.th>
              </chakra.tr>
              {appearanceRows.map((row) => (
                <Row key={row.name} row={row} />
              ))}
            </Fragment>
          ) : null}
        </tbody>
      </chakra.table>
      <chakra.p
        margin="20px 0 0"
        fontSize="14px"
        lineHeight="1.55"
        color="fg.muted"
      >
        Every component also takes{' '}
        <chakra.code fontFamily="mono" fontSize="13px">
          unstyled
        </chakra.code>{' '}
        and the part-styling props. Change a default for your whole site with{' '}
        <chakra.code fontFamily="mono" fontSize="13px">
          defaults
        </chakra.code>{' '}
        in{' '}
        <chakra.code fontFamily="mono" fontSize="13px">
          createPostkit
        </chakra.code>
        .{' '}
        <ChakraLink
          asChild
          color="accent"
          textDecoration="underline"
          textDecorationThickness="1px"
          textUnderlineOffset="3px"
          _hover={{ textDecorationThickness: '2px' }}
        >
          <NextLink href="/docs/part-styles">Part styles</NextLink>
        </ChakraLink>
      </chakra.p>
    </Box>
  );
}

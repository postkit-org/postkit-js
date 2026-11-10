import {
  Blockquote,
  Code,
  Heading,
  Hr,
  Img,
  Link,
  List,
  ListItem,
  Pre,
  Section,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFoot,
  TableHead,
  TableHeader,
  TableRow,
  Text,
} from '@chakra-email/core';
import {
  createPostkitDocument,
  parsePostkitHtml,
  serializePostkitHtml,
  type PostkitComponentNode,
  type PostkitElementNode,
  type PostkitNode,
} from '@postkit/core';
import { createElement, Fragment, type ReactNode } from 'react';

import type { PostkitEmailView } from '../email-views.js';
import {
  EMAIL_FOOTNOTE_ATTRIBUTE,
  EMAIL_FOOTNOTES_ATTRIBUTE,
} from './end-notes.js';
import {
  planEmailComponent,
  resolveEmailUrl,
  type EmailRenderContext,
} from './plan.js';
import type { EmailWarnings } from './warnings.js';

/** Where a text fallback's static view places the component's own children. */
const SLOT_ID = 'postkit-email-slot';

interface RenderState {
  readonly context: EmailRenderContext;
  readonly warnings: EmailWarnings;
  /** The authored children a fallback's slot stands for. */
  readonly slot?: readonly PostkitNode[];
  /** Inside the end notes: smaller type. */
  readonly small?: boolean;
}

type HeadingTag = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

const headingSizes: Readonly<Record<HeadingTag, string>> = {
  h1: '3xl',
  h2: '2xl',
  h3: 'xl',
  h4: 'lg',
  h5: 'md',
  h6: 'sm',
};

/** Elements that only group content: rendered as plain blocks. */
const blockElements = new Set([
  'address',
  'article',
  'aside',
  'details',
  'div',
  'figure',
  'footer',
  'header',
  'main',
  'nav',
  'picture',
  'section',
]);

/** Inline elements kept as themselves: they need no styles to read. */
const inlineElements = new Set([
  'abbr',
  'b',
  'cite',
  'del',
  'em',
  'i',
  'mark',
  'q',
  's',
  'small',
  'strong',
  'sub',
  'sup',
  'time',
  'u',
]);

/** Elements with no place in an email. */
const droppedElements = new Set([
  'audio',
  'button',
  'embed',
  'form',
  'iframe',
  'input',
  'object',
  'script',
  'source',
  'style',
  'template',
  'track',
  'video',
]);

function attribute(node: PostkitElementNode, name: string): unknown {
  return node.attributes?.[name];
}

function literalText(nodes: readonly PostkitNode[]): string {
  return nodes
    .map((node) =>
      node.type === 'text'
        ? node.value
        : node.type === 'element' && node.name === 'br'
          ? '\n'
          : literalText(node.children),
    )
    .join('');
}

function renderChildren(
  nodes: readonly PostkitNode[],
  state: RenderState,
): ReactNode[] {
  return nodes.map((node, index) => renderNode(node, state, index));
}

function renderNode(
  node: PostkitNode,
  state: RenderState,
  key: number,
): ReactNode {
  switch (node.type) {
    case 'text':
      return node.value;
    case 'component':
      return renderComponent(node, state, key);
    default:
      return renderElement(node, state, key);
  }
}

function renderElement(
  node: PostkitElementNode,
  state: RenderState,
  key: number,
): ReactNode {
  const name = node.name.toLowerCase();
  const children = () => renderChildren(node.children, state);
  const fontSize = state.small ? 'sm' : undefined;

  if (attribute(node, 'id') === SLOT_ID && state.slot) {
    return (
      <Fragment key={key}>
        {renderChildren(state.slot, { ...state, slot: undefined })}
      </Fragment>
    );
  }
  const override = Object.hasOwn(state.context.elements, name)
    ? state.context.elements[name]
    : undefined;
  if (override) return renderElementOverride(override, node, state, key);
  if (attribute(node, 'hidden') === true || droppedElements.has(name)) {
    if (name === 'input' && attribute(node, 'type') === 'checkbox') {
      return attribute(node, 'checked') === true ? '☑ ' : '☐ ';
    }
    return null;
  }

  switch (name) {
    case 'p':
      // A component written inline (`<Callout>…</Callout>` on one line)
      // renders a table, which can't sit in a <p>.
      return (
        <Text
          key={key}
          as={
            node.children.some((child) => child.type === 'component')
              ? 'div'
              : 'p'
          }
          fontSize={fontSize}
        >
          {children()}
        </Text>
      );
    case 'h1':
    case 'h2':
    case 'h3':
    case 'h4':
    case 'h5':
    case 'h6':
      return (
        <Heading
          key={key}
          as={name}
          fontSize={headingSizes[name]}
          mt={name === 'h1' ? 0 : 6}
        >
          {children()}
        </Heading>
      );
    case 'ul':
    case 'ol': {
      const start = Number(attribute(node, 'start'));
      return (
        <List
          key={key}
          as={name}
          {...(name === 'ol' && Number.isInteger(start) && start !== 1
            ? { start }
            : {})}
        >
          {children()}
        </List>
      );
    }
    case 'li': {
      const checked = attribute(node, 'checked');
      return (
        <ListItem key={key} fontSize={fontSize}>
          {typeof checked === 'boolean' ? (checked ? '☑ ' : '☐ ') : null}
          {renderListItemChildren(node.children, state)}
        </ListItem>
      );
    }
    case 'a': {
      const href = resolveEmailUrl(
        attribute(node, 'href'),
        state.context.baseUrl,
      );
      return href ? (
        <Link key={key} href={href} color="fg">
          {children()}
        </Link>
      ) : (
        <Fragment key={key}>{children()}</Fragment>
      );
    }
    case 'img': {
      const src = resolveEmailUrl(
        attribute(node, 'src'),
        state.context.baseUrl,
      );
      const alt = attribute(node, 'alt');
      if (!src) return typeof alt === 'string' && alt ? alt : null;
      const width = Number(attribute(node, 'width'));
      return (
        <Img
          key={key}
          src={src}
          alt={typeof alt === 'string' ? alt : ''}
          width={Number.isFinite(width) && width > 0 ? width : undefined}
          maxW="full"
          mb={2}
        />
      );
    }
    case 'code':
    case 'kbd':
      return <Code key={key}>{literalText(node.children)}</Code>;
    case 'pre':
      return (
        <Pre key={key}>{literalText(node.children).replace(/\n$/, '')}</Pre>
      );
    case 'blockquote':
      return <Blockquote key={key}>{children()}</Blockquote>;
    case 'hr':
      return <Hr key={key} />;
    case 'br':
      return <br key={key} />;
    case 'table':
      return (
        <Table key={key} mb={4}>
          {children()}
        </Table>
      );
    case 'thead':
      return <TableHead key={key}>{children()}</TableHead>;
    case 'tbody':
      return <TableBody key={key}>{children()}</TableBody>;
    case 'tfoot':
      return <TableFoot key={key}>{children()}</TableFoot>;
    case 'tr':
      return <TableRow key={key}>{children()}</TableRow>;
    case 'th':
      return <TableHeader key={key}>{children()}</TableHeader>;
    case 'td':
      return <TableCell key={key}>{children()}</TableCell>;
    case 'caption':
      return <TableCaption key={key}>{children()}</TableCaption>;
    case 'figcaption':
    case 'summary':
    case 'dt':
      return (
        <Text
          key={key}
          as="div"
          fontSize={name === 'figcaption' ? 'sm' : fontSize}
          fontWeight={name === 'figcaption' ? undefined : 'bold'}
          mb={name === 'summary' ? 2 : 1}
        >
          {children()}
        </Text>
      );
    case 'dl':
      return (
        <div key={key} style={{ marginBottom: 16 }}>
          {children()}
        </div>
      );
    case 'dd':
      return (
        <Text key={key} as="div" fontSize={fontSize} mb={2}>
          {children()}
        </Text>
      );
    case 'span':
      return <span key={key}>{children()}</span>;
    case 'sup':
      return attribute(node, EMAIL_FOOTNOTE_ATTRIBUTE) !== undefined ? (
        <sup key={key} style={{ lineHeight: 0, fontSize: '0.75em' }}>
          {children()}
        </sup>
      ) : (
        <sup key={key}>{children()}</sup>
      );
  }

  if (name === 'section' && attribute(node, EMAIL_FOOTNOTES_ATTRIBUTE)) {
    return (
      <Section key={key} data-postkit-email="end-notes" mt={8}>
        <Hr mt={0} />
        {renderChildren(node.children, { ...state, small: true })}
      </Section>
    );
  }
  if (inlineElements.has(name)) {
    const title = attribute(node, 'title');
    return createElement(
      name,
      {
        key,
        ...(name === 'abbr' && typeof title === 'string' ? { title } : {}),
      },
      ...children(),
    );
  }
  if (blockElements.has(name)) {
    return (
      <div
        key={key}
        style={name === 'figure' ? { marginBottom: 16 } : undefined}
      >
        {children()}
      </div>
    );
  }
  return <Fragment key={key}>{children()}</Fragment>;
}

/**
 * A host's element override, as in an MDX component map: it gets the element's
 * attributes (URLs made absolute) and its rendered children.
 */
function renderElementOverride(
  View: PostkitEmailView,
  node: PostkitElementNode,
  state: RenderState,
  key: number,
): ReactNode {
  const props: Record<string, unknown> = { key, ...node.attributes };
  for (const name of ['href', 'src']) {
    if (props[name] !== undefined) {
      props[name] = resolveEmailUrl(props[name], state.context.baseUrl);
    }
  }
  return createElement(View, props, ...renderChildren(node.children, state));
}

/** Content inside a view: its last paragraph doesn't add space at the end. */
function renderContained(
  nodes: readonly PostkitNode[],
  state: RenderState,
): ReactNode[] {
  return nodes.map((node, index) =>
    index === nodes.length - 1 &&
    node.type === 'element' &&
    node.name === 'p' ? (
      <Text key={index} fontSize={state.small ? 'sm' : undefined} mb={0}>
        {renderChildren(node.children, state)}
      </Text>
    ) : (
      renderNode(node, state, index)
    ),
  );
}

/** A tight list item's single paragraph reads as the item, without a gap. */
function renderListItemChildren(
  nodes: readonly PostkitNode[],
  state: RenderState,
): ReactNode[] {
  const [only] = nodes;
  if (nodes.length === 1 && only?.type === 'element' && only.name === 'p') {
    return renderChildren(only.children, state);
  }
  return nodes.map((node, index) =>
    node.type === 'element' && node.name === 'p' ? (
      <Text
        key={index}
        fontSize={state.small ? 'sm' : undefined}
        mb={index === nodes.length - 1 ? 0 : 2}
      >
        {renderChildren(node.children, state)}
      </Text>
    ) : (
      renderNode(node, state, index)
    ),
  );
}

/** A `text` fallback: the component's static view as email-safe prose. */
function renderStaticFallback(
  node: PostkitComponentNode,
  state: RenderState,
  key: number,
): ReactNode {
  const probe: PostkitComponentNode = {
    ...node,
    children: node.children.length
      ? [
          {
            type: 'element',
            name: 'div',
            attributes: { id: SLOT_ID },
            children: [],
          },
        ]
      : [],
  };
  const html = serializePostkitHtml(
    createPostkitDocument([probe]),
    state.context.staticOptions,
  );
  const view = parsePostkitHtml(html, { allowComponent: () => false });
  return (
    <Section
      key={key}
      data-postkit-component={node.name}
      data-postkit-email-fallback="text"
      mb={4}
    >
      {renderChildren(view.children, { ...state, slot: node.children })}
    </Section>
  );
}

function renderComponent(
  node: PostkitComponentNode,
  state: RenderState,
  key: number,
): ReactNode {
  const plan = planEmailComponent(node, state.context);
  if (plan.kind === 'view') {
    const children = node.children.length
      ? renderContained(node.children, state)
      : undefined;
    return createElement(plan.view, { key, ...plan.props }, children);
  }
  if (plan.kind === 'unknown') {
    state.warnings.add({
      code: 'unknown-component',
      component: node.name,
      message: `<${node.name}> isn't a known component, so only its content is in the email.`,
    });
    return (
      <Fragment key={key}>{renderChildren(node.children, state)}</Fragment>
    );
  }

  state.warnings.add({
    code: 'email-fallback',
    component: node.name,
    message: plan.declared
      ? `${node.name} has no email view, so it uses its "${plan.fallback}" fallback.`
      : `${node.name} has no email view and its definition declares no email fallback, so it renders as text.`,
  });
  switch (plan.fallback) {
    case 'omit':
      return null;
    case 'link':
      return (
        <Text
          key={key}
          data-postkit-component={node.name}
          data-postkit-email-fallback="link"
        >
          <Link href={plan.href ?? ''} color="fg">
            {plan.label}
          </Link>
        </Text>
      );
    default:
      return renderStaticFallback(node, state, key);
  }
}

/** Renders a document's nodes as email-safe React elements. */
export function renderEmailNodes(
  nodes: readonly PostkitNode[],
  context: EmailRenderContext,
  warnings: EmailWarnings,
): ReactNode[] {
  return renderChildren(nodes, { context, warnings });
}

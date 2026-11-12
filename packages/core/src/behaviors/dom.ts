import { createNormalizer, type PropTypes } from '@zag-js/types';

/**
 * Prop types for framework-free hosts: plain objects keyed the JSX way
 * (`onClick`, `tabIndex`, `htmlFor`), which {@link spreadProps} applies to DOM
 * elements.
 */
export type DomPropTypes = PropTypes<Record<string, unknown>>;

/**
 * Zag's prop normalizer for framework-free hosts. It returns props unchanged;
 * {@link spreadProps} translates them when it applies them.
 */
export const normalizeProps = createNormalizer<DomPropTypes>((props) => props);

const eventNames: Readonly<Record<string, string>> = {
  onBlur: 'focusout',
  onChange: 'input',
  onDoubleClick: 'dblclick',
  onFocus: 'focusin',
};

const attributeNames: Readonly<Record<string, string>> = {
  className: 'class',
  htmlFor: 'for',
  readOnly: 'readonly',
  tabIndex: 'tabindex',
};

interface SpreadRecord {
  readonly listeners: Map<string, EventListener>;
  readonly attributes: Set<string>;
  readonly styles: Set<string>;
}

const records = new WeakMap<Element, SpreadRecord>();

function cssProperty(name: string): string {
  return name.startsWith('--')
    ? name
    : name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

function eventName(key: string): string {
  return eventNames[key] ?? key.slice(2).toLowerCase();
}

/**
 * Applies JSX-style props from a Zag `connect` API (or the embed consent API)
 * to a DOM element, as a framework would on render. Call it again with the
 * next props after each change: attributes, styles and listeners that are no
 * longer present are removed. Returns a function that removes everything it
 * added.
 */
export function spreadProps(
  element: Element,
  props: Readonly<Record<string, unknown>>,
): () => void {
  const record: SpreadRecord = records.get(element) ?? {
    listeners: new Map(),
    attributes: new Set(),
    styles: new Set(),
  };
  records.set(element, record);
  const nextListeners = new Set<string>();
  const nextAttributes = new Set<string>();
  const nextStyles = new Set<string>();
  const style = (element as HTMLElement).style as
    CSSStyleDeclaration | undefined;

  for (const [key, value] of Object.entries(props)) {
    if (key === 'children' || key === 'key' || key === 'ref') continue;

    if (/^on[A-Z]/.test(key)) {
      if (typeof value !== 'function') continue;
      const name = eventName(key);
      nextListeners.add(name);
      const previous = record.listeners.get(name);
      if (previous) element.removeEventListener(name, previous);
      const listener = value as EventListener;
      element.addEventListener(name, listener);
      record.listeners.set(name, listener);
      continue;
    }

    if (key === 'style') {
      if (!style || value == null || typeof value !== 'object') continue;
      for (const [name, styleValue] of Object.entries(value)) {
        const property = cssProperty(name);
        if (styleValue == null || styleValue === '') continue;
        style.setProperty(property, String(styleValue));
        nextStyles.add(property);
      }
      continue;
    }

    if (key === 'defaultValue' || key === 'value') {
      if ('value' in element && value != null) {
        (element as HTMLInputElement).value = String(value);
      }
      continue;
    }

    const attribute = attributeNames[key] ?? key;
    const keepsFalse =
      attribute.startsWith('aria-') || attribute.startsWith('data-');
    if (value == null || (value === false && !keepsFalse)) continue;
    element.setAttribute(
      attribute,
      value === true && !keepsFalse ? '' : String(value),
    );
    nextAttributes.add(attribute);
  }

  for (const [name, listener] of record.listeners) {
    if (nextListeners.has(name)) continue;
    element.removeEventListener(name, listener);
    record.listeners.delete(name);
  }
  for (const attribute of record.attributes) {
    if (!nextAttributes.has(attribute)) element.removeAttribute(attribute);
  }
  for (const property of record.styles) {
    if (!nextStyles.has(property)) style?.removeProperty(property);
  }
  record.attributes.clear();
  nextAttributes.forEach((attribute) => record.attributes.add(attribute));
  record.styles.clear();
  nextStyles.forEach((property) => record.styles.add(property));

  return () => {
    for (const [name, listener] of record.listeners) {
      element.removeEventListener(name, listener);
    }
    record.attributes.forEach((attribute) =>
      element.removeAttribute(attribute),
    );
    record.styles.forEach((property) => style?.removeProperty(property));
    records.delete(element);
  };
}

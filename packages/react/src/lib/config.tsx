import * as React from 'react';
import type { ComponentType, HTMLAttributes, ReactNode } from 'react';

/** Any component a renderer or site supplies as a view or part. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type PostkitAnyComponent = ComponentType<any>;

/**
 * The props a slot override receives: the part's anatomy attributes, its
 * `className` (in `@postkit/chakra`, including the recipe's styles), any
 * `style` and ARIA attributes the view sets, and its children. Spread them
 * onto the override's root element.
 */
export type PostkitSlotProps = HTMLAttributes<HTMLElement> & {
  readonly 'data-postkit-part': string;
  readonly children?: ReactNode;
  readonly [attribute: `data-${string}`]: string | undefined;
};

/**
 * A site's configuration for one component, as `createPostkit` resolves it
 * (03 §4): rung 3 `classNames`, rung 4 `defaults` and rung 5 `slots`.
 */
export interface PostkitComponentConfig {
  /**
   * Site class names per anatomy part (rung 3), added before an instance's
   * own `classNames`.
   */
  readonly classNames?: Readonly<Record<string, string>>;
  /**
   * Site defaults (rung 4, D18): an unset prop takes this value before the
   * definition's default. An author's prop always wins.
   */
  readonly defaults?: Readonly<Record<string, unknown>>;
  /**
   * Slot overrides (rung 5): a component per anatomy part. The component
   * replaces that part's element and receives its props (anatomy
   * attributes, `className`, styles and children).
   */
  readonly slots?: Readonly<Record<string, PostkitAnyComponent>>;
}

/** What `PostkitConfigProvider` puts in context, keyed by component name. */
export interface PostkitConfig {
  readonly components: Readonly<Record<string, PostkitComponentConfig>>;
}

const emptyConfig: PostkitConfig = Object.freeze({
  components: Object.freeze({}),
});

/*
 * React Server Components have no context. There, `createContext` and
 * `useContext` are missing from React's server build, so views render with
 * no site configuration instead of failing.
 */
const PostkitConfigContext =
  typeof React.createContext === 'function'
    ? React.createContext<PostkitConfig>(emptyConfig)
    : undefined;

const usePostkitConfigContext: () => PostkitConfig =
  PostkitConfigContext && typeof React.useContext === 'function'
    ? () => React.useContext(PostkitConfigContext)
    : () => emptyConfig;

export interface PostkitConfigProviderProps {
  readonly value: PostkitConfig;
  readonly children?: ReactNode;
}

/**
 * Supplies site defaults and slot overrides to every Postkit view beneath
 * it. `createPostkit().Provider` renders this for you.
 */
export function PostkitConfigProvider({
  value,
  children,
}: PostkitConfigProviderProps) {
  if (!PostkitConfigContext) return children;
  return (
    <PostkitConfigContext.Provider value={value}>
      {children}
    </PostkitConfigContext.Provider>
  );
}

/** The nearest Postkit configuration (empty outside a provider). */
export function usePostkitConfig(): PostkitConfig {
  return usePostkitConfigContext();
}

/** The nearest configuration for one component, by definition name. */
export function usePostkitComponentConfig(
  name: string,
): PostkitComponentConfig | undefined {
  return usePostkitConfigContext().components[name];
}

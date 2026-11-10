import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

export interface OpenSearchOptions {
  /** Limit results to one group, e.g. the docs nav's "Search docs" field. */
  readonly scope?: 'docs';
  /** Pre-fill the query (the 404 page, `/?q=`). */
  readonly query?: string;
}

interface SearchContextValue {
  readonly openSearch: (options?: OpenSearchOptions) => void;
}

const SearchContext = createContext<SearchContextValue>({
  openSearch: () => undefined,
});

/**
 * The dialog's code, and the search client in it, load the first time search opens
 * (07 §4: nothing beyond the trigger until then).
 */
const SearchDialog = dynamic(
  () =>
    import('../components/search/search-dialog').then(
      (mod) => mod.SearchDialog,
    ),
  { ssr: false },
);

/** The longest query `/api/search` accepts. */
const MAX_QUERY_LENGTH = 128;

interface SearchState {
  readonly open: boolean;
  readonly query: string;
  readonly scope?: 'docs';
  /** Bumped on every open, so each opening starts fresh. */
  readonly session: number;
}

function isSearchShortcut(event: KeyboardEvent): boolean {
  return (
    (event.metaKey || event.ctrlKey) &&
    !event.altKey &&
    !event.shiftKey &&
    event.key.toLowerCase() === 'k'
  );
}

/**
 * The one way to open site search (01 §8): the header trigger, ⌘K / Ctrl K, the docs nav's
 * "Search docs" field, the 404 page and `/?q=` all go through `openSearch`. The dialog is
 * mounted here, so it works on every page.
 */
export function SearchProvider({ children }: { readonly children: ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<SearchState>({
    open: false,
    query: '',
    session: 0,
  });
  const openRef = useRef(false);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  const openSearch = useCallback((options?: OpenSearchOptions) => {
    const active = document.activeElement;
    returnFocusRef.current =
      active instanceof HTMLElement && active !== document.body ? active : null;
    openRef.current = true;
    setState((previous) => ({
      open: true,
      query: (options?.query ?? '').slice(0, MAX_QUERY_LENGTH),
      scope: options?.scope,
      session: previous.session + 1,
    }));
  }, []);

  const closeSearch = useCallback(() => {
    openRef.current = false;
    setState((previous) => ({ ...previous, open: false }));

    // A `/?q=` link opened it: drop `q`, so a reload or Back doesn't open it again.
    const url = new URL(window.location.href);
    if (url.searchParams.has('q')) {
      url.searchParams.delete('q');
      void router.replace(
        `${url.pathname}${url.search}${url.hash}`,
        undefined,
        {
          shallow: true,
          scroll: false,
        },
      );
    }
  }, [router]);

  // ⌘K / Ctrl K, from anywhere. While the dialog is open it handles the shortcut itself.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!isSearchShortcut(event) || event.defaultPrevented) return;
      event.preventDefault();
      if (!openRef.current) openSearch();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [openSearch]);

  // `/?q=…` (the SearchAction in 01 §7): any page loaded with `q` opens with that query.
  const handledQueryParam = useRef(false);
  useEffect(() => {
    if (!router.isReady || handledQueryParam.current) return;
    handledQueryParam.current = true;
    const q = router.query.q;
    const query = (Array.isArray(q) ? q[0] : q)?.trim();
    if (query) openSearch({ query });
  }, [router.isReady, router.query.q, openSearch]);

  const value = useMemo(() => ({ openSearch }), [openSearch]);

  return (
    <SearchContext.Provider value={value}>
      {children}
      {state.session > 0 ? (
        <SearchDialog
          open={state.open}
          session={state.session}
          initialQuery={state.query}
          scope={state.scope}
          onClose={closeSearch}
          returnFocus={() => returnFocusRef.current}
        />
      ) : null}
    </SearchContext.Provider>
  );
}

export function useSearch(): SearchContextValue {
  return useContext(SearchContext);
}

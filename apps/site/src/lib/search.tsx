import {
  createContext,
  useCallback,
  useContext,
  useMemo,
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
 * The one way to open site search (handoff 01 §8): the header trigger, ⌘K, the docs nav's
 * "Search docs" field and the 404 page all call `openSearch`. Until PK-041 adds the dialog
 * this does nothing; PK-041 replaces the body of `openSearch` and renders the dialog here.
 */
export function SearchProvider({ children }: { readonly children: ReactNode }) {
  const openSearch = useCallback((options?: OpenSearchOptions) => {
    // PK-041: open the search dialog with `options`.
    void options;
  }, []);
  const value = useMemo(() => ({ openSearch }), [openSearch]);
  return (
    <SearchContext.Provider value={value}>{children}</SearchContext.Provider>
  );
}

export function useSearch(): SearchContextValue {
  return useContext(SearchContext);
}

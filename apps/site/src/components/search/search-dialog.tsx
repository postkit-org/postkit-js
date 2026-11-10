import { Box, chakra, Dialog, Portal } from '@chakra-ui/react';
import {
  groupSearchResults,
  type SiteSearchResponse,
  type SiteSearchResult,
} from '@postkit/site-search/client';
import { useRouter } from 'next/router';
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
} from 'react';

import { SearchIcon } from '../icons';
import { Kbd } from '../primitives';
import { searchSite } from './search-client';
import { NoResults } from './search-no-results';
import { SearchResultList, type SearchOption } from './search-results';

export interface SearchDialogProps {
  readonly open: boolean;
  /** Changes on every opening; the query and results start fresh. */
  readonly session: number;
  readonly initialQuery: string;
  readonly scope?: 'docs';
  readonly onClose: () => void;
  /** Where focus goes back to on close: the trigger that opened it. */
  readonly returnFocus: () => HTMLElement | null;
}

/** Wait this long after a keystroke before asking; each keystroke cancels the last request. */
const TYPING_DELAY_MS = 120;

/**
 * Site search (PK-041; SiteSearch, SiteSearchEmpty, PhoneSearch, SiteSearchDark): a modal
 * combobox over `/api/search`. Chakra's Dialog gives it the focus trap, Esc, scroll lock
 * and focus return; this adds the grouped listbox and its keyboard model.
 */
export function SearchDialog({
  open,
  session,
  initialQuery,
  scope,
  onClose,
  returnFocus,
}: SearchDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(details) => {
        if (!details.open) onClose();
      }}
      initialFocusEl={() => inputRef.current}
      finalFocusEl={returnFocus}
      motionPreset="none"
      lazyMount
      unmountOnExit
    >
      <Portal>
        <Dialog.Backdrop
          bg="bg.scrim"
          backdropFilter="blur(3px)"
          display={{ base: 'none', md: 'block' }}
        />
        <Dialog.Positioner alignItems="flex-start">
          <Dialog.Content
            width={{ base: '100%', md: '640px' }}
            maxWidth={{ base: '100%', md: 'calc(100% - 32px)' }}
            height={{ base: '100dvh', md: 'auto' }}
            maxHeight={{ base: '100dvh', md: 'calc(100dvh - 128px)' }}
            marginBlock="0"
            marginTop={{ base: '0', md: '96px' }}
            borderRadius={{ base: '0', md: '2xl' }}
            bg="bg"
            color="fg"
            boxShadow={{ base: 'none', md: 'dialog' }}
            overflow="hidden"
            fontSize="body"
            lineHeight="body"
          >
            <Dialog.Title srOnly>Search</Dialog.Title>
            <SearchPanel
              key={session}
              inputRef={inputRef}
              initialQuery={initialQuery}
              scope={scope}
              onClose={onClose}
            />
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}

interface SearchPanelProps {
  readonly inputRef: React.RefObject<HTMLInputElement | null>;
  readonly initialQuery: string;
  readonly scope?: 'docs';
  readonly onClose: () => void;
}

type SearchStatus =
  | { readonly state: 'loading' }
  | { readonly state: 'ready'; readonly response: SiteSearchResponse }
  | { readonly state: 'error' };

function SearchPanel({
  inputRef,
  initialQuery,
  scope,
  onClose,
}: SearchPanelProps) {
  const router = useRouter();
  const id = useId();
  const listboxId = `${id}-results`;
  const [query, setQuery] = useState(initialQuery);
  const [status, setStatus] = useState<SearchStatus>({ state: 'loading' });
  const [activeIndex, setActiveIndex] = useState(0);

  // One request per settled query; typing cancels the one in flight.
  useEffect(() => {
    const controller = new AbortController();
    const trimmed = query.trim();
    const timer = window.setTimeout(
      () => {
        searchSite(
          trimmed,
          scope ? [scope] : undefined,
          controller.signal,
        ).then(
          (response) => {
            if (controller.signal.aborted) return;
            setStatus({ state: 'ready', response });
            setActiveIndex(0);
          },
          () => {
            if (!controller.signal.aborted) setStatus({ state: 'error' });
          },
        );
      },
      trimmed ? TYPING_DELAY_MS : 0,
    );
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, scope]);

  const response = status.state === 'ready' ? status.response : null;
  const groups = useMemo(
    () => (response ? groupSearchResults(response) : []),
    [response],
  );
  const options = useMemo<SearchOption[]>(
    () =>
      groups.flatMap((group) =>
        group.results.map((result) => ({
          id: `${id}-option-${result.id}`,
          group: group.id,
          result,
        })),
      ),
    [groups, id],
  );
  const active = options[Math.min(activeIndex, options.length - 1)];

  // Keep the active option in view as the arrows move it.
  useEffect(() => {
    if (!active) return;
    document.getElementById(active.id)?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const navigate = useCallback(
    (route: string) => {
      onClose();
      void router.push(route);
    },
    [onClose, router],
  );

  const onInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      // ⌘K again: select the query, ready to retype.
      event.preventDefault();
      event.currentTarget.select();
      return;
    }
    if (options.length === 0) return;

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const step = event.key === 'ArrowDown' ? 1 : -1;
      setActiveIndex(
        (index) =>
          (Math.min(index, options.length - 1) + step + options.length) %
          options.length,
      );
    } else if (
      event.key === 'Enter' &&
      active &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      if (event.metaKey || event.ctrlKey) {
        window.open(active.result.route, '_blank', 'noopener');
      } else {
        navigate(active.result.route);
      }
    }
  };

  const onOptionClick = (
    event: MouseEvent<HTMLAnchorElement>,
    result: SiteSearchResult,
  ) => {
    // Modified clicks keep the browser's behaviour (new tab, new window).
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }
    event.preventDefault();
    navigate(result.route);
  };

  const trimmed = query.trim();
  const noResults =
    response !== null &&
    response.kind === 'results' &&
    response.results.length === 0;
  // The full placeholder doesn't fit a phone's pill field (PhoneSearch: "Search Postkit").
  const [isPhone] = useState(
    () => window.matchMedia('(max-width: 760px)').matches,
  );
  const placeholder =
    scope === 'docs'
      ? 'Search docs'
      : isPhone
        ? 'Search Postkit'
        : 'Search components, docs and notes';

  return (
    <>
      <SearchHeader onClose={onClose}>
        <chakra.input
          ref={inputRef}
          type="search"
          role="combobox"
          aria-label={scope === 'docs' ? 'Search docs' : 'Search Postkit'}
          aria-expanded={options.length > 0}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={active?.id}
          placeholder={placeholder}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={onInputKeyDown}
          maxLength={128}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          enterKeyHint="go"
          flex="1"
          minWidth="0"
          border="0"
          bg="transparent"
          font="inherit"
          fontSize={{ base: '16px', md: 'lg' }}
          color="fg"
          outline="none"
          css={{
            '&::placeholder': { color: 'fg.muted' },
            '&::-webkit-search-cancel-button': { appearance: 'none' },
            '&:focus-visible': { outline: 'none' },
          }}
        />
      </SearchHeader>

      <Box flex="1" minHeight="0" overflowY="auto" overscrollBehavior="contain">
        {status.state === 'error' ? (
          <chakra.p
            padding="40px 32px"
            textAlign="center"
            color="fg.muted"
            fontSize="md"
          >
            Search isn&rsquo;t available right now. Try again in a moment.
          </chakra.p>
        ) : noResults ? (
          <NoResults
            query={response.query}
            suggestions={response.suggestions ?? []}
            onNavigate={navigate}
          />
        ) : null}

        {/* The listbox stays in the DOM, empty, so `aria-controls` always resolves. */}
        <SearchResultList
          id={listboxId}
          label={response?.kind === 'featured' ? 'Suggestions' : 'Results'}
          groups={groups}
          options={options}
          activeId={active?.id}
          query={response?.kind === 'results' ? response.query : ''}
          onHover={(index) => setActiveIndex(index)}
          onSelect={onOptionClick}
        />
      </Box>

      <chakra.p srOnly role="status" aria-live="polite">
        {status.state === 'ready' && trimmed
          ? options.length > 0
            ? `${options.length} result${options.length === 1 ? '' : 's'}`
            : `No results for ${trimmed}`
          : ''}
      </chakra.p>

      <SearchFooter scope={scope} />
    </>
  );
}

function SearchHeader({
  children,
  onClose,
}: {
  readonly children: React.ReactNode;
  readonly onClose: () => void;
}) {
  return (
    <Box
      display="flex"
      alignItems="center"
      gap="12px"
      flexShrink={0}
      height={{ md: '64px' }}
      paddingBlock={{ base: '12px', md: '0' }}
      paddingInline={{ base: '16px', md: '20px' }}
      borderBottomWidth="1px"
      borderColor="border"
      color="fg.muted"
    >
      {/* Phones: a pill field (PhoneSearch). Desktop: the row is the field (SiteSearch). */}
      <chakra.label
        flex="1"
        minWidth="0"
        display="flex"
        alignItems="center"
        gap={{ base: '10px', md: '12px' }}
        height={{ base: 'tap', md: 'auto' }}
        paddingInline={{ base: '14px', md: '0' }}
        borderRadius={{ base: 'full', md: '0' }}
        bg={{ base: 'bg.subtle', md: 'transparent' }}
      >
        <Box
          as="span"
          display="inline-flex"
          flexShrink={0}
          transform={{ md: 'scale(1.2)' }}
        >
          <SearchIcon aria-hidden="true" />
        </Box>
        {children}
      </chakra.label>
      <Kbd display={{ base: 'none', md: 'inline-flex' }} aria-hidden="true">
        esc
      </Kbd>
      <chakra.button
        type="button"
        onClick={onClose}
        display={{ base: 'inline-flex', md: 'none' }}
        alignItems="center"
        minHeight="tap"
        border="0"
        bg="transparent"
        padding="0"
        font="inherit"
        fontSize="16px"
        color="fg"
        cursor="pointer"
      >
        Cancel
      </chakra.button>
    </Box>
  );
}

function SearchFooter({ scope }: { readonly scope?: 'docs' }) {
  return (
    <Box
      display={{ base: 'none', md: 'flex' }}
      flexWrap="wrap"
      justifyContent="space-between"
      gap="8px 24px"
      flexShrink={0}
      paddingBlock="12px"
      paddingInline="20px"
      borderTopWidth="1px"
      borderColor="border"
      fontSize="12.5px"
      color="fg.muted"
    >
      <Box as="span" display="inline-flex" alignItems="center" gap="6px">
        <Kbd>↑</Kbd>
        <Kbd>↓</Kbd>
        <span>to move</span>
        <Box as="span" width="10px" />
        <Kbd>↵</Kbd>
        <span>to open</span>
        <Box as="span" width="10px" />
        <Kbd>esc</Kbd>
        <span>to close</span>
      </Box>
      <span>
        {scope === 'docs'
          ? 'Docs only'
          : 'Components, docs, notes and the changelog'}
      </span>
    </Box>
  );
}

import { Box, chakra, type BoxProps } from '@chakra-ui/react';
import { gradients } from '@postkit/site-theme';
import { useEffect, useState } from 'react';

import type { TocHeading } from '../../lib/headings';

export interface TocProps extends Omit<BoxProps, 'children'> {
  /** The page's sections, in order. Build them with `extractHeadings` (`lib/headings`). */
  readonly headings: readonly TocHeading[];
}

/**
 * Where a heading counts as "reached": under the sticky header, with some room to spare.
 * Matches the `scrollMarginTop` that `MdxContent` gives its headings.
 */
const ACTIVE_LINE_PX = 56 + 24;

/**
 * The id of the section being read: the last heading above the active line, the first
 * before any is reached, and the last once the page is scrolled to the bottom.
 */
function readActiveId(ids: readonly string[]): string | null {
  const elements = ids
    .map((id) => document.getElementById(id))
    .filter((element): element is HTMLElement => element !== null);
  if (elements.length === 0) return null;

  const scrolledToBottom =
    window.innerHeight + window.scrollY >=
    document.documentElement.scrollHeight - 2;
  if (scrolledToBottom) return elements[elements.length - 1].id;

  let active = elements[0].id;
  for (const element of elements) {
    if (element.getBoundingClientRect().top <= ACTIVE_LINE_PX + 1) {
      active = element.id;
    } else {
      break;
    }
  }
  return active;
}

/**
 * The scroll-spied id among `ids`. An IntersectionObserver watches each heading cross the
 * active line (or enter and leave the viewport) and re-reads which section is current.
 * A jump that carries a heading straight past the viewport (End, a dragged scrollbar, a
 * deep link) crosses no observed edge, so `scrollend` re-reads it too.
 */
function useActiveHeading(
  ids: readonly string[],
): [string | null, (id: string) => void] {
  const [activeId, setActiveId] = useState<string | null>(ids[0] ?? null);
  const key = ids.join('\n');

  useEffect(() => {
    const list = key ? key.split('\n') : [];
    if (list.length === 0 || typeof IntersectionObserver === 'undefined')
      return;

    const update = () => setActiveId(readActiveId(list));
    const observer = new IntersectionObserver(update, {
      rootMargin: `-${ACTIVE_LINE_PX}px 0px 0px 0px`,
      threshold: [0, 1],
    });
    for (const id of list) {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    }
    window.addEventListener('scrollend', update, { passive: true });
    update();

    return () => {
      observer.disconnect();
      window.removeEventListener('scrollend', update);
    };
  }, [key]);

  return [activeId, setActiveId];
}

/**
 * "On this page" (02 §5; SiteDocs*, SiteComponent* boards): a `nav` landmark listing the
 * page's sections as in-page links. The section being read gets the vertical gradient pill
 * (scroll-spy) and `aria-current="location"`. Hidden under 761px (01 §6.3, §6.5).
 *
 * Links are plain `#id` anchors, so the jump is the browser's. `styles.css` makes it smooth
 * only under `prefers-reduced-motion: no-preference`; the pill's colour change is the only
 * transition, and the global reduced-motion rule removes it.
 * The parent positions it (e.g. `position="sticky" top="88px"`).
 */
export function Toc({ headings, ...props }: TocProps) {
  const [activeId, setActiveId] = useActiveHeading(
    headings.map((heading) => heading.id),
  );

  if (headings.length === 0) return null;

  return (
    <Box
      as="nav"
      aria-label="On this page"
      display={{ base: 'none', md: 'block' }}
      fontSize="14px"
      {...props}
    >
      <chakra.p margin="0 0 8px" color="fg.muted">
        On this page
      </chakra.p>
      <chakra.ul margin="0" padding="0" listStyleType="none">
        {headings.map((heading) => {
          const active = heading.id === activeId;
          return (
            <li key={heading.id}>
              <chakra.a
                href={`#${heading.id}`}
                aria-current={active ? 'location' : undefined}
                onClick={() => setActiveId(heading.id)}
                display="flex"
                gap="10px"
                paddingBlock="4px"
                color={active ? 'fg' : 'fg.muted'}
                textDecoration="none"
                borderRadius="xs"
                transitionProperty="color"
                transitionDuration="hover"
                transitionTimingFunction="ease-out"
                _hover={{ color: 'fg' }}
              >
                <chakra.span
                  aria-hidden="true"
                  flex="0 0 3px"
                  alignSelf="stretch"
                  marginBlock="3px"
                  borderRadius="3px"
                  backgroundImage={active ? gradients.brandVertical : undefined}
                />
                {heading.text}
              </chakra.a>
            </li>
          );
        })}
      </chakra.ul>
    </Box>
  );
}

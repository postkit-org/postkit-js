import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

import { SegmentedControl, type SegmentedControlItem } from './primitives';

type ThemeChoice = 'system' | 'light' | 'dark';

// 02 §7: inline SVG at a 1.5 stroke in `currentColor` (the SiteHome board's icons).
const iconProps = {
  width: 14,
  height: 14,
  viewBox: '0 0 16 16',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  'aria-hidden': true,
  focusable: false,
} as const;

const items: readonly SegmentedControlItem<ThemeChoice>[] = [
  {
    value: 'system',
    ariaLabel: 'System',
    label: (
      <svg {...iconProps}>
        <rect x="2" y="3" width="12" height="8.5" rx="1.5" />
        <path d="M6 14h4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    value: 'light',
    ariaLabel: 'Light',
    label: (
      <svg {...iconProps} strokeLinecap="round">
        <circle cx="8" cy="8" r="3" />
        <path d="M8 1.5v1.5M8 13v1.5M1.5 8H3M13 8h1.5M3.4 3.4l1 1M11.6 11.6l1 1M3.4 12.6l1-1M11.6 4.4l1-1" />
      </svg>
    ),
  },
  {
    value: 'dark',
    ariaLabel: 'Dark',
    label: (
      <svg {...iconProps} strokeLinejoin="round">
        <path d="M13.5 9.5A5.5 5.5 0 0 1 6.5 2.5a5.5 5.5 0 1 0 7 7z" />
      </svg>
    ),
  },
];

const isChoice = (value: string | undefined): value is ThemeChoice =>
  value === 'system' || value === 'light' || value === 'dark';

/**
 * The footer theme switch (01 §11, 02 §5): a radiogroup of System, Light and Dark.
 *
 * next-themes stores the choice in `localStorage` (no cookie) and, while it's System,
 * follows the OS live. The stored choice isn't known on the server, so the group renders
 * with nothing selected until it mounts; the track is the same size either way.
 */
export function ThemeSwitch() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <SegmentedControl<ThemeChoice>
      aria-label="Theme"
      size="icon"
      items={items}
      value={mounted && isChoice(theme) ? theme : undefined}
      onValueChange={setTheme}
    />
  );
}

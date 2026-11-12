import type { SVGProps } from 'react';

// UI icons (02 §7): inline SVG, 1.6 stroke, `currentColor`, decorative (the control names itself).
type IconProps = Omit<SVGProps<SVGSVGElement>, 'children'>;

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  'aria-hidden': true,
  focusable: false,
} as const;

export function SearchIcon(props: IconProps) {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" {...stroke} {...props}>
      <circle cx="7" cy="7" r="5" />
      <path d="M11 11l3.5 3.5" />
    </svg>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" {...stroke} {...props}>
      <path d="M3 6h12M3 12h12" />
    </svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" {...stroke} {...props}>
      <path d="M4.5 4.5l9 9M13.5 4.5l-9 9" />
    </svg>
  );
}

/** Two overlapping sheets of paper: the copy action on every code block and command. */
export function CopyIcon(props: IconProps) {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 16 16"
      {...stroke}
      strokeLinejoin="round"
      {...props}
    >
      <rect x="5.5" y="5.5" width="8.5" height="8.5" rx="1.8" />
      <path d="M10.5 5.5V3.8A1.8 1.8 0 0 0 8.7 2H3.8A1.8 1.8 0 0 0 2 3.8v4.9a1.8 1.8 0 0 0 1.8 1.8h1.7" />
    </svg>
  );
}

/** The copied tick (02 §6: tip green, set by the caller's colour). */
export function CheckIcon(props: IconProps) {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 16 16"
      {...stroke}
      strokeWidth={2}
      strokeLinejoin="round"
      {...props}
    >
      <path d="M3 8.5l3.2 3.2L13 4.8" />
    </svg>
  );
}

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

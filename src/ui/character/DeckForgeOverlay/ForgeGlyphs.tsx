import type { SVGProps } from "react";

const SVG_PROPS: SVGProps<SVGSVGElement> = {
  viewBox: "0 0 48 48",
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

export function DeckPlusGlyph() {
  return (
    <svg {...SVG_PROPS} aria-hidden="true">
      <rect x="10" y="12" width="24" height="27" rx="3" strokeWidth="1.5" />
      <path d="m14 8 24 4v25a3 3 0 0 1-3 3h-4M14 8v4M14 8l24 4" strokeWidth="1.5" />
      <path d="M20 25h12M26 19v12" strokeWidth="1.5" />
    </svg>
  );
}

export function DeckMinusGlyph() {
  return (
    <svg {...SVG_PROPS} aria-hidden="true">
      <rect x="10" y="12" width="24" height="27" rx="3" strokeWidth="1.5" />
      <path d="m14 8 24 4v25a3 3 0 0 1-3 3h-4M14 8v4M14 8l24 4" strokeWidth="1.5" />
      <path d="M20 25h12" strokeWidth="1.5" />
    </svg>
  );
}

export function ConfirmGlyph() {
  return (
    <svg {...SVG_PROPS} aria-hidden="true">
      <path d="m9 25 9 9 21-21" strokeWidth="2.4" />
      <path d="M9 39h30" strokeWidth="1" opacity=".45" />
    </svg>
  );
}
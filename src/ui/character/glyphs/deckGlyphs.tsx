import type { SVGProps } from "react";
import type { Rarity } from "@/engine";
import { RARITY_CRYSTAL_ART } from "@/ui/art/rarityArt";

const SVG_PROPS: SVGProps<SVGSVGElement> = {
  viewBox: "0 0 48 48",
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

function point(radius: number, angle: number) {
  const radians = (angle * Math.PI) / 180;
  return {
    x: 24 + Math.cos(radians) * radius,
    y: 24 + Math.sin(radians) * radius,
  };
}

export function RarityCrystal({
  rarity,
  muted = false,
  className,
}: {
  rarity: Rarity;
  muted?: boolean;
  className?: string;
}) {
  return (
    <img
      className={className}
      src={RARITY_CRYSTAL_ART[rarity]}
      alt=""
      aria-hidden="true"
      draggable={false}
      style={muted ? { filter: "grayscale(1)", opacity: 0.4 } : undefined}
    />
  );
}

export function LevelBadge({ level, levelMax }: { level: number; levelMax: number }) {
  const segments = Math.max(1, levelMax);
  const activeLevel = Math.max(0, Math.min(level, segments));
  return (
    <svg {...SVG_PROPS} aria-hidden="true">
      {Array.from({ length: segments }, (_, index) => {
        const start = point(19, -90 + (360 / segments) * index + 3);
        const end = point(22, -90 + (360 / segments) * (index + 1) - 3);
        const active = index < activeLevel;
        return (
          <line
            key={index}
            x1={start.x}
            y1={start.y}
            x2={end.x}
            y2={end.y}
            strokeWidth={active ? 2.4 : 1.2}
            opacity={active ? 1 : 0.22}
          />
        );
      })}
      <path d="m24 6 15 9v18l-15 9-15-9V15l15-9Z" strokeWidth="1.4" opacity=".9" />
      <path d="m24 11 10 6v14l-10 6-10-6V17l10-6Z" strokeWidth=".8" opacity=".38" />
      <text x="24" y="27.5" fill="currentColor" stroke="none" textAnchor="middle" fontSize="8" fontWeight="700">
        Lv.{level}
      </text>
    </svg>
  );
}

export function DeckStackGlyph() {
  return (
    <svg {...SVG_PROPS} aria-hidden="true">
      <rect x="10" y="12" width="24" height="27" rx="3" strokeWidth="1.5" />
      <path d="m14 8 24 4v25a3 3 0 0 1-3 3h-4M14 8v4M14 8l24 4" strokeWidth="1.5" />
      <path d="M16 20h12M16 25h8" strokeWidth="1.2" opacity=".7" />
    </svg>
  );
}

export function ExpShardGlyph() {
  return (
    <svg {...SVG_PROPS} aria-hidden="true">
      <path d="m27 5 10 11-8 27-18-17L27 5Z" strokeWidth="1.5" />
      <path d="m27 5-1 16 11-5M26 21l-15 5M26 21l3 22" strokeWidth="1.2" opacity=".78" />
      <path d="m20 17 6 4-7 2" strokeWidth="1" opacity=".6" />
    </svg>
  );
}

export function LockGlyph() {
  return (
    <svg {...SVG_PROPS} aria-hidden="true">
      <rect x="12" y="21" width="24" height="19" rx="3" strokeWidth="1.6" />
      <path d="M17 21v-5a7 7 0 0 1 14 0v5M24 28v5" strokeWidth="1.6" />
      <circle cx="24" cy="28" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function MaxGlyph() {
  return (
    <svg {...SVG_PROPS} aria-hidden="true">
      <path d="m24 5 5 5 7-1-1 7 5 5-5 5 1 7-7-1-5 6-5-6-7 1 1-7-5-5 5-5-1-7 7 1 5-5Z" strokeWidth="1.4" />
      <path d="m17 25 5 5 10-11" strokeWidth="2" />
    </svg>
  );
}
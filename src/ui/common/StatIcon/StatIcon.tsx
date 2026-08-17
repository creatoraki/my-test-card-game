import type { ReactNode } from "react";
import type { StatBlock } from "@/engine";

const SVG_PROPS = {
  viewBox: "0 0 48 48",
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const ICONS: Partial<Record<keyof StatBlock, () => ReactNode>> = {
  maxHp: () => (
    <path d="M24 39S8 29 8 18c0-5 3-9 8-9 4 0 7 3 8 6 1-3 4-6 8-6 5 0 8 4 8 9 0 11-16 21-16 21Z" strokeWidth={1.8} />
  ),
  attack: () => (
    <>
      <path d="m12 36 10-10M26 22 36 12M28 12l8 8M20 28l8 8" strokeWidth={1.8} />
      <path d="m10 38 6-2 2-6-6 2-2 6ZM30 18l6-2 2-6-6 2-2 6Z" strokeWidth={1.8} />
    </>
  ),
  defense: () => (
    <path d="M24 42S9 35 9 21V11l15-5 15 5v10c0 14-15 21-15 21Z" strokeWidth={1.8} />
  ),
  healPower: () => (
    <>
      <path d="M18 8h12M18 40h12M16 12h16v24H16Z" strokeWidth={1.8} />
      <path d="M24 17v14M17 24h14" strokeWidth={1.8} />
    </>
  ),
  hitRate: () => (
    <>
      <circle cx="24" cy="24" r="13" strokeWidth={1.8} />
      <circle cx="24" cy="24" r="4" strokeWidth={1.8} />
      <path d="M24 6v6M24 36v6M6 24h6M36 24h6" strokeWidth={1.8} />
    </>
  ),
  dodgeRate: () => (
    <>
      <path d="M17 36c-5-4-7-9-5-15 2-5 6-8 12-9M31 12c5 4 7 9 5 15-2 5-6 8-12 9" strokeWidth={1.8} />
      <path d="m21 8 3 4-5 1M27 40l-3-4 5-1" strokeWidth={1.8} />
    </>
  ),
  critRate: () => (
    <>
      <path d="m24 7 4 10 11 1-8 7 3 11-10-6-10 6 3-11-8-7 11-1 4-10Z" strokeWidth={1.8} />
      <path d="m28 19-5 7 5 1-5 7" strokeWidth={1.8} />
    </>
  ),
  critDamage: () => (
    <>
      <path d="M10 38 38 10M14 15l-4-5M33 38l5-1-1-5M25 7l-1 6M41 23l-6 1" strokeWidth={1.8} />
      <path d="m18 30-3-8 8 3M30 18l3 8-8-3" strokeWidth={1.8} />
    </>
  ),
  precision: () => (
    <>
      <path d="M24 7v8M24 33v8M7 24h8M33 24h8" strokeWidth={1.8} />
      <path d="m16 16 6 6M32 16l-6 6M16 32l6-6M32 32l-6-6" strokeWidth={1.8} />
      <circle cx="24" cy="24" r="5" strokeWidth={1.8} />
    </>
  ),
  initiative: () => (
    <>
      <circle cx="24" cy="25" r="14" strokeWidth={1.8} />
      <path d="M24 25V15M24 25l7 4M19 7h10" strokeWidth={1.8} />
    </>
  ),
  blockRate: () => (
    <>
      <path d="M24 42S9 35 9 21V11l15-5 15 5v10c0 14-15 21-15 21Z" strokeWidth={1.8} />
      <path d="m14 34 20-20" strokeWidth={2.2} />
    </>
  ),
  healBoost: () => (
    <>
      <path d="M24 37S11 29 11 20c0-4 3-7 7-7 3 0 5 2 6 4 1-2 3-4 6-4 4 0 7 3 7 7 0 9-13 17-13 17Z" strokeWidth={1.8} />
      <path d="M36 8v10M31 13h10" strokeWidth={1.8} />
    </>
  ),
  shieldBoost: () => (
    <>
      <path d="M24 39S11 33 11 21v-8l13-4 13 4v8c0 12-13 18-13 18Z" strokeWidth={1.8} />
      <path d="M24 27V15M18 21h12" strokeWidth={1.8} />
    </>
  ),
  ailmentResist: () => (
    <>
      <path d="M24 41S10 34 10 21V11l14-5 14 5v10c0 13-14 20-14 20Z" strokeWidth={1.8} />
      <path d="M24 15c-3 4-5 7-5 10a5 5 0 0 0 10 0c0-3-2-6-5-10Z" strokeWidth={1.8} />
    </>
  ),
  burdenAdapt: () => (
    <>
      <path d="M13 18h22l3 20H10l3-20ZM17 18c0-5 3-8 7-8s7 3 7 8" strokeWidth={1.8} />
      <path d="M24 23v10M19 28h10" strokeWidth={1.8} />
    </>
  ),
};

function FallbackStatIcon() {
  return (
    <>
      <circle cx="24" cy="24" r="14" strokeWidth={1.2} opacity={0.45} />
      <path d="M16 24c0-5 3-8 8-8s8 3 8 8-3 8-8 8-8-3-8-8ZM24 10v6M24 32v6" strokeWidth={1.6} />
    </>
  );
}

export function StatIcon({ statKey, className }: { statKey: keyof StatBlock; className?: string }) {
  const Icon = ICONS[statKey] ?? FallbackStatIcon;
  return (
    <svg {...SVG_PROPS} className={className} aria-hidden="true">
      <Icon />
    </svg>
  );
}
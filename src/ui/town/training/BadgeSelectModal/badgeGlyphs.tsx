import type { CSSProperties, ReactNode } from "react";
import s from "./BadgeSelectModal.module.css";

interface BadgeGlyphProps {
  badgeId: string;
  size?: number | string;
  className?: string;
}

interface BadgeArtProps {
  gradientId: string;
}

const ART: Record<string, (props: BadgeArtProps) => ReactNode> = {
  novice: ({ gradientId }) => (
    <g className={s["bsg-subject"]}>
      <path className={s["bsg-core"]} d="M100 48 143 73v53l-43 27-43-27V73l43-25Z" fill={`url(#${gradientId})`} stroke="var(--badge-hue, var(--tr-glow))" strokeWidth="1.6" />
      <path d="M100 63 128 80v38l-28 17-28-17V80l28-17Z" stroke="var(--badge-hue, var(--tr-glow))" strokeWidth="1.1" opacity=".82" />
      <circle className={s["bsg-breathe"]} cx="100" cy="99" r="17" fill={`url(#${gradientId})`} stroke="var(--badge-hue, var(--tr-glow))" strokeWidth="1.5" />
      <circle cx="100" cy="99" r="7" stroke="var(--badge-ink, var(--tr-ink))" strokeWidth="1.4" />
      <path d="M100 83v32M84 99h32" stroke="var(--badge-ink, var(--tr-ink))" strokeWidth="1.1" opacity=".86" />
    </g>
  ),
  rush: ({ gradientId }) => (
    <g className={s["bsg-subject"]}>
      <path className={s["bsg-speed-line"]} d="M43 89h48M36 105h45M55 121h31" stroke="var(--badge-deep, var(--tr-glow-deep))" strokeWidth="2" opacity=".8" />
      <path className={s["bsg-core"]} d="m73 73 56 27-56 27 17-27-17-27Z" fill={`url(#${gradientId})`} stroke="var(--badge-hue, var(--tr-glow))" strokeWidth="1.6" />
      <path d="m101 73 42 27-42 27 16-27-16-27Z" fill="none" stroke="var(--badge-hue, var(--tr-glow))" strokeWidth="1.2" opacity=".82" />
      <circle className={s["bsg-breathe"]} cx="112" cy="100" r="10" fill={`url(#${gradientId})`} stroke="var(--badge-ink, var(--tr-ink))" strokeWidth="1.2" />
    </g>
  ),
  reload: ({ gradientId }) => (
    <g className={s["bsg-subject"]}>
      <circle className={s["bsg-spin"]} cx="100" cy="100" r="55" fill="none" stroke="var(--badge-deep, var(--tr-glow-deep))" strokeWidth="2" strokeDasharray="3 8" />
      <circle cx="100" cy="100" r="43" fill="none" stroke="var(--badge-hue, var(--tr-glow))" strokeWidth="1.1" opacity=".72" />
      <path className={s["bsg-core"]} d="M78 70h35l10 10v51H78V70Z" fill={`url(#${gradientId})`} stroke="var(--badge-hue, var(--tr-glow))" strokeWidth="1.6" />
      <path d="M88 81h25M88 92h25M88 115h25M88 126h18" stroke="var(--badge-ink, var(--tr-ink))" strokeWidth="2" opacity=".76" />
      <path d="m70 81 9-9M130 119l9 9M130 81l9-9M70 119l-9 9" stroke="var(--badge-hue, var(--tr-glow))" strokeWidth="1.5" />
      <circle className={s["bsg-breathe"]} cx="100" cy="104" r="9" fill={`url(#${gradientId})`} stroke="var(--badge-ink, var(--tr-ink))" strokeWidth="1.1" />
    </g>
  ),
  reserve: ({ gradientId }) => (
    <g className={s["bsg-subject"]}>
      <path d="m59 89 29-17 30 17-29 17-30-17ZM59 89v34l30 18v-35L59 89ZM118 89v34l-29 18v-35l29-17Z" fill={`url(#${gradientId})`} stroke="var(--badge-deep, var(--tr-glow-deep))" strokeWidth="1.2" />
      <path className={s["bsg-core"]} d="m77 68 29-17 30 17-29 17-30-17ZM77 68v34l30 18V85L77 68ZM136 68v34l-29 18V85l29-17Z" fill={`url(#${gradientId})`} stroke="var(--badge-hue, var(--tr-glow))" strokeWidth="1.5" />
      <rect className={s["bsg-breathe"]} x="93" y="76" width="21" height="21" fill={`url(#${gradientId})`} stroke="var(--badge-ink, var(--tr-ink))" strokeWidth="1.1" />
    </g>
  ),
  observer: ({ gradientId }) => (
    <g className={s["bsg-subject"]}>
      <circle className={s["bsg-spin"]} cx="100" cy="100" r="53" fill="none" stroke="var(--badge-deep, var(--tr-glow-deep))" strokeWidth="1.6" strokeDasharray="2 7" />
      <circle cx="100" cy="100" r="42" fill="none" stroke="var(--badge-hue, var(--tr-glow))" strokeWidth="1.5" />
      <circle className={s["bsg-core"]} cx="100" cy="100" r="24" fill={`url(#${gradientId})`} stroke="var(--badge-hue, var(--tr-glow))" strokeWidth="1.5" />
      <circle className={s["bsg-breathe"]} cx="100" cy="100" r="8" fill="var(--badge-ink, var(--tr-ink))" />
      <path d="M100 42v35M100 123v35M42 100h35M123 100h35" stroke="var(--badge-hue, var(--tr-glow))" strokeWidth="1.2" opacity=".86" />
      <path d="m100 58 4 7-4 7-4-7 4-7ZM100 128l4 7-4 7-4-7 4-7ZM58 100l7-4 7 4-7 4-7-4ZM128 100l7-4 7 4-7 4-7-4Z" fill="var(--badge-hue, var(--tr-glow))" />
    </g>
  ),
};

function FallbackArt({ gradientId }: BadgeArtProps) {
  return (
    <g className={s["bsg-subject"]}>
      <circle className={s["bsg-core"]} cx="100" cy="100" r="34" fill={`url(#${gradientId})`} stroke="var(--badge-hue, var(--tr-glow))" strokeWidth="1.5" />
      <path d="M100 76v48M76 100h48" stroke="var(--badge-ink, var(--tr-ink))" strokeWidth="1.4" />
    </g>
  );
}

export function BadgeGlyph({ badgeId, size = "100%", className }: BadgeGlyphProps) {
  const gradientId = `badge-core-${badgeId}`;
  const style = { "--badge-size": typeof size === "number" ? `${size}px` : size } as CSSProperties;
  const art = ART[badgeId]?.({ gradientId }) ?? <FallbackArt gradientId={gradientId} />;

  return (
    <svg
      className={className}
      style={style}
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={`${badgeId} 徽章图形`}
    >
      <defs>
        <linearGradient id={`badge-bg-${badgeId}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--badge-hue, var(--tr-glow))" stopOpacity=".12" />
          <stop offset=".58" stopColor="var(--badge-deep, var(--tr-glow-deep))" stopOpacity=".06" />
          <stop offset="1" stopColor="var(--badge-hue, var(--tr-glow))" stopOpacity=".015" />
        </linearGradient>
        <radialGradient id={gradientId} cx="50%" cy="45%" r="60%">
          <stop offset="0" stopColor="var(--badge-ink, var(--tr-ink))" stopOpacity=".72" />
          <stop offset=".08" stopColor="var(--badge-hue, var(--tr-glow))" stopOpacity=".8" />
          <stop offset=".32" stopColor="var(--badge-hue, var(--tr-glow))" stopOpacity=".22" />
          <stop offset="1" stopColor="var(--badge-hue, var(--tr-glow))" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="200" height="200" fill={`url(#badge-bg-${badgeId})`} stroke="var(--tr-line)" />
      <g className={s["bsg-grid"]} transform="matrix(1 0 0 .54 0 57)" aria-hidden="true">
        <path d="M0 18h200M0 42h200M0 66h200M0 90h200M0 114h200M0 138h200M0 162h200M0 186h200" />
        <path d="M14 0v200M38 0v200M62 0v200M86 0v200M110 0v200M134 0v200M158 0v200M182 0v200" />
      </g>
      <path className={s["bsg-frame"]} d="M20 54V20h34M146 20h34v34M180 146v34h-34M54 180H20v-34" stroke="var(--tr-line)" strokeWidth="1.1" />
      <polygon className={s["bsg-sweep"]} points="-25,34 18,0 225,166 181,200" aria-hidden="true" />
      {art}
      <g className={s["bsg-label"]} fill="var(--badge-hue, var(--tr-glow))" aria-hidden="true">
        <rect x="27" y="28" width="22" height="16" fill="none" stroke="currentColor" strokeWidth=".8" />
        <text x="38" y="39" textAnchor="middle" fontSize="9">{String(Object.keys(ART).indexOf(badgeId) + 1).padStart(2, "0")}</text>
        <text x="173" y="170" textAnchor="end" fontSize="6.5" letterSpacing="1.4">SQUAD BADGE</text>
        <text x="173" y="181" textAnchor="end" fill="var(--badge-ink, var(--tr-ink))" fontSize="6" letterSpacing="1">{badgeId.toUpperCase()}</text>
      </g>
    </svg>
  );
}
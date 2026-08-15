// 六条训练链的方向图标(迁自旧 TalentNode 的 TRACK_ICONS)。
// 画法统一: 48×48 视框、stroke="currentColor"、主体 strokeWidth 3.2、陪衬 2.4 + 低透明度。
// 内嵌在天赋树 SVG 里, 必须带显式 width/height(48), 由父级 g 的 scale 缩放。

export const TRACK_ICON_VIEWBOX = 48;
export const TRACK_ICON_SIZE = 48;

const TRACK_ICONS: Record<string, (props: { className?: string }) => JSX.Element> = {
  handLimit: ({ className }) => (
    <svg className={className} width={48} height={48} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeLinecap="round">
      <path d="M9 13h30v24H9z" strokeWidth={2.4} opacity={0.5} />
      <path d="M15 18h18M15 24h12M15 30h8" strokeWidth={3.2} />
      <path d="M36 9v8M32 13h8" strokeWidth={3.2} />
    </svg>
  ),
  redraw: ({ className }) => (
    <svg className={className} width={48} height={48} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeLinecap="round">
      <path d="M12 18a14 14 0 0 1 24-3l3 4" strokeWidth={2.4} opacity={0.5} />
      <path d="M36 30a14 14 0 0 1-24 3l-3-4" strokeWidth={2.4} opacity={0.5} />
      <path d="M36 11v8h-8M12 37v-8h8" strokeWidth={3.2} />
    </svg>
  ),
  wait: ({ className }) => (
    <svg className={className} width={48} height={48} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeLinecap="round">
      <circle cx="24" cy="24" r="15" strokeWidth={2.4} opacity={0.5} />
      <path d="M24 15v10l7 4" strokeWidth={3.2} />
      <path d="M10 10l4 4M38 10l-4 4" strokeWidth={3.2} />
    </svg>
  ),
  mana: ({ className }) => (
    <svg className={className} width={48} height={48} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeLinecap="round">
      <path d="m24 5 14 19-14 19L10 24 24 5Z" strokeWidth={2.4} opacity={0.5} />
      <path d="m24 12 8.5 12-8.5 12-8.5-12L24 12Z" strokeWidth={3.2} />
      <path d="M24 18v12M18 24h12" strokeWidth={2.8} />
    </svg>
  ),
  draw: ({ className }) => (
    <svg className={className} width={48} height={48} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeLinecap="round">
      <path d="M11 9h26v30H11z" strokeWidth={2.4} opacity={0.5} />
      <path d="M17 15h14M17 22h10M17 29h14" strokeWidth={3.2} />
      <path d="M34 34h6M37 31v6" strokeWidth={3.2} />
    </svg>
  ),
  openingHand: ({ className }) => (
    <svg className={className} width={48} height={48} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeLinecap="round">
      <path d="M9 14h30v24H9z" strokeWidth={2.4} opacity={0.5} />
      <path d="M16 20h16M16 26h10M16 32h6" strokeWidth={3.2} />
      <path d="M34 7v9M29.5 11.5h9" strokeWidth={3.2} />
    </svg>
  ),
};

export function TrackIcon({ branchId, className }: { branchId: string; className?: string }) {
  const Icon = TRACK_ICONS[branchId] ?? TRACK_ICONS.handLimit;
  return <Icon className={className} />;
}

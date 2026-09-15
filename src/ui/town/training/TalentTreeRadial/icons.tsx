// 六种训练图标：卡牌扇、抽牌、循环箭头、秒表、水晶与叠牌。
// 48×48 显式视框，可同时嵌入节点 SVG 与底部属性栏。
export const TRACK_ICON_VIEWBOX = 48;
export const TRACK_ICON_SIZE = 48;

export function TrackIcon({ branchId, className, resource = false }: {
  branchId: string; className?: string; resource?: boolean;
}) {
  const fan = branchId === "openingHand" || (resource && branchId === "handLimit");
  return (
    <svg className={className} width={48} height={48} viewBox="0 0 48 48" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true">
      {fan && <>
        <path d="m7 13 12-4 8 28-12 4Z" fill="currentColor" fillOpacity=".15" />
        <path d="M17 7h15v29H17Z" fill="#07151f" />
        <path d="m28 10 14 5-9 27-14-5Z" fill="currentColor" fillOpacity=".16" />
        <path d="m31 18 2 5-4 3-1-5Z" fill="currentColor" strokeWidth="1" />
        <path d="m5 17 7 26M21 11h6M24 31h4" opacity=".65" />
      </>}
      {branchId === "draw" && <>
        <path d="M12 9H8v31h23v-4" opacity=".55" />
        <path d="M15 5h24v30H15Z" fill="currentColor" fillOpacity=".12" />
        <path d="m27 12 2.5 6 4.5 2-4.5 2.5-2.5 6-2.5-6-4.5-2.5 4.5-2Z" fill="currentColor" stroke="none" />
        <path d="M19 8h4M34 29v3h-4" opacity=".7" />
      </>}
      {branchId === "redraw" && <>
        <path d="M8 22a16 16 0 0 1 27-10l3 3M40 26a16 16 0 0 1-27 10l-3-3" strokeWidth="3" />
        <path d="m32 7 7 8-11 1M16 41l-7-8 11-1" strokeWidth="2.8" />
      </>}
      {branchId === "wait" && <>
        <path d="M20 3h8M24 3v5M34 10l3-3M35 6l4 4" strokeWidth="2.5" />
        <circle cx="24" cy="27" r="16" strokeWidth="2.5" />
        <path d="M24 14v14l8-6M12 17l2 2M36 17l-2 2" strokeWidth="2" />
        <path d="M10 30a14 14 0 0 0 10 10" opacity=".4" />
      </>}
      {branchId === "mana" && <>
        <path d="m24 3 13 21-13 21L11 24Z" fill="currentColor" fillOpacity=".15" />
        <path d="m24 3 5 21-5 21-5-21ZM11 24h26M24 3v42" />
        <path d="m24 10 9 14-9 15" opacity=".6" />
      </>}
      {!fan && !["draw", "redraw", "wait", "mana"].includes(branchId) && <>
        <path d="m7 17 17-9 17 9-17 9Z" fill="currentColor" strokeWidth="1" />
        <path d="m7 22 17 9 17-9M7 27l17 9 17-9M7 32l17 9 17-9" strokeWidth="2.8" />
        <path d="M7 18v16M24 27v14M41 18v16" strokeWidth="1.2" opacity=".65" />
      </>}
    </svg>
  );
}

// 空槽左上角的紫色装饰符号 —— 稿子上每个槽位左上角都压着一枚向上的箭头标记。
// ⚠ 纯装饰, 不承载任何语义, 因此不进 itemArt 那张物品图标查找表。

export function SlotMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 18 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M9 22V3" />
      <path d="M3 9 9 2l6 7" />
      <path d="M4 15h2M12 15h2" />
    </svg>
  );
}

import type { ShowcasePreviewPage } from "./showcasePagination";
import s from "./PropShowcasePager.module.css";

/** 底部悬浮翻页条：上一页、页码、下一页，跨系列连续翻页并首尾循环；末尾显示本页启用数 / 物件数。 */
export function PropShowcasePager({ pages, activePage, enabledCount, onSelect }: {
  pages: readonly ShowcasePreviewPage[]; activePage: ShowcasePreviewPage; enabledCount: number; onSelect: (id: string) => void;
}) {
  const index = Math.max(0, pages.findIndex((page) => page.id === activePage.id));
  const single = pages.length < 2;
  const changePage = (offset: number) => onSelect(pages[(index + offset + pages.length) % pages.length].id);
  return <nav className={s.root} aria-label="物品演示翻页">
    <button type="button" className={s.button} onClick={() => changePage(-1)} disabled={single}>上一页</button>
    <span className={s.count} aria-live="polite">第 {index + 1} / {pages.length} 页</span>
    <button type="button" className={s.button} onClick={() => changePage(1)} disabled={single}>下一页</button>
    <span className={s.enabled} aria-live="polite">启用 {enabledCount}/{activePage.props.length}</span>
  </nav>;
}

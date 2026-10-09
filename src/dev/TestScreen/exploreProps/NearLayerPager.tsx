import { DEMO_NEAR_LAYERS } from "./demoNearLayers";
import s from "./PropShowcasePager.module.css";

/** 底部近景图层翻页：上一张、图层名与序号、下一张，首尾循环。样式与物品翻页条一致。 */
export function NearLayerPager({ activeId, onSelect }: { activeId: string; onSelect: (id: string) => void }) {
  const index = Math.max(0, DEMO_NEAR_LAYERS.findIndex((layer) => layer.id === activeId));
  const total = DEMO_NEAR_LAYERS.length;
  const single = total < 2;
  const changeLayer = (offset: number) => onSelect(DEMO_NEAR_LAYERS[(index + offset + total) % total].id);
  return <nav className={s.root} aria-label="近景图层翻页">
    <span className={s.title}>近景</span>
    <button type="button" className={s.button} onClick={() => changeLayer(-1)} disabled={single}>上一张</button>
    <span className={s.count} aria-live="polite">{DEMO_NEAR_LAYERS[index].name}（{index + 1}/{total}）</span>
    <button type="button" className={s.button} onClick={() => changeLayer(1)} disabled={single}>下一张</button>
  </nav>;
}

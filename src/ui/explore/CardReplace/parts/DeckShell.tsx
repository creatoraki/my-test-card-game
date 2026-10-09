// 卡组面板外壳: 有素材时整张 1920×1080 透明图按画布 1:1 贴; 素材未放入时用 CSS 画出
// 同坐标的深色底板(面板主体、卡组柜、舱位列、底栏), 保证布局可验收。纯装饰, 不吃命中。
import { DECK_SERVICE_ART } from "@/ui/art/explore/deckServiceArt";
import { CHAMBER_COLUMN, CHAMBER_FACTS, CHAMBER_HEAD, DECK, FOOT_NOTE, PANEL, rectStyle } from "./deckGeometry";
import s from "./DeckShell.module.css";

export function DeckShell() {
  if (DECK_SERVICE_ART.shell) {
    return <img className={s.art} src={DECK_SERVICE_ART.shell} alt="" draggable={false} aria-hidden />;
  }
  return (
    <div className={s.fallback} aria-hidden>
      <span className={s.panel} style={rectStyle(PANEL)} />
      <span className={s.well} style={rectStyle(DECK)} />
      <span className={s.column} style={rectStyle(CHAMBER_COLUMN)} />
      <span className={s.bar} style={rectStyle(CHAMBER_HEAD)} />
      <span className={s.glass} style={rectStyle(CHAMBER_FACTS)} />
      <span className={s.bar} style={rectStyle(FOOT_NOTE)} />
    </div>
  );
}

// 卡组面板页眉: 来源小标签 + 超大主标题(右侧三道绿色斜杠) + 说明。
import { HEADER } from "./deckGeometry";
import s from "./DeckHeader.module.css";

export function DeckHeader({ kicker, title, caption }: { kicker: string; title: string; caption: string }) {
  return (
    <header className={s.head} style={{ left: HEADER.x, top: HEADER.y }}>
      <span className={s.kicker}>{kicker}</span>
      <h2 className={s.title}>
        {title}
        <i className={s.slashes} aria-hidden />
      </h2>
      <p className={s.caption}>{caption}</p>
    </header>
  );
}

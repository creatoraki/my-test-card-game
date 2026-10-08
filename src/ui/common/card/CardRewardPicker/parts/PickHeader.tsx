// 三选一页眉: 小标签(箭头 + 字距加宽 + 渐隐细线)、渐变大标题、说明文字。落位见 PickHeader.module.css。
import { KickerArrow } from "./pickIcons";
import s from "./PickHeader.module.css";

interface Props {
  kicker: string;
  title: string;
  caption?: string;
}

export function PickHeader({ kicker, title, caption }: Props) {
  return (
    <header className={s.head}>
      <span className={s.kicker}>
        <KickerArrow className={s.arrow} />
        <span className={s.kickerText}>{kicker}</span>
        <span className={s.kickerLine} aria-hidden />
      </span>
      <h2 className={s.title} data-text={title}>{title}</h2>
      {caption && <p className={s.caption}>{caption}</p>}
    </header>
  );
}

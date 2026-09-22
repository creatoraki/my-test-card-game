// 编队卡的装饰外框: 内框(常驻, 斜切两角 + 角标) · 上阵外框(仅上阵时亮起) · 左上角编号牌。
// ★ 全部是纯装饰层, pointer-events: none, 不参与点击也不改变卡片尺寸。
// ⚠ 坐标按卡片 276×772 设计 px 直接写死 —— 卡片尺寸改了要一并改这里的 path。

import { cx } from "@/ui/common/cx";
import { crewSerial } from "./crewCardDecor";
import s from "./CrewFrame.module.css";

interface Props {
  index: number;
  onField: boolean;
}

export function CrewFrame({ index, onField }: Props) {
  return (
    <span className={cx(s.frame, onField && s["is-on"])} aria-hidden="true">
      {/* 上阵外框: 画在卡外 10px, 296×792 */}
      <svg className={s.outer} viewBox="0 0 296 792" fill="none">
        <path className={s["outer-line"]} d="M2 2 H272 L294 24 V790 H24 L2 768 Z" />
        <path className={s["outer-corner"]} d="M2 78 V2 H78" />
        <path className={s["outer-corner"]} d="M294 714 V790 H218" />
        <path className={s["outer-tick"]} d="M2 380 V412 M294 380 V412" />
      </svg>

      {/* 常驻内框: 内缩 8px, 右上 / 左下斜切 */}
      <svg className={s.inner} viewBox="0 0 276 772" fill="none">
        <path className={s["inner-line"]} d="M8 8 H250 L268 26 V764 H26 L8 746 Z" />
        <path className={s["inner-corner"]} d="M8 58 V8 H58" />
        <path className={s["inner-corner"]} d="M268 714 V764 H218" />
        <path className={s["inner-tick"]} d="M8 372 V400" />
        <path className={s["inner-hatch"]} d="M232 14 L240 22 M222 14 L230 22 M212 14 L220 22" />
      </svg>

      <span className={s.serial}>
        <span className={s.num}>{crewSerial(index)}</span>
        <span className={s.tag}>
          <span>SQUAD</span>
          <span>MEMBER</span>
        </span>
      </span>
      <svg className={s.mark} viewBox="0 0 40 12" fill="none">
        <path d="M2 2 L8 10 M8 2 L2 10 M16 2 L22 10 M22 2 L16 10" />
        <path d="M28 6 H38" />
      </svg>
    </span>
  );
}

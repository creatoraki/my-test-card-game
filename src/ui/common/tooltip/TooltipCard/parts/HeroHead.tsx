// 大头部(设计图 y104–468 → 高 123): 左侧徽章 + 大标题 + 下划线/星形徽记/斜条纹。
// 用于所有带图标的悬浮详情(状态、遗物、挑战、羁绊、手牌印记)。

import type { CSSProperties, ReactNode } from "react";
import { HeaderDecor } from "./HeaderDecor";
import { IconMedallion } from "./IconMedallion";
import s from "./HeroHead.module.css";

/** 标题可用宽度(左缘 154 → 星形徽记 372 前, 留出辉光余量)与字号上下限。 */
const TITLE_WIDTH = 206;
const TITLE_MAX_SIZE = 38;
const TITLE_MIN_SIZE = 22;
/** 字宽 = 1em + 0.04em 字距。 */
const CHAR_EM = 1.04;

/** 按字数把标题缩到一行放得下; 缩到下限仍放不下才省略。标题竖直中心保持不动(减去 1.24 行高的半行距 0.12em)。 */
function titleStyle(title: ReactNode): CSSProperties | undefined {
  if (typeof title !== "string") return undefined;
  const fit = Math.floor(TITLE_WIDTH / ([...title].length * CHAR_EM));
  const size = Math.max(TITLE_MIN_SIZE, Math.min(TITLE_MAX_SIZE, fit));
  if (size === TITLE_MAX_SIZE) return undefined;
  return { fontSize: size, top: Math.round(32 + (TITLE_MAX_SIZE - size) * 0.75 - size * 0.12) };
}

export function HeroHead({ icon, title, meta }: { icon: ReactNode; title?: ReactNode; meta?: ReactNode }) {
  return (
    <div className={s.head}>
      <IconMedallion>{icon}</IconMedallion>
      {title && <div className={s.name} style={titleStyle(title)}>{title}</div>}
      {meta && <div className={s.meta}>{meta}</div>}
      <HeaderDecor />
    </div>
  );
}

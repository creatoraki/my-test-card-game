// 大头部(设计图 y104–468 → 高 123): 左侧徽章 + 大标题 + 下划线/星形徽记/斜条纹。
// 用于所有带图标的悬浮详情(状态、遗物、挑战、羁绊、手牌印记)。

import type { ReactNode } from "react";
import { cx } from "@/ui/common/cx";
import { HeaderDecor } from "./HeaderDecor";
import { IconMedallion } from "./IconMedallion";
import s from "./HeroHead.module.css";

/** 超过这个字数的标题降一档字号, 免得长名字被截断。 */
const LONG_TITLE = 6;

export function HeroHead({ icon, title, meta }: { icon: ReactNode; title?: ReactNode; meta?: ReactNode }) {
  const long = typeof title === "string" && [...title].length > LONG_TITLE;
  return (
    <div className={s.head}>
      <IconMedallion>{icon}</IconMedallion>
      {title && <div className={cx(s.name, long && s["is-long"])}>{title}</div>}
      {meta && <div className={s.meta}>{meta}</div>}
      <HeaderDecor />
    </div>
  );
}

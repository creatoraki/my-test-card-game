// 物品格右上角的羁绊色签 —— 细线符号压在稀有度底色与立绘上几乎认不出,
// 改用「羁绊主题色实底 + 中文羁绊名」, 不同羁绊一眼靠颜色区分, 再靠文字确认。
// 位置默认贴右上角, 调用方用 --bond-tag-top / --bond-tag-right 微调。

import type { CSSProperties } from "react";
import type { BondDef } from "@/data/roster/bonds";
import { getArcanaAccent } from "@/ui/common/icon/ArcanaIcon";
import { cx } from "@/ui/common/shared/cx";
import s from "./BondTag.module.css";

export function bondAccent(def: BondDef): string {
  return getArcanaAccent(def.id) ?? def.color;
}

export function BondTag({ def, className }: { def: BondDef; className?: string }) {
  return (
    <span
      className={cx(s.tag, className)}
      style={{ "--bond-tag-color": bondAccent(def) } as CSSProperties}
      aria-hidden="true"
    >
      {def.name}
    </span>
  );
}

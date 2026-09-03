// 详情态右栏的工作区外壳 —— 一条 tab + 一块内容框。
//
// ★ 两个 tab(属性装备 / 卡组)取代了旧版的三个 tab: 属性表与装备槽在同一页并列,
//   换装候选借立绘位展开, 右半屏一次只做一件事。
// ★ 外壳只管框与切换; 内容由使用方作为 children 传进来 —— 面板各自独立, 互不认识。
// ★ 入场是「从左边缘裂开生长」(is-growing): 编队态的卡阵与本栏占同一条水平带(y 196..968),
//   于是重组时这块工作区正是在卡阵原地长出来的。

import type { CSSProperties, ReactNode } from "react";
import { cx } from "@/ui/common/cx";
import s from "./Workbench.module.css";

export type WorkbenchTab = "profile" | "deck";

const TABS: Array<{ key: WorkbenchTab; label: string }> = [
  { key: "profile", label: "属性装备" },
  { key: "deck", label: "卡组" },
];

interface Props {
  tab: WorkbenchTab;
  onTabChange: (tab: WorkbenchTab) => void;
  /** 右上读数: 可用经验(卡组锻造的唯一货币)。 */
  exp: number;
  /** 去程: 从左边缘裂开生长。 */
  growing: boolean;
  /** 回程: 向左收拢。 */
  leaving: boolean;
  children: ReactNode;
  style?: CSSProperties;
}

export function Workbench({ tab, onTabChange, exp, growing, leaving, children, style }: Props) {
  return (
    <section
      className={cx(s.bench, growing && s["is-growing"], leaving && s["is-leaving"])}
      style={style}
      aria-label="角色工作区"
    >
      <div className={s.head}>
        <div className={s.tabs} role="tablist" aria-label="工作区分页">
          {TABS.map(({ key, label }, i) => (
            <button
              key={key}
              className={cx(s.tab, tab === key && s["is-active"])}
              style={{ "--i": i } as CSSProperties}
              type="button"
              role="tab"
              aria-selected={tab === key}
              onClick={() => onTabChange(key)}
            >
              {label}
            </button>
          ))}
        </div>
        <span className={s.exp}>
          可用经验 <b>{exp}</b>
        </span>
      </div>

      {/* key 跟着 tab 变: 换页时内容重挂载 ⇒ 面板自己的错峰入场每次都从头播。 */}
      <div className={s.content} key={tab} role="tabpanel">
        {children}
      </div>
    </section>
  );
}

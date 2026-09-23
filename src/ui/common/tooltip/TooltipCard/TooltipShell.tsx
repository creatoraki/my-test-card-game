// 悬浮详情的统一外壳 —— 全项目所有悬浮详情(状态、遗物、羁绊、物品、普通说明……)都套这一层。
// 只负责: 量出自身尺寸 → 画 TooltipFrame 外框; 下发 --accent 主题色与基础字色。
// ★ 底色与外框一律是深海蓝, 各场景只能通过 accent 改强调色, 不再各自换底。

import type { CSSProperties, ReactNode } from "react";
import { useBoxSize } from "@/ui/common/frame/HudFrame";
import { cx } from "@/ui/common/shared/cx";
import { DEFAULT_ACCENT } from "./geometry";
import { TooltipFrame } from "./parts/TooltipFrame";
import s from "./TooltipShell.module.css";

export function TooltipShell({
  accent = DEFAULT_ACCENT,
  headHeight = 0,
  className,
  style,
  children,
}: {
  accent?: string;
  /** 头部内描边高度(见 geometry.HEAD_HEIGHT); 0 = 不画头部装饰。 */
  headHeight?: number;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  const { ref, size } = useBoxSize<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={cx(s.shell, className)}
      style={{ ...style, "--accent": accent } as CSSProperties}
    >
      <TooltipFrame width={size.width} height={size.height} headHeight={headHeight} />
      {children}
    </div>
  );
}

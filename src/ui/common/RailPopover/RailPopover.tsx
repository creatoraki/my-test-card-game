// 悬停详情的定位层: 找到最近的 [data-rail-item] 宿主, 悬停/聚焦时把内容 portal 到设计画布。
// ★ 外观统一交给 TooltipCard —— 本组件不画任何底色与边框。
// ★ 运镜 / 播放动画期间, 宿主外层挂 data-popover-mute 即可立即隐藏(见 RailTooltip)。

import type { ReactNode } from "react";
import { RailTooltip } from "./RailTooltip";

export type RailPopoverSide = "left" | "right" | "bottom" | "bottom-left" | "bottom-right" | "top" | "top-left" | "top-right";

export function RailPopover({ side, children }: { side: RailPopoverSide; children: ReactNode }) {
  return <RailTooltip side={side}>{children}</RailTooltip>;
}

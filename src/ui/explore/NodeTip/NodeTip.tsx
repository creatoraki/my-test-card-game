import type { CSSProperties } from "react";
import type { NodeEvent } from "@/explore/types";
import { nodeCenter, NODE_ICON_TOP, ROUTE_PANEL_W, TILE_BOX_H } from "@/ui/common/RouteBoard";
import { cx } from "@/ui/common/cx";
import s from "./NodeTip.module.css";

const TIP_W = 260;
const TIP_MAX_H = 150;

// 未知节点的占位文案 —— ⛔ 内容里**绝不能泄露真实事件**: 走到之前它就是「不知道」。
const UNKNOWN_TITLE = "未知节点";
const UNKNOWN_DESC = "信号被遮蔽, 无法识别该节点的事件类型。走到这里才能知道是什么。";

type HorizontalAlign = "left" | "center" | "right";

interface Props {
  event: NodeEvent;
  seg: number;
  lane: number;
  /** 未知节点(尚未走到, 见 board.hiddenNodes): 浮卡按占位渲染, 不读真实事件。 */
  hidden?: boolean;
}

export function NodeTip({ event, seg, lane, hidden = false }: Props) {
  const { x, y } = nodeCenter(seg, lane);
  const align: HorizontalAlign =
    x < TIP_W / 2 + 8
      ? "left"
      : x > ROUTE_PANEL_W - TIP_W / 2 - 8
        ? "right"
        : "center";
  const flipDown = y - NODE_ICON_TOP < TIP_MAX_H;
  const style = {
    left: `${x}px`,
    top: `${flipDown ? y + TILE_BOX_H : y - NODE_ICON_TOP - 10}px`,
  } as CSSProperties;

  return (
    <div
      className={cx(
        s["tip"],
        s[`k-${hidden ? "unknown" : event.kind}`],
        flipDown && s["is-below"],
        s[`align-${align}`],
      )}
      style={style}
    >
      <h3 className={s["tip-title"]}>{hidden ? UNKNOWN_TITLE : event.title}</h3>
      <p className={s["tip-desc"]}>{hidden ? UNKNOWN_DESC : event.description}</p>
    </div>
  );
}

export default NodeTip;

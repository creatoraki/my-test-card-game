import type { CSSProperties } from "react";
import type { NodeEvent } from "@/explore/types";
import { nodeCenter, NODE_ICON_TOP, ROUTE_PANEL_W, TILE_BOX_H } from "@/ui/common/RouteBoard";
import { cx } from "@/ui/common/cx";
import s from "./NodeTip.module.css";

const TIP_W = 260;
const TIP_MAX_H = 150;

type HorizontalAlign = "left" | "center" | "right";

interface Props {
  event: NodeEvent;
  seg: number;
  lane: number;
}

export function NodeTip({ event, seg, lane }: Props) {
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
      className={cx(s["tip"], s[`k-${event.kind}`], flipDown && s["is-below"], s[`align-${align}`])}
      style={style}
    >
      <h3 className={s["tip-title"]}>{event.title}</h3>
      <p className={s["tip-desc"]}>{event.description}</p>
    </div>
  );
}

export default NodeTip;
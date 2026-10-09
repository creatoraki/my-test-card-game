// 新皮肤卡面的镶嵌插槽(52 设计 px): 右上徽记列(PickFaceBadges)与卡外左上标记行(PickFaceMarks)共用。
// kind 决定外框配色; tipAt 决定悬停释义浮出的方向(右上列往左、卡外标记行往上)。
import type { ReactNode } from "react";
import s from "./PickSocket.module.css";

export type PickSocketKind = "virus" | "module" | "mark" | "grow" | "ripe" | "wither" | "rooted" | "resonance";

interface Props {
  kind: PickSocketKind;
  tip?: ReactNode;
  tipAt?: "left" | "top";
  /** 右下角压的大号数字(培育剩余回合 / 共鸣次数)。 */
  count?: ReactNode;
  children: ReactNode;
}

export function PickSocket({ kind, tip, tipAt = "left", count, children }: Props) {
  return (
    <span className={s.socket} data-kind={kind}>
      <span className={s.socketFace}>
        {children}
        {count != null && <span className={s.count}>{count}</span>}
      </span>
      {tip && <span className={s.tip} data-at={tipAt} role="tooltip">{tip}</span>}
    </span>
  );
}

export const socketIconClass = s.icon;
export const socketEmblemClass = s.emblem;
